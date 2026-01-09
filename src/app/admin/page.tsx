'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Snackbar from '../components/Snackbar';
import { decryptEmail } from '../lib/encryption';

interface User {
  _id: string;
  fullName: string;
  email: string;
  userType: string;
  farmerId?: string;
  buyerId?: string;
  emailVerified: boolean;
  userVerified: boolean;
  documentStatus?: string;
  createdAt: string;
}

interface VerificationDocument {
  documentType: string;
  fileName: string;
  fileUrl: string; // Vercel Blob URL
  fileSize?: number;
  fileType?: string;
  verified: boolean;
  verifiedBy: string | null;
  submittedAt: string;
  verifiedAt: string | null;
  status?: string;
}

interface VerificationDoc {
  _id: string;
  userId: string;
  farmerId?: string;
  buyerId?: string;
  kisanId?: string;
  kisanConsent?: boolean;
  documentStatus?: string;
  kisanIdVerified?: boolean;
  kisanIdVerifiedBy?: string;
  kisanIdVerifiedAt?: string;
  kisanIdRejectionReason?: string;
  kisanIdRejectedAt?: string;
  documents: VerificationDocument[];
  submittedAt: string;
  updatedAt: string;
}

interface PendingProduct {
  _id: string;
  productId: string;
  title: string;
  type: string;
  category: string;
  description: string;
  price: number;
  adminNotes?: string;
  images: string[];
  videos: string[];
  verificationStatus: string;
  submittedBy: {
    userId: string;
    email: string;
    userType: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [activeMainTab, setActiveMainTab] = useState<
    'users' | 'pending' | 'products' | 'payments'
  >('users');
  const [activeUserTab, setActiveUserTab] = useState<
    'farmers' | 'buyers' | 'admins' | 'owner'
  >('farmers');
  const [users, setUsers] = useState<User[]>([]);
  const [verificationDocs, setVerificationDocs] = useState<VerificationDoc[]>(
    []
  );
  const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<PendingProduct | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ userType: string } | null>(
    null
  );
  const [snackbar, setSnackbar] = useState({
    isOpen: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  // Rejection modal state (for documents)
  const [rejectionModal, setRejectionModal] = useState({
    isOpen: false,
    userId: '',
    documentType: '',
    userEmail: '',
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  // Product rejection modal state
  const [productRejectionModal, setProductRejectionModal] = useState({
    isOpen: false,
    productId: '',
    productTitle: '',
  });
  const [productRejectionReason, setProductRejectionReason] = useState('');
  const [productCustomReason, setProductCustomReason] = useState('');

  const rejectionReasons = [
    'Document is not clear or readable',
    'Document is expired',
    'Document does not match the required type',
    'Information is incomplete or incorrect',
    'Document appears to be tampered or fake',
    'Wrong document uploaded',
    'Poor image quality',
    'Other',
  ];

  const productRejectionReasons = [
    'Product does not meet quality standards',
    'Incomplete or inaccurate product information',
    'Product images are unclear or inadequate',
    'Product already exists in catalog',
    'Product category is incorrect',
    'Pricing information is unrealistic',
    'Product description is insufficient',
    'Not suitable for our platform',
    'Other',
  ];

  const showSnackbar = (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) => {
    setSnackbar({
      isOpen: true,
      message,
      type,
    });
  };

  const closeSnackbar = () => {
    setSnackbar((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  // Handle document verification actions
  const handleDocumentAction = async (
    userId: string,
    documentType: string,
    action: 'accept' | 'reject',
    userEmail?: string
  ) => {
    // If reject action, show rejection modal
    if (action === 'reject') {
      setRejectionModal({
        isOpen: true,
        userId,
        documentType,
        userEmail: userEmail || '',
      });
      setRejectionReason('');
      setCustomReason('');
      return;
    }

    // For accept action, proceed directly
    try {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      const user = userData ? JSON.parse(userData) : null;

      const response = await fetch('/api/verification-docs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          documentType,
          action,
          adminEmail: user?.email || 'admin',
        }),
      });

      const result = await response.json();

      if (result.success) {
        showSnackbar(`Document ${action}ed successfully!`, 'success');

        // Refresh data
        const usersResponse = await fetch('/api/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData.data || []);
        }

        const docsResponse = await fetch('/api/verification-docs', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (docsResponse.ok) {
          const docsData = await docsResponse.json();
          setVerificationDocs(docsData.data || []);
        }
      } else {
        showSnackbar(result.message || 'Failed to update document', 'error');
      }
    } catch (error) {
      console.error('Error updating document:', error);
      showSnackbar('Error updating document', 'error');
    }
  };

  // Confirm rejection with reason
  const confirmRejection = async () => {
    const finalReason =
      rejectionReason === 'Other' ? customReason : rejectionReason;

    if (!finalReason) {
      showSnackbar('Please select or enter a rejection reason', 'warning');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      const user = userData ? JSON.parse(userData) : null;

      const response = await fetch('/api/verification-docs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: rejectionModal.userId,
          documentType: rejectionModal.documentType,
          action: 'reject',
          adminEmail: user?.email || 'admin',
          rejectionReason: finalReason,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showSnackbar('Document rejected successfully!', 'success');

        // Close modal
        setRejectionModal({
          isOpen: false,
          userId: '',
          documentType: '',
          userEmail: '',
        });
        setRejectionReason('');
        setCustomReason('');

        // Refresh data
        const usersResponse = await fetch('/api/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData.data || []);
        }

        const docsResponse = await fetch('/api/verification-docs', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (docsResponse.ok) {
          const docsData = await docsResponse.json();
          setVerificationDocs(docsData.data || []);
        }
      } else {
        showSnackbar(result.message || 'Failed to reject document', 'error');
      }
    } catch (error) {
      console.error('Error rejecting document:', error);
      showSnackbar('Error rejecting document', 'error');
    }
  };

  // Get verification docs for a user
  const getUserDocs = (userId: string) => {
    return verificationDocs.find((doc) => doc.userId === userId);
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete user "${userName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/user?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        showSnackbar(`User "${userName}" deleted successfully!`, 'success');

        // Refresh user list
        const usersResponse = await fetch('/api/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData.data || []);
        }

        // Refresh verification docs
        const docsResponse = await fetch('/api/verification-docs', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (docsResponse.ok) {
          const docsData = await docsResponse.json();
          setVerificationDocs(docsData.data || []);
        }
      } else {
        showSnackbar(result.message || 'Failed to delete user', 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showSnackbar('Error deleting user', 'error');
    }
  };

  // Product Management Handlers
  const handleApproveProduct = async (productId: string) => {
    try {
      const token = localStorage.getItem('authToken');

      // Find the product to get current/edited values
      const product =
        editingProduct && editingProduct._id === productId
          ? editingProduct
          : pendingProducts.find((p) => p._id === productId);

      if (!product) {
        showSnackbar('Product not found', 'error');
        return;
      }

      const response = await fetch(`/api/products/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          action: 'approve',
          updatedData: {
            title: product.title,
            type: product.type,
            description: product.description,
            price: product.price,
            adminNotes: product.adminNotes,
          },
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showSnackbar('Product approved successfully!', 'success');
        setPendingProducts((prev) => prev.filter((p) => p._id !== productId));
        setEditingProduct(null);
        setExpandedProduct(null);
      } else {
        throw new Error(result.message || 'Failed to approve product');
      }
    } catch (error) {
      console.error('Error approving product:', error);
      showSnackbar(
        `Error: ${
          error instanceof Error ? error.message : 'Failed to approve product'
        }`,
        'error'
      );
    }
  };

  const handleRejectProduct = async (
    productId: string,
    productTitle: string
  ) => {
    // Open rejection modal
    setProductRejectionModal({
      isOpen: true,
      productId,
      productTitle,
    });
    setProductRejectionReason('');
    setProductCustomReason('');
  };

  // Confirm product rejection with reason
  const confirmProductRejection = async () => {
    const finalReason =
      productRejectionReason === 'Other'
        ? productCustomReason
        : productRejectionReason;

    if (!finalReason) {
      showSnackbar('Please select or enter a rejection reason', 'warning');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/products/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: productRejectionModal.productId,
          action: 'reject',
          rejectionReason: finalReason,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showSnackbar(
          'Product rejected and removed successfully. Email sent to submitter.',
          'success'
        );
        setPendingProducts((prev) =>
          prev.filter((p) => p._id !== productRejectionModal.productId)
        );
        setExpandedProduct(null);
        setEditingProduct(null);

        // Close modal
        setProductRejectionModal({
          isOpen: false,
          productId: '',
          productTitle: '',
        });
        setProductRejectionReason('');
        setProductCustomReason('');
      } else {
        throw new Error(result.message || 'Failed to reject product');
      }
    } catch (error) {
      console.error('Error rejecting product:', error);
      showSnackbar(
        `Error: ${
          error instanceof Error ? error.message : 'Failed to reject product'
        }`,
        'error'
      );
    }
  };

  useEffect(() => {
    // Check authorization
    const userData = localStorage.getItem('userData');
    if (!userData) {
      showSnackbar('Please login to access admin panel', 'error');
      setTimeout(() => router.push('/login'), 2000);
      return;
    }

    try {
      const user = JSON.parse(userData);
      console.log('User data:', user);
      console.log('User type:', user.userType);

      // Strict access control: Only admin and owner can access
      if (user.userType !== 'admin' && user.userType !== 'owner') {
        showSnackbar('Access denied. Admin/Owner access required.', 'error');
        setTimeout(() => router.push('/'), 2000);
        return;
      }

      setCurrentUser(user);
      setAuthorized(true);
    } catch (error) {
      console.error('Error parsing user data:', error);
      showSnackbar('Authentication error', 'error');
      setTimeout(() => router.push('/login'), 2000);
    }
  }, [router]);

  useEffect(() => {
    if (!authorized) return;

    // Fetch users
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/user', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          setUsers(result.data || []);
        } else {
          showSnackbar('Failed to fetch users', 'error');
        }

        // Fetch verification documents
        const docsResponse = await fetch('/api/verification-docs', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (docsResponse.ok) {
          const docsData = await docsResponse.json();
          setVerificationDocs(docsData.data || []);
        }

        // Fetch all products and filter for pending ones
        const productsResponse = await fetch('/api/products', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (productsResponse.ok) {
          const allProducts = await productsResponse.json();
          // Filter products with verificationStatus === 'pending'
          const pendingProductsList = Array.isArray(allProducts)
            ? allProducts.filter((p: any) => p.verificationStatus === 'pending')
            : [];
          setPendingProducts(pendingProductsList);
        }

        // Fetch pending payments
        const paymentsResponse = await fetch(
          '/api/interactions?adminView=true&paymentStatus=pending',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (paymentsResponse.ok) {
          const paymentsData = await paymentsResponse.json();
          setPendingPayments(paymentsData.data || []);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        showSnackbar('Error loading users', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [authorized]);

  // Group users by type - only show verified users in User Management
  const farmers = users.filter(
    (u) => u.userType === 'farmer' && u.userVerified === true
  );
  const buyers = users.filter(
    (u) => u.userType === 'buyer' && u.userVerified === true
  );
  const admins = users.filter(
    (u) => u.userType === 'admin' && u.userVerified === true
  );
  const owners = users.filter(
    (u) => u.userType === 'owner' && u.userVerified === true
  );

  // Helper to check if user has pending optional documents
  const hasOptionalDocumentsPending = (userId: string) => {
    const userDocs = getUserDocs(userId);
    if (!userDocs || !userDocs.documents || userDocs.documents.length === 0) {
      return false;
    }

    // Normalize document type for comparison
    const normalizeDocType = (type: string) => {
      return type.toLowerCase().trim().replace(/\s+/g, '_');
    };

    const mandatoryTypes = [
      'aadhaar',
      'aadhaar_card',
      'aadhar',
      'land_registration',
      'land_records',
      'company_incorporation',
      'director_pan',
      'director_aadhaar',
    ];

    // Filter optional documents
    const optionalDocs = userDocs.documents.filter((doc) => {
      const normalizedType = normalizeDocType(doc.documentType);
      return !mandatoryTypes.includes(normalizedType);
    });

    // Check if any optional document is pending
    const hasOptionalPending = optionalDocs.some(
      (doc) => !doc.verified && doc.status !== 'rejected'
    );

    return hasOptionalPending;
  };

  // Filter pending users (farmers and buyers only)
  // Include users with:
  // 1. Email not verified
  // 2. User not verified (mandatory verification pending)
  // 3. Document status not verified (mandatory documents pending)
  // 4. User verified but has optional documents pending
  const pendingUsers = users.filter((u) => {
    if (u.userType !== 'farmer' && u.userType !== 'buyer') {
      return false;
    }

    // Check for mandatory verification pending
    const mandatoryPending =
      !u.emailVerified ||
      !u.userVerified ||
      (u.userType === 'farmer' && u.documentStatus !== 'verified');

    // Check for optional documents pending
    const optionalPending = hasOptionalDocumentsPending(u._id);

    return mandatoryPending || optionalPending;
  });

  // Separate pending users into groups
  const mandatoryPendingUsers = pendingUsers.filter((u) => {
    return (
      !u.emailVerified ||
      !u.userVerified ||
      (u.userType === 'farmer' && u.documentStatus !== 'verified')
    );
  });

  const optionalPendingUsers = pendingUsers.filter((u) => {
    // User is verified but has optional documents pending
    return (
      u.emailVerified &&
      u.userVerified &&
      (u.userType !== 'farmer' || u.documentStatus === 'verified') &&
      hasOptionalDocumentsPending(u._id)
    );
  });

  const getUsersByTab = () => {
    switch (activeUserTab) {
      case 'farmers':
        return farmers;
      case 'buyers':
        return buyers;
      case 'admins':
        return admins;
      case 'owner':
        return owners;
      default:
        return [];
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!authorized) {
    return (
      <>
        <Header />
        <div
          style={{
            background: '#f1f8e9',
            minHeight: 'calc(100vh - 180px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <div
            style={{
              background: '#fff3e0',
              border: '2px solid #ff9800',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <h2 style={{ color: '#e65100', margin: '0 0 0.5rem 0' }}>
              Access Denied
            </h2>
            <p style={{ color: '#6d4c41', margin: 0 }}>Redirecting...</p>
          </div>
        </div>
        <Footer />
        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          isOpen={snackbar.isOpen}
          onClose={closeSnackbar}
          duration={3000}
        />
      </>
    );
  }

  return (
    <>
      <Header />
      <div
        style={{
          background: '#f1f8e9',
          minHeight: 'calc(100vh - 180px)',
          padding: '2rem',
          fontFamily: 'Arial, Georgia, serif',
        }}
      >
        <style>{`
          .admin-container {
            max-width: 1400px;
            margin: 0 auto;
          }
          .main-tabs {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            border-bottom: 3px solid #c8e6c9;
          }
          .main-tab {
            padding: 1rem 2rem;
            background: transparent;
            border: none;
            cursor: pointer;
            font-size: 1.2rem;
            font-weight: bold;
            color: #6d4c41;
            border-bottom: 3px solid transparent;
            margin-bottom: -3px;
            transition: all 0.3s ease;
          }
          .main-tab.active {
            color: #388e3c;
            border-bottom-color: #388e3c;
          }
          .main-tab:hover {
            color: #388e3c;
          }
          .sub-tabs {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 2rem;
            flex-wrap: wrap;
          }
          .sub-tab {
            padding: 0.75rem 1.5rem;
            background: #e8f5e9;
            border: 2px solid #c8e6c9;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: bold;
            color: #6d4c41;
            transition: all 0.3s ease;
          }
          .sub-tab.active {
            background: #388e3c;
            color: white;
            border-color: #388e3c;
          }
          .sub-tab:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(56, 142, 60, 0.3);
          }
          .users-table {
            width: 100%;
            background: white;
            border-radius: 12px;
            overflow-x: auto;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .users-table table {
            width: 100%;
            border-collapse: collapse;
            min-width: 800px;
          }
          .users-table th {
            background: #388e3c;
            color: white;
            padding: 1rem;
            text-align: left;
            font-weight: bold;
          }
          .users-table td {
            padding: 1rem;
            border-bottom: 1px solid #e0e0e0;
            color: #000000;
          }
          .users-table tr:hover {
            background: #f1f8e9;
          }
          .status-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: bold;
          }
          .status-verified {
            background: #c8e6c9;
            color: #2e7d32;
          }
          .status-pending {
            background: #fff9c4;
            color: #f57f17;
          }
          .status-unverified {
            background: #ffcdd2;
            color: #c62828;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          /* Mobile Responsive Styles - 768px and below */
          @media (max-width: 768px) {
            .admin-container {
              padding: 0;
            }
            .main-tabs {
              flex-direction: column;
              gap: 0.5rem;
            }
            .main-tab {
              padding: 0.75rem 1rem;
              font-size: 1rem;
              text-align: left;
            }
            .sub-tabs {
              gap: 0.5rem;
            }
            .sub-tab {
              padding: 0.5rem 1rem;
              font-size: 0.9rem;
              flex: 1 1 auto;
            }
            /* Hide table headers on mobile */
            .users-table thead {
              display: none;
            }
            /* Make each row a stacked card */
            .users-table table,
            .users-table tbody,
            .users-table tr {
              display: block;
              width: 100%;
            }
            .users-table tr {
              margin-bottom: 1rem;
              border: 2px solid #c8e6c9;
              border-radius: 8px;
              background: white;
              padding: 0;
              overflow: hidden;
            }
            .users-table tr:hover {
              background: white;
              box-shadow: 0 4px 12px rgba(56, 142, 60, 0.2);
            }
            /* Make each cell display as label-value pair */
            .users-table td {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 0.75rem 1rem;
              border-bottom: 1px solid #e8f5e9;
              text-align: right;
            }
            .users-table td:last-child {
              border-bottom: none;
            }
            /* Add labels before each value */
            .users-table td::before {
              content: attr(data-label);
              font-weight: bold;
              color: #388e3c;
              text-align: left;
              padding-right: 1rem;
              flex-shrink: 0;
            }
            /* First cell (Name) - special styling */
            .users-table tr td:first-child {
              background: #e8f5e9;
              border-bottom: 2px solid #c8e6c9;
            }
          }
        `}</style>

        <div className='admin-container'>
          <h1
            style={{
              color: '#388e3c',
              fontSize: '2.5rem',
              marginBottom: '0.5rem',
            }}
          >
            Admin Dashboard
          </h1>
          <p
            style={{
              color: '#6d4c41',
              fontSize: '1.1rem',
              marginBottom: '2rem',
            }}
          >
            Manage users and products
          </p>

          {/* Main Tabs */}
          <div className='main-tabs'>
            <button
              className={`main-tab ${
                activeMainTab === 'users' ? 'active' : ''
              }`}
              onClick={() => setActiveMainTab('users')}
            >
              👥 User Management
            </button>
            <button
              className={`main-tab ${
                activeMainTab === 'pending' ? 'active' : ''
              }`}
              onClick={() => setActiveMainTab('pending')}
            >
              ⏳ Pending Access ({pendingUsers.length})
            </button>
            <button
              className={`main-tab ${
                activeMainTab === 'products' ? 'active' : ''
              }`}
              onClick={() => setActiveMainTab('products')}
            >
              📦 Product Management
            </button>
            <button
              className={`main-tab ${
                activeMainTab === 'payments' ? 'active' : ''
              }`}
              onClick={() => setActiveMainTab('payments')}
            >
              💳 Payment Verification ({pendingPayments.length})
            </button>
          </div>

          {/* User Management Tab */}
          {activeMainTab === 'users' && (
            <div>
              {/* Sub Tabs */}
              <div className='sub-tabs'>
                {/* Farmers and Buyers - visible to both admin and owner */}
                <button
                  className={`sub-tab ${
                    activeUserTab === 'farmers' ? 'active' : ''
                  }`}
                  onClick={() => setActiveUserTab('farmers')}
                >
                  🌾 Farmers ({farmers.length})
                </button>
                <button
                  className={`sub-tab ${
                    activeUserTab === 'buyers' ? 'active' : ''
                  }`}
                  onClick={() => setActiveUserTab('buyers')}
                >
                  🛒 Buyers ({buyers.length})
                </button>

                {/* Admins and Owner - only visible to owner */}
                {currentUser?.userType === 'owner' && (
                  <>
                    <button
                      className={`sub-tab ${
                        activeUserTab === 'admins' ? 'active' : ''
                      }`}
                      onClick={() => setActiveUserTab('admins')}
                    >
                      👨‍💼 Admins ({admins.length})
                    </button>
                    <button
                      className={`sub-tab ${
                        activeUserTab === 'owner' ? 'active' : ''
                      }`}
                      onClick={() => setActiveUserTab('owner')}
                    >
                      👑 Owner ({owners.length})
                    </button>
                  </>
                )}
              </div>

              {/* Users Table */}
              {loading ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '4rem',
                    background: 'white',
                    borderRadius: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '4px solid #c8e6c9',
                      borderTop: '4px solid #388e3c',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  ></div>
                  <span
                    style={{
                      marginLeft: '1rem',
                      color: '#388e3c',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                    }}
                  >
                    Loading users...
                  </span>
                </div>
              ) : getUsersByTab().length === 0 ? (
                <div
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '3rem',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    📭
                  </div>
                  <h3 style={{ color: '#757575', margin: 0 }}>
                    No {activeUserTab} found
                  </h3>
                </div>
              ) : (
                <div className='users-table'>
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>ID</th>
                        <th>Email</th>
                        <th>Email Verified</th>
                        <th>User Verified</th>
                        <th>Documents</th>
                        <th>Joined Date</th>
                        {(currentUser?.userType === 'admin' ||
                          currentUser?.userType === 'owner') && (
                          <th>Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {getUsersByTab().map((user) => (
                        <tr key={user._id}>
                          <td
                            data-label='Name'
                            style={{ fontWeight: 'bold', color: '#388e3c' }}
                          >
                            {user.fullName}
                          </td>
                          <td data-label='ID'>
                            {user.farmerId || user.buyerId ? (
                              <code
                                style={{
                                  background: '#e3f2fd',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '4px',
                                  fontSize: '0.9rem',
                                }}
                              >
                                {user.farmerId || user.buyerId}
                              </code>
                            ) : (
                              <span style={{ color: '#999' }}>-</span>
                            )}
                          </td>
                          <td data-label='Email'>{decryptEmail(user.email)}</td>
                          <td data-label='Email Verified'>
                            <span
                              className={`status-badge ${
                                user.emailVerified
                                  ? 'status-verified'
                                  : 'status-unverified'
                              }`}
                            >
                              {user.emailVerified
                                ? '✓ Verified'
                                : '✗ Unverified'}
                            </span>
                          </td>
                          <td data-label='User Verified'>
                            <span
                              className={`status-badge ${
                                user.userVerified
                                  ? 'status-verified'
                                  : 'status-unverified'
                              }`}
                            >
                              {user.userVerified
                                ? '✓ Verified'
                                : '✗ Unverified'}
                            </span>
                          </td>
                          <td data-label='Documents'>
                            <span
                              className={`status-badge ${
                                user.documentStatus === 'verified'
                                  ? 'status-verified'
                                  : user.documentStatus === 'pending'
                                  ? 'status-pending'
                                  : 'status-unverified'
                              }`}
                            >
                              {user.documentStatus === 'verified'
                                ? '✓ Verified'
                                : user.documentStatus === 'pending'
                                ? '⏳ Pending'
                                : '✗ Not Submitted'}
                            </span>
                          </td>
                          <td
                            data-label='Joined Date'
                            style={{ color: '#6d4c41' }}
                          >
                            {formatDate(user.createdAt)}
                          </td>
                          {(currentUser?.userType === 'admin' ||
                            currentUser?.userType === 'owner') && (
                            <td
                              data-label='Actions'
                              style={{ textAlign: 'center' }}
                            >
                              <button
                                onClick={() =>
                                  handleDeleteUser(user._id, user.fullName)
                                }
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '1.5rem',
                                  padding: '0.5rem',
                                  transition: 'all 0.2s ease',
                                  borderRadius: '4px',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#ffebee';
                                  e.currentTarget.style.transform =
                                    'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background =
                                    'transparent';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                                title={`Delete user ${user.fullName}`}
                              >
                                🗑️
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Pending Access Tab */}
          {activeMainTab === 'pending' && (
            <div>
              <div
                style={{
                  background: '#fff3e0',
                  border: '2px solid #ff9800',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                <strong style={{ color: '#e65100' }}>ℹ️ Pending Access:</strong>{' '}
                <span style={{ color: '#6d4c41' }}>
                  Users with pending email verification, user verification,
                  document verification, or optional documents
                </span>
              </div>

              {loading ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '4rem',
                    background: 'white',
                    borderRadius: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '4px solid #c8e6c9',
                      borderTop: '4px solid #388e3c',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginRight: '1rem',
                    }}
                  ></div>
                  <span style={{ color: '#388e3c', fontWeight: 'bold' }}>
                    Loading pending users...
                  </span>
                </div>
              ) : pendingUsers.length === 0 ? (
                <div
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '3rem',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    ✅
                  </div>
                  <h3 style={{ color: '#388e3c', margin: 0 }}>
                    No pending verifications
                  </h3>
                  <p style={{ color: '#6d4c41', marginTop: '0.5rem' }}>
                    All users are fully verified!
                  </p>
                </div>
              ) : (
                <>
                  {/* Mandatory Verification Pending Section */}
                  {mandatoryPendingUsers.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                      <div
                        style={{
                          background: '#ffebee',
                          border: '2px solid #f44336',
                          borderRadius: '8px',
                          padding: '0.75rem 1rem',
                          marginBottom: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                        <strong style={{ color: '#c62828' }}>
                          Mandatory Verification Pending
                        </strong>
                        <span
                          style={{
                            marginLeft: 'auto',
                            background: '#c62828',
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                          }}
                        >
                          {mandatoryPendingUsers.length} User
                          {mandatoryPendingUsers.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className='users-table'>
                        <table>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>User Type</th>
                              <th>ID</th>
                              <th>Email</th>
                              <th>Email Verified</th>
                              <th>User Verified</th>
                              <th>Documents</th>
                              <th>Joined Date</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mandatoryPendingUsers.map((user) => {
                              const userDocs = getUserDocs(user._id);
                              const isExpanded = expandedUser === user._id;

                              return (
                                <React.Fragment key={user._id}>
                                  <tr>
                                    <td
                                      data-label='Name'
                                      style={{
                                        fontWeight: 'bold',
                                        color: '#388e3c',
                                      }}
                                    >
                                      {user.fullName}
                                      {userDocs &&
                                        (userDocs.documents.length > 0 ||
                                          (userDocs.kisanId &&
                                            userDocs.kisanConsent)) && (
                                          <button
                                            onClick={() =>
                                              setExpandedUser(
                                                isExpanded ? null : user._id
                                              )
                                            }
                                            style={{
                                              marginLeft: '0.5rem',
                                              background: '#388e3c',
                                              color: 'white',
                                              border: 'none',
                                              borderRadius: '4px',
                                              padding: '0.25rem 0.5rem',
                                              cursor: 'pointer',
                                              fontSize: '0.8rem',
                                            }}
                                          >
                                            {isExpanded
                                              ? '▼ Hide Docs'
                                              : '▶ Show Docs'}
                                          </button>
                                        )}
                                    </td>
                                    <td data-label='User Type'>
                                      <span
                                        style={{
                                          background:
                                            user.userType === 'farmer'
                                              ? '#e8f5e9'
                                              : '#e3f2fd',
                                          color:
                                            user.userType === 'farmer'
                                              ? '#2e7d32'
                                              : '#1565c0',
                                          padding: '0.25rem 0.5rem',
                                          borderRadius: '4px',
                                          fontSize: '0.85rem',
                                          fontWeight: 'bold',
                                        }}
                                      >
                                        {user.userType === 'farmer'
                                          ? '🌾 Farmer'
                                          : '🛒 Buyer'}
                                      </span>
                                    </td>
                                    <td data-label='ID'>
                                      {user.farmerId || user.buyerId ? (
                                        <code
                                          style={{
                                            background: '#e3f2fd',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.9rem',
                                          }}
                                        >
                                          {user.farmerId || user.buyerId}
                                        </code>
                                      ) : (
                                        <span style={{ color: '#999' }}>-</span>
                                      )}
                                    </td>
                                    <td data-label='Email'>
                                      {decryptEmail(user.email)}
                                    </td>
                                    <td data-label='Email Verified'>
                                      <span
                                        className={`status-badge ${
                                          user.emailVerified
                                            ? 'status-verified'
                                            : 'status-unverified'
                                        }`}
                                      >
                                        {user.emailVerified
                                          ? '✓ Verified'
                                          : '✗ Unverified'}
                                      </span>
                                    </td>
                                    <td data-label='User Verified'>
                                      <span
                                        className={`status-badge ${
                                          user.userVerified
                                            ? 'status-verified'
                                            : 'status-unverified'
                                        }`}
                                      >
                                        {user.userVerified
                                          ? '✓ Verified'
                                          : '✗ Unverified'}
                                      </span>
                                    </td>
                                    <td data-label='Documents'>
                                      {(() => {
                                        // Helper to normalize document type
                                        const normalizeDocType = (
                                          type: string
                                        ) => {
                                          return type
                                            .toLowerCase()
                                            .trim()
                                            .replace(/\s+/g, '_');
                                        };

                                        const mandatoryTypes = [
                                          'aadhaar',
                                          'aadhaar_card',
                                          'aadhar',
                                          'land_registration',
                                          'land_records',
                                          'company_incorporation',
                                          'director_pan',
                                          'director_aadhaar',
                                        ];

                                        // Check for Kisan ID verification
                                        const hasKisanVerification =
                                          userDocs?.kisanId &&
                                          userDocs?.kisanConsent === true;

                                        // Categorize documents
                                        const mandatoryDocs =
                                          userDocs?.documents.filter((doc) => {
                                            const normalizedType =
                                              normalizeDocType(
                                                doc.documentType
                                              );
                                            return mandatoryTypes.includes(
                                              normalizedType
                                            );
                                          }) || [];

                                        const optionalDocs =
                                          userDocs?.documents.filter((doc) => {
                                            const normalizedType =
                                              normalizeDocType(
                                                doc.documentType
                                              );
                                            return !mandatoryTypes.includes(
                                              normalizedType
                                            );
                                          }) || [];

                                        // Count pending documents
                                        const pendingMandatory =
                                          mandatoryDocs.filter(
                                            (doc) =>
                                              !doc.verified &&
                                              doc.status !== 'rejected'
                                          ).length;

                                        const pendingOptional =
                                          optionalDocs.filter(
                                            (doc) =>
                                              !doc.verified &&
                                              doc.status !== 'rejected'
                                          ).length;

                                        // Render based on verification method
                                        if (hasKisanVerification) {
                                          // Kisan ID verification
                                          return (
                                            <div
                                              style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.25rem',
                                              }}
                                            >
                                              <span
                                                className={`status-badge ${
                                                  user.documentStatus ===
                                                  'verified'
                                                    ? 'status-verified'
                                                    : 'status-pending'
                                                }`}
                                              >
                                                {user.documentStatus ===
                                                'verified'
                                                  ? '✓ Kisan ID Verified'
                                                  : '⏳ Kisan ID Pending'}
                                              </span>
                                              {optionalDocs.length > 0 && (
                                                <span
                                                  style={{
                                                    fontSize: '0.75rem',
                                                    color: '#666',
                                                  }}
                                                >
                                                  Optional: {pendingOptional}/
                                                  {optionalDocs.length} pending
                                                </span>
                                              )}
                                            </div>
                                          );
                                        } else {
                                          // Document verification
                                          return (
                                            <div
                                              style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.25rem',
                                              }}
                                            >
                                              <span
                                                className={`status-badge ${
                                                  user.documentStatus ===
                                                  'verified'
                                                    ? 'status-verified'
                                                    : user.documentStatus ===
                                                      'pending'
                                                    ? 'status-pending'
                                                    : 'status-unverified'
                                                }`}
                                              >
                                                {user.documentStatus ===
                                                'verified'
                                                  ? '✓ Verified'
                                                  : user.documentStatus ===
                                                    'pending'
                                                  ? '⏳ Pending'
                                                  : '✗ Not Submitted'}
                                              </span>
                                              {user.documentStatus ===
                                                'pending' && (
                                                <>
                                                  {mandatoryDocs.length > 0 && (
                                                    <span
                                                      style={{
                                                        fontSize: '0.75rem',
                                                        color: '#c62828',
                                                        fontWeight: 'bold',
                                                      }}
                                                    >
                                                      Required:{' '}
                                                      {pendingMandatory}/
                                                      {mandatoryDocs.length}{' '}
                                                      pending
                                                    </span>
                                                  )}
                                                  {optionalDocs.length > 0 && (
                                                    <span
                                                      style={{
                                                        fontSize: '0.75rem',
                                                        color: '#1565c0',
                                                      }}
                                                    >
                                                      Optional:{' '}
                                                      {pendingOptional}/
                                                      {optionalDocs.length}{' '}
                                                      pending
                                                    </span>
                                                  )}
                                                </>
                                              )}
                                            </div>
                                          );
                                        }
                                      })()}
                                    </td>
                                    <td
                                      data-label='Joined Date'
                                      style={{ color: '#6d4c41' }}
                                    >
                                      {formatDate(user.createdAt)}
                                    </td>
                                    <td data-label='Actions'>
                                      <button
                                        onClick={() =>
                                          handleDeleteUser(
                                            user._id,
                                            user.fullName
                                          )
                                        }
                                        style={{
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '4px',
                                          padding: '0.5rem 0.75rem',
                                          cursor: 'pointer',
                                          fontSize: '0.85rem',
                                          fontWeight: 'bold',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.25rem',
                                          transition: 'all 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background =
                                            '#cccccc';
                                          e.currentTarget.style.transform =
                                            'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background =
                                            'transparent';
                                          e.currentTarget.style.transform =
                                            'scale(1)';
                                        }}
                                        title={`Delete user ${user.fullName}`}
                                      >
                                        🗑️
                                      </button>
                                    </td>
                                  </tr>

                                  {/* Expanded Documents Row */}
                                  {isExpanded && userDocs && (
                                    <tr>
                                      <td
                                        colSpan={8}
                                        style={{
                                          padding: 0,
                                          background: '#f5f5f5',
                                        }}
                                      >
                                        <div style={{ padding: '1rem' }}>
                                          <h4
                                            style={{
                                              color: '#388e3c',
                                              marginTop: 0,
                                            }}
                                          >
                                            📄 Submitted Documents
                                          </h4>
                                          {userDocs.documents.length === 0 &&
                                          !userDocs.kisanId ? (
                                            <p style={{ color: '#757575' }}>
                                              No documents submitted yet
                                            </p>
                                          ) : (
                                            <>
                                              {/* Define mandatory and optional document types */}
                                              {(() => {
                                                // Normalize document type for comparison
                                                const normalizeDocType = (
                                                  type: string
                                                ) => {
                                                  return type
                                                    .toLowerCase()
                                                    .trim()
                                                    .replace(/\s+/g, '_');
                                                };

                                                const mandatoryTypes = [
                                                  'aadhaar',
                                                  'aadhaar_card',
                                                  'aadhar',
                                                  'land_registration',
                                                  'land_records',
                                                  'company_incorporation',
                                                  'director_pan',
                                                  'director_aadhaar',
                                                ];

                                                const mandatoryDocs =
                                                  userDocs.documents.filter(
                                                    (doc) => {
                                                      const normalizedType =
                                                        normalizeDocType(
                                                          doc.documentType
                                                        );
                                                      return mandatoryTypes.includes(
                                                        normalizedType
                                                      );
                                                    }
                                                  );

                                                const optionalDocs =
                                                  userDocs.documents.filter(
                                                    (doc) => {
                                                      const normalizedType =
                                                        normalizeDocType(
                                                          doc.documentType
                                                        );
                                                      return !mandatoryTypes.includes(
                                                        normalizedType
                                                      );
                                                    }
                                                  );

                                                // Check if Kisan ID verification is used
                                                const hasKisanVerification =
                                                  userDocs.kisanId &&
                                                  userDocs.kisanConsent ===
                                                    true;

                                                // Debug logging
                                                console.log(
                                                  'User docs:',
                                                  userDocs
                                                );
                                                console.log(
                                                  'Kisan ID:',
                                                  userDocs.kisanId
                                                );
                                                console.log(
                                                  'Kisan Consent:',
                                                  userDocs.kisanConsent
                                                );
                                                console.log(
                                                  'Has Kisan Verification:',
                                                  hasKisanVerification
                                                );
                                                console.log(
                                                  'All documents:',
                                                  userDocs.documents.map(
                                                    (d) => ({
                                                      type: d.documentType,
                                                      normalized:
                                                        normalizeDocType(
                                                          d.documentType
                                                        ),
                                                    })
                                                  )
                                                );

                                                return (
                                                  <>
                                                    {/* Mandatory Documents Section */}
                                                    <div
                                                      style={{
                                                        marginBottom: '2rem',
                                                      }}
                                                    >
                                                      <div
                                                        style={{
                                                          background: '#ffebee',
                                                          border:
                                                            '2px solid #f44336',
                                                          borderRadius: '8px',
                                                          padding:
                                                            '0.75rem 1rem',
                                                          marginBottom: '1rem',
                                                          display: 'flex',
                                                          alignItems: 'center',
                                                          gap: '0.5rem',
                                                        }}
                                                      >
                                                        <span
                                                          style={{
                                                            fontSize: '1.2rem',
                                                          }}
                                                        >
                                                          ⚠️
                                                        </span>
                                                        <strong
                                                          style={{
                                                            color: '#c62828',
                                                          }}
                                                        >
                                                          Mandatory Documents
                                                        </strong>
                                                        <span
                                                          style={{
                                                            marginLeft: 'auto',
                                                            background:
                                                              '#c62828',
                                                            color: 'white',
                                                            padding:
                                                              '0.25rem 0.75rem',
                                                            borderRadius:
                                                              '12px',
                                                            fontSize: '0.85rem',
                                                            fontWeight: 'bold',
                                                          }}
                                                        >
                                                          {(hasKisanVerification
                                                            ? 1
                                                            : 0) +
                                                            mandatoryDocs.length}{' '}
                                                          Submitted
                                                        </span>
                                                      </div>
                                                      {!hasKisanVerification &&
                                                      mandatoryDocs.length ===
                                                        0 ? (
                                                        <div
                                                          style={{
                                                            background: 'white',
                                                            border:
                                                              '2px dashed #e0e0e0',
                                                            borderRadius: '8px',
                                                            padding: '2rem',
                                                            textAlign: 'center',
                                                            color: '#999',
                                                          }}
                                                        >
                                                          <p
                                                            style={{
                                                              margin: 0,
                                                              fontSize:
                                                                '0.9rem',
                                                            }}
                                                          >
                                                            No mandatory
                                                            documents submitted
                                                            yet
                                                          </p>
                                                          <p
                                                            style={{
                                                              margin:
                                                                '0.5rem 0 0 0',
                                                              fontSize:
                                                                '0.85rem',
                                                            }}
                                                          >
                                                            Required: Aadhaar,
                                                            Land Registration,
                                                            Land Records
                                                          </p>
                                                        </div>
                                                      ) : (
                                                        <div
                                                          style={{
                                                            display: 'grid',
                                                            gap: '1rem',
                                                          }}
                                                        >
                                                          {/* Kisan ID as Mandatory Document */}
                                                          {hasKisanVerification && (
                                                            <div
                                                              style={{
                                                                background:
                                                                  'white',
                                                                border: `2px solid ${
                                                                  userDocs.documentStatus ===
                                                                  'verified'
                                                                    ? '#4caf50'
                                                                    : userDocs.documentStatus ===
                                                                      'rejected'
                                                                    ? '#f44336'
                                                                    : '#ff9800'
                                                                }`,
                                                                borderRadius:
                                                                  '8px',
                                                                padding: '1rem',
                                                              }}
                                                            >
                                                              <div
                                                                style={{
                                                                  fontWeight:
                                                                    'bold',
                                                                  color:
                                                                    '#388e3c',
                                                                  marginBottom:
                                                                    '0.5rem',
                                                                  display:
                                                                    'flex',
                                                                  alignItems:
                                                                    'center',
                                                                  gap: '0.5rem',
                                                                }}
                                                              >
                                                                <span
                                                                  style={{
                                                                    background:
                                                                      '#ffebee',
                                                                    color:
                                                                      '#c62828',
                                                                    padding:
                                                                      '0.2rem 0.5rem',
                                                                    borderRadius:
                                                                      '4px',
                                                                    fontSize:
                                                                      '0.75rem',
                                                                    fontWeight:
                                                                      'bold',
                                                                  }}
                                                                >
                                                                  REQUIRED
                                                                </span>
                                                                🆔 Kisan Credit
                                                                Card ID
                                                                <span
                                                                  style={{
                                                                    marginLeft:
                                                                      'auto',
                                                                    background:
                                                                      userDocs.documentStatus ===
                                                                      'verified'
                                                                        ? '#4caf50'
                                                                        : userDocs.documentStatus ===
                                                                          'rejected'
                                                                        ? '#f44336'
                                                                        : '#ff9800',
                                                                    color:
                                                                      'white',
                                                                    padding:
                                                                      '0.25rem 0.75rem',
                                                                    borderRadius:
                                                                      '12px',
                                                                    fontSize:
                                                                      '0.75rem',
                                                                    fontWeight:
                                                                      'bold',
                                                                  }}
                                                                >
                                                                  {userDocs.documentStatus ===
                                                                  'verified'
                                                                    ? '✓ Verified'
                                                                    : userDocs.documentStatus ===
                                                                      'rejected'
                                                                    ? '✗ Rejected'
                                                                    : '⏳ Pending'}
                                                                </span>
                                                              </div>
                                                              <div
                                                                style={{
                                                                  fontSize:
                                                                    '0.9rem',
                                                                  color: '#666',
                                                                  marginBottom:
                                                                    '0.75rem',
                                                                }}
                                                              >
                                                                <div
                                                                  style={{
                                                                    marginBottom:
                                                                      '0.5rem',
                                                                  }}
                                                                >
                                                                  <strong>
                                                                    Kisan ID:
                                                                  </strong>{' '}
                                                                  <span
                                                                    style={{
                                                                      fontFamily:
                                                                        'monospace',
                                                                      color:
                                                                        '#2e7d32',
                                                                    }}
                                                                  >
                                                                    {
                                                                      userDocs.kisanId
                                                                    }
                                                                  </span>
                                                                </div>
                                                                <div
                                                                  style={{
                                                                    marginBottom:
                                                                      '0.5rem',
                                                                  }}
                                                                >
                                                                  <strong>
                                                                    Consent:
                                                                  </strong>{' '}
                                                                  ✓ Provided
                                                                </div>
                                                                <div>
                                                                  <strong>
                                                                    Submitted:
                                                                  </strong>{' '}
                                                                  {new Date(
                                                                    userDocs.submittedAt
                                                                  ).toLocaleDateString(
                                                                    'en-US',
                                                                    {
                                                                      year: 'numeric',
                                                                      month:
                                                                        'short',
                                                                      day: 'numeric',
                                                                      hour: '2-digit',
                                                                      minute:
                                                                        '2-digit',
                                                                    }
                                                                  )}
                                                                </div>
                                                              </div>

                                                              {/* Verification Details */}
                                                              {userDocs.documentStatus ===
                                                                'verified' &&
                                                                userDocs.kisanIdVerified && (
                                                                  <div
                                                                    style={{
                                                                      background:
                                                                        '#e8f5e9',
                                                                      border:
                                                                        '1px solid #4caf50',
                                                                      borderRadius:
                                                                        '4px',
                                                                      padding:
                                                                        '0.75rem',
                                                                      marginBottom:
                                                                        '0.75rem',
                                                                      fontSize:
                                                                        '0.85rem',
                                                                    }}
                                                                  >
                                                                    <div
                                                                      style={{
                                                                        color:
                                                                          '#2e7d32',
                                                                        fontWeight:
                                                                          'bold',
                                                                        marginBottom:
                                                                          '0.5rem',
                                                                      }}
                                                                    >
                                                                      ✓
                                                                      Verification
                                                                      Details:
                                                                    </div>
                                                                    <div
                                                                      style={{
                                                                        color:
                                                                          '#666',
                                                                      }}
                                                                    >
                                                                      <div>
                                                                        Verified
                                                                        By:{' '}
                                                                        {userDocs.kisanIdVerifiedBy ||
                                                                          'N/A'}
                                                                      </div>
                                                                      <div>
                                                                        Verified
                                                                        On:{' '}
                                                                        {userDocs.kisanIdVerifiedAt
                                                                          ? new Date(
                                                                              userDocs.kisanIdVerifiedAt
                                                                            ).toLocaleDateString(
                                                                              'en-US',
                                                                              {
                                                                                year: 'numeric',
                                                                                month:
                                                                                  'short',
                                                                                day: 'numeric',
                                                                                hour: '2-digit',
                                                                                minute:
                                                                                  '2-digit',
                                                                              }
                                                                            )
                                                                          : 'N/A'}
                                                                      </div>
                                                                    </div>
                                                                  </div>
                                                                )}

                                                              {/* Rejection Details */}
                                                              {userDocs.documentStatus ===
                                                                'rejected' &&
                                                                userDocs.kisanIdRejectionReason && (
                                                                  <div
                                                                    style={{
                                                                      background:
                                                                        '#ffebee',
                                                                      border:
                                                                        '1px solid #f44336',
                                                                      borderRadius:
                                                                        '4px',
                                                                      padding:
                                                                        '0.75rem',
                                                                      marginBottom:
                                                                        '0.75rem',
                                                                      fontSize:
                                                                        '0.85rem',
                                                                    }}
                                                                  >
                                                                    <div
                                                                      style={{
                                                                        color:
                                                                          '#d32f2f',
                                                                        fontWeight:
                                                                          'bold',
                                                                        marginBottom:
                                                                          '0.5rem',
                                                                      }}
                                                                    >
                                                                      ❌
                                                                      Rejection
                                                                      Reason:
                                                                    </div>
                                                                    <div
                                                                      style={{
                                                                        color:
                                                                          '#666',
                                                                      }}
                                                                    >
                                                                      {
                                                                        userDocs.kisanIdRejectionReason
                                                                      }
                                                                    </div>
                                                                    {userDocs.kisanIdRejectedAt && (
                                                                      <div
                                                                        style={{
                                                                          color:
                                                                            '#999',
                                                                          fontSize:
                                                                            '0.8rem',
                                                                          marginTop:
                                                                            '0.5rem',
                                                                        }}
                                                                      >
                                                                        Rejected
                                                                        on:{' '}
                                                                        {new Date(
                                                                          userDocs.kisanIdRejectedAt
                                                                        ).toLocaleDateString(
                                                                          'en-US',
                                                                          {
                                                                            year: 'numeric',
                                                                            month:
                                                                              'short',
                                                                            day: 'numeric',
                                                                            hour: '2-digit',
                                                                            minute:
                                                                              '2-digit',
                                                                          }
                                                                        )}
                                                                      </div>
                                                                    )}
                                                                  </div>
                                                                )}

                                                              {/* Action Buttons */}
                                                              {userDocs.documentStatus !==
                                                                'verified' && (
                                                                <div
                                                                  style={{
                                                                    display:
                                                                      'flex',
                                                                    gap: '0.5rem',
                                                                    justifyContent:
                                                                      'flex-end',
                                                                  }}
                                                                >
                                                                  <button
                                                                    onClick={() =>
                                                                      handleDocumentAction(
                                                                        user._id,
                                                                        'kisanId',
                                                                        'accept'
                                                                      )
                                                                    }
                                                                    style={{
                                                                      background:
                                                                        '#4caf50',
                                                                      color:
                                                                        'white',
                                                                      border:
                                                                        'none',
                                                                      borderRadius:
                                                                        '4px',
                                                                      padding:
                                                                        '0.5rem 1rem',
                                                                      cursor:
                                                                        'pointer',
                                                                      fontSize:
                                                                        '0.85rem',
                                                                      fontWeight:
                                                                        'bold',
                                                                    }}
                                                                  >
                                                                    ✓ Accept
                                                                  </button>
                                                                  <button
                                                                    onClick={() =>
                                                                      handleDocumentAction(
                                                                        user._id,
                                                                        'kisanId',
                                                                        'reject'
                                                                      )
                                                                    }
                                                                    style={{
                                                                      background:
                                                                        '#f44336',
                                                                      color:
                                                                        'white',
                                                                      border:
                                                                        'none',
                                                                      borderRadius:
                                                                        '4px',
                                                                      padding:
                                                                        '0.5rem 1rem',
                                                                      cursor:
                                                                        'pointer',
                                                                      fontSize:
                                                                        '0.85rem',
                                                                      fontWeight:
                                                                        'bold',
                                                                    }}
                                                                  >
                                                                    ✗ Reject
                                                                  </button>
                                                                </div>
                                                              )}
                                                            </div>
                                                          )}

                                                          {/* Other Mandatory Documents */}
                                                          {mandatoryDocs.map(
                                                            (doc, index) => (
                                                              <div
                                                                key={`mandatory-${index}`}
                                                                style={{
                                                                  background:
                                                                    'white',
                                                                  border: `2px solid ${
                                                                    doc.verified
                                                                      ? '#4caf50'
                                                                      : doc.status ===
                                                                        'rejected'
                                                                      ? '#f44336'
                                                                      : '#ff9800'
                                                                  }`,
                                                                  borderRadius:
                                                                    '8px',
                                                                  padding:
                                                                    '1rem',
                                                                  display:
                                                                    'flex',
                                                                  justifyContent:
                                                                    'space-between',
                                                                  alignItems:
                                                                    'center',
                                                                  flexWrap:
                                                                    'wrap',
                                                                  gap: '1rem',
                                                                }}
                                                              >
                                                                <div
                                                                  style={{
                                                                    flex: 1,
                                                                  }}
                                                                >
                                                                  <div
                                                                    style={{
                                                                      fontWeight:
                                                                        'bold',
                                                                      color:
                                                                        '#388e3c',
                                                                      marginBottom:
                                                                        '0.5rem',
                                                                      display:
                                                                        'flex',
                                                                      alignItems:
                                                                        'center',
                                                                      gap: '0.5rem',
                                                                    }}
                                                                  >
                                                                    <span
                                                                      style={{
                                                                        background:
                                                                          '#ffebee',
                                                                        color:
                                                                          '#c62828',
                                                                        padding:
                                                                          '0.2rem 0.5rem',
                                                                        borderRadius:
                                                                          '4px',
                                                                        fontSize:
                                                                          '0.75rem',
                                                                        fontWeight:
                                                                          'bold',
                                                                      }}
                                                                    >
                                                                      REQUIRED
                                                                    </span>
                                                                    {
                                                                      doc.documentType
                                                                    }
                                                                  </div>
                                                                  <div
                                                                    style={{
                                                                      fontSize:
                                                                        '0.9rem',
                                                                      color:
                                                                        '#666',
                                                                    }}
                                                                  >
                                                                    📎{' '}
                                                                    {
                                                                      doc.fileName
                                                                    }
                                                                  </div>
                                                                  {doc.fileSize && (
                                                                    <div
                                                                      style={{
                                                                        fontSize:
                                                                          '0.85rem',
                                                                        color:
                                                                          '#999',
                                                                        marginTop:
                                                                          '0.25rem',
                                                                      }}
                                                                    >
                                                                      Size:{' '}
                                                                      {(
                                                                        doc.fileSize /
                                                                        1024
                                                                      ).toFixed(
                                                                        2
                                                                      )}{' '}
                                                                      KB
                                                                    </div>
                                                                  )}
                                                                  <div
                                                                    style={{
                                                                      fontSize:
                                                                        '0.85rem',
                                                                      color:
                                                                        '#666',
                                                                      marginTop:
                                                                        '0.25rem',
                                                                    }}
                                                                  >
                                                                    Submitted:{' '}
                                                                    {new Date(
                                                                      doc.submittedAt
                                                                    ).toLocaleDateString()}
                                                                  </div>
                                                                  {doc.verifiedBy && (
                                                                    <div
                                                                      style={{
                                                                        fontSize:
                                                                          '0.85rem',
                                                                        color:
                                                                          '#666',
                                                                        marginTop:
                                                                          '0.25rem',
                                                                      }}
                                                                    >
                                                                      Verified
                                                                      by:{' '}
                                                                      {
                                                                        doc.verifiedBy
                                                                      }
                                                                    </div>
                                                                  )}
                                                                </div>

                                                                <div
                                                                  style={{
                                                                    display:
                                                                      'flex',
                                                                    gap: '0.5rem',
                                                                    alignItems:
                                                                      'center',
                                                                  }}
                                                                >
                                                                  <span
                                                                    className={`status-badge ${
                                                                      doc.verified
                                                                        ? 'status-verified'
                                                                        : doc.status ===
                                                                          'rejected'
                                                                        ? 'status-unverified'
                                                                        : 'status-pending'
                                                                    }`}
                                                                    style={{
                                                                      marginRight:
                                                                        '0.5rem',
                                                                    }}
                                                                  >
                                                                    {doc.verified
                                                                      ? '✓ Verified'
                                                                      : doc.status ===
                                                                        'rejected'
                                                                      ? '✗ Rejected'
                                                                      : '⏳ Pending'}
                                                                  </span>

                                                                  <a
                                                                    href={
                                                                      doc.fileUrl
                                                                    }
                                                                    download={
                                                                      doc.fileName
                                                                    }
                                                                    target='_blank'
                                                                    rel='noopener noreferrer'
                                                                    style={{
                                                                      background:
                                                                        '#2196f3',
                                                                      color:
                                                                        'white',
                                                                      border:
                                                                        'none',
                                                                      borderRadius:
                                                                        '4px',
                                                                      padding:
                                                                        '0.5rem 1rem',
                                                                      cursor:
                                                                        'pointer',
                                                                      textDecoration:
                                                                        'none',
                                                                      fontSize:
                                                                        '0.85rem',
                                                                      display:
                                                                        'inline-block',
                                                                    }}
                                                                  >
                                                                    ⬇️ Download
                                                                  </a>

                                                                  {!doc.verified &&
                                                                    doc.status !==
                                                                      'rejected' && (
                                                                      <>
                                                                        <button
                                                                          onClick={() =>
                                                                            handleDocumentAction(
                                                                              user._id,
                                                                              doc.documentType,
                                                                              'accept'
                                                                            )
                                                                          }
                                                                          style={{
                                                                            background:
                                                                              '#4caf50',
                                                                            color:
                                                                              'white',
                                                                            border:
                                                                              'none',
                                                                            borderRadius:
                                                                              '4px',
                                                                            padding:
                                                                              '0.5rem 1rem',
                                                                            cursor:
                                                                              'pointer',
                                                                            fontSize:
                                                                              '0.85rem',
                                                                            fontWeight:
                                                                              'bold',
                                                                          }}
                                                                        >
                                                                          ✓
                                                                          Accept
                                                                        </button>
                                                                        <button
                                                                          onClick={() =>
                                                                            handleDocumentAction(
                                                                              user._id,
                                                                              doc.documentType,
                                                                              'reject'
                                                                            )
                                                                          }
                                                                          style={{
                                                                            background:
                                                                              '#f44336',
                                                                            color:
                                                                              'white',
                                                                            border:
                                                                              'none',
                                                                            borderRadius:
                                                                              '4px',
                                                                            padding:
                                                                              '0.5rem 1rem',
                                                                            cursor:
                                                                              'pointer',
                                                                            fontSize:
                                                                              '0.85rem',
                                                                            fontWeight:
                                                                              'bold',
                                                                          }}
                                                                        >
                                                                          ✗
                                                                          Reject
                                                                        </button>
                                                                      </>
                                                                    )}
                                                                </div>
                                                              </div>
                                                            )
                                                          )}
                                                        </div>
                                                      )}
                                                    </div>

                                                    {/* Optional Documents Section */}
                                                    {optionalDocs.length >
                                                      0 && (
                                                      <div>
                                                        <div
                                                          style={{
                                                            background:
                                                              '#e3f2fd',
                                                            border:
                                                              '2px solid #2196f3',
                                                            borderRadius: '8px',
                                                            padding:
                                                              '0.75rem 1rem',
                                                            marginBottom:
                                                              '1rem',
                                                            display: 'flex',
                                                            alignItems:
                                                              'center',
                                                            gap: '0.5rem',
                                                          }}
                                                        >
                                                          <span
                                                            style={{
                                                              fontSize:
                                                                '1.2rem',
                                                            }}
                                                          >
                                                            ℹ️
                                                          </span>
                                                          <strong
                                                            style={{
                                                              color: '#1565c0',
                                                            }}
                                                          >
                                                            Optional Documents
                                                          </strong>
                                                          <span
                                                            style={{
                                                              marginLeft:
                                                                'auto',
                                                              background:
                                                                '#1565c0',
                                                              color: 'white',
                                                              padding:
                                                                '0.25rem 0.75rem',
                                                              borderRadius:
                                                                '12px',
                                                              fontSize:
                                                                '0.85rem',
                                                              fontWeight:
                                                                'bold',
                                                            }}
                                                          >
                                                            {
                                                              optionalDocs.length
                                                            }{' '}
                                                            Additional
                                                          </span>
                                                        </div>
                                                        <div
                                                          style={{
                                                            display: 'grid',
                                                            gap: '1rem',
                                                          }}
                                                        >
                                                          {optionalDocs.map(
                                                            (doc, index) => (
                                                              <div
                                                                key={`optional-${index}`}
                                                                style={{
                                                                  background:
                                                                    'white',
                                                                  border: `2px solid ${
                                                                    doc.verified
                                                                      ? '#4caf50'
                                                                      : doc.status ===
                                                                        'rejected'
                                                                      ? '#f44336'
                                                                      : '#ff9800'
                                                                  }`,
                                                                  borderRadius:
                                                                    '8px',
                                                                  padding:
                                                                    '1rem',
                                                                  display:
                                                                    'flex',
                                                                  justifyContent:
                                                                    'space-between',
                                                                  alignItems:
                                                                    'center',
                                                                  flexWrap:
                                                                    'wrap',
                                                                  gap: '1rem',
                                                                }}
                                                              >
                                                                <div
                                                                  style={{
                                                                    flex: 1,
                                                                  }}
                                                                >
                                                                  <div
                                                                    style={{
                                                                      fontWeight:
                                                                        'bold',
                                                                      color:
                                                                        '#388e3c',
                                                                      marginBottom:
                                                                        '0.5rem',
                                                                      display:
                                                                        'flex',
                                                                      alignItems:
                                                                        'center',
                                                                      gap: '0.5rem',
                                                                    }}
                                                                  >
                                                                    <span
                                                                      style={{
                                                                        background:
                                                                          '#e3f2fd',
                                                                        color:
                                                                          '#1565c0',
                                                                        padding:
                                                                          '0.2rem 0.5rem',
                                                                        borderRadius:
                                                                          '4px',
                                                                        fontSize:
                                                                          '0.75rem',
                                                                        fontWeight:
                                                                          'bold',
                                                                      }}
                                                                    >
                                                                      OPTIONAL
                                                                    </span>
                                                                    {
                                                                      doc.documentType
                                                                    }
                                                                  </div>
                                                                  <div
                                                                    style={{
                                                                      fontSize:
                                                                        '0.9rem',
                                                                      color:
                                                                        '#666',
                                                                    }}
                                                                  >
                                                                    📎{' '}
                                                                    {
                                                                      doc.fileName
                                                                    }
                                                                  </div>
                                                                  {doc.fileSize && (
                                                                    <div
                                                                      style={{
                                                                        fontSize:
                                                                          '0.85rem',
                                                                        color:
                                                                          '#999',
                                                                        marginTop:
                                                                          '0.25rem',
                                                                      }}
                                                                    >
                                                                      Size:{' '}
                                                                      {(
                                                                        doc.fileSize /
                                                                        1024
                                                                      ).toFixed(
                                                                        2
                                                                      )}{' '}
                                                                      KB
                                                                    </div>
                                                                  )}
                                                                  <div
                                                                    style={{
                                                                      fontSize:
                                                                        '0.85rem',
                                                                      color:
                                                                        '#666',
                                                                      marginTop:
                                                                        '0.25rem',
                                                                    }}
                                                                  >
                                                                    Submitted:{' '}
                                                                    {new Date(
                                                                      doc.submittedAt
                                                                    ).toLocaleDateString()}
                                                                  </div>
                                                                  {doc.verifiedBy && (
                                                                    <div
                                                                      style={{
                                                                        fontSize:
                                                                          '0.85rem',
                                                                        color:
                                                                          '#666',
                                                                        marginTop:
                                                                          '0.25rem',
                                                                      }}
                                                                    >
                                                                      Verified
                                                                      by:{' '}
                                                                      {
                                                                        doc.verifiedBy
                                                                      }
                                                                    </div>
                                                                  )}
                                                                </div>

                                                                <div
                                                                  style={{
                                                                    display:
                                                                      'flex',
                                                                    gap: '0.5rem',
                                                                    alignItems:
                                                                      'center',
                                                                  }}
                                                                >
                                                                  <span
                                                                    className={`status-badge ${
                                                                      doc.verified
                                                                        ? 'status-verified'
                                                                        : doc.status ===
                                                                          'rejected'
                                                                        ? 'status-unverified'
                                                                        : 'status-pending'
                                                                    }`}
                                                                    style={{
                                                                      marginRight:
                                                                        '0.5rem',
                                                                    }}
                                                                  >
                                                                    {doc.verified
                                                                      ? '✓ Verified'
                                                                      : doc.status ===
                                                                        'rejected'
                                                                      ? '✗ Rejected'
                                                                      : '⏳ Pending'}
                                                                  </span>

                                                                  <a
                                                                    href={
                                                                      doc.fileUrl
                                                                    }
                                                                    download={
                                                                      doc.fileName
                                                                    }
                                                                    target='_blank'
                                                                    rel='noopener noreferrer'
                                                                    style={{
                                                                      background:
                                                                        '#2196f3',
                                                                      color:
                                                                        'white',
                                                                      border:
                                                                        'none',
                                                                      borderRadius:
                                                                        '4px',
                                                                      padding:
                                                                        '0.5rem 1rem',
                                                                      cursor:
                                                                        'pointer',
                                                                      textDecoration:
                                                                        'none',
                                                                      fontSize:
                                                                        '0.85rem',
                                                                      display:
                                                                        'inline-block',
                                                                    }}
                                                                  >
                                                                    ⬇️ Download
                                                                  </a>

                                                                  {!doc.verified &&
                                                                    doc.status !==
                                                                      'rejected' && (
                                                                      <>
                                                                        <button
                                                                          onClick={() =>
                                                                            handleDocumentAction(
                                                                              user._id,
                                                                              doc.documentType,
                                                                              'accept'
                                                                            )
                                                                          }
                                                                          style={{
                                                                            background:
                                                                              '#4caf50',
                                                                            color:
                                                                              'white',
                                                                            border:
                                                                              'none',
                                                                            borderRadius:
                                                                              '4px',
                                                                            padding:
                                                                              '0.5rem 1rem',
                                                                            cursor:
                                                                              'pointer',
                                                                            fontSize:
                                                                              '0.85rem',
                                                                            fontWeight:
                                                                              'bold',
                                                                          }}
                                                                        >
                                                                          ✓
                                                                          Accept
                                                                        </button>
                                                                        <button
                                                                          onClick={() =>
                                                                            handleDocumentAction(
                                                                              user._id,
                                                                              doc.documentType,
                                                                              'reject'
                                                                            )
                                                                          }
                                                                          style={{
                                                                            background:
                                                                              '#f44336',
                                                                            color:
                                                                              'white',
                                                                            border:
                                                                              'none',
                                                                            borderRadius:
                                                                              '4px',
                                                                            padding:
                                                                              '0.5rem 1rem',
                                                                            cursor:
                                                                              'pointer',
                                                                            fontSize:
                                                                              '0.85rem',
                                                                            fontWeight:
                                                                              'bold',
                                                                          }}
                                                                        >
                                                                          ✗
                                                                          Reject
                                                                        </button>
                                                                      </>
                                                                    )}
                                                                </div>
                                                              </div>
                                                            )
                                                          )}
                                                        </div>
                                                      </div>
                                                    )}
                                                  </>
                                                );
                                              })()}
                                            </>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Optional Verification Pending Section */}
                  {optionalPendingUsers.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                      <div
                        style={{
                          background: '#e3f2fd',
                          border: '2px solid #2196f3',
                          borderRadius: '8px',
                          padding: '0.75rem 1rem',
                          marginBottom: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
                        <strong style={{ color: '#1565c0' }}>
                          Optional Verification Pending
                        </strong>
                        <span
                          style={{
                            marginLeft: 'auto',
                            background: '#1565c0',
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                          }}
                        >
                          {optionalPendingUsers.length} Verified User
                          {optionalPendingUsers.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div
                        style={{
                          background: '#e8f5e9',
                          border: '1px solid #c8e6c9',
                          borderRadius: '8px',
                          padding: '0.75rem 1rem',
                          marginBottom: '1rem',
                          fontSize: '0.9rem',
                          color: '#2e7d32',
                        }}
                      >
                        ✓ These users are already verified and can access the
                        platform. Optional documents provide additional benefits
                        but are not required for platform access.
                      </div>
                      <div className='users-table'>
                        <table>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>User Type</th>
                              <th>ID</th>
                              <th>Email</th>
                              <th>Verification Status</th>
                              <th>Optional Docs Pending</th>
                              <th>Joined Date</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {optionalPendingUsers.map((user) => {
                              const userDocs = getUserDocs(user._id);
                              const isExpanded = expandedUser === user._id;

                              // Count pending optional documents
                              const normalizeDocType = (type: string) => {
                                return type
                                  .toLowerCase()
                                  .trim()
                                  .replace(/\s+/g, '_');
                              };
                              const mandatoryTypes = [
                                'aadhaar',
                                'aadhaar_card',
                                'aadhar',
                                'land_registration',
                                'land_records',
                                'company_incorporation',
                                'director_pan',
                                'director_aadhaar',
                              ];
                              const optionalDocs =
                                userDocs?.documents.filter((doc) => {
                                  const normalizedType = normalizeDocType(
                                    doc.documentType
                                  );
                                  return !mandatoryTypes.includes(
                                    normalizedType
                                  );
                                }) || [];
                              const pendingOptional = optionalDocs.filter(
                                (doc) =>
                                  !doc.verified && doc.status !== 'rejected'
                              ).length;

                              return (
                                <React.Fragment key={user._id}>
                                  <tr>
                                    <td
                                      data-label='Name'
                                      style={{
                                        fontWeight: 'bold',
                                        color: '#388e3c',
                                      }}
                                    >
                                      {user.fullName}
                                      {userDocs &&
                                        (userDocs.documents.length > 0 ||
                                          (userDocs.kisanId &&
                                            userDocs.kisanConsent)) && (
                                          <button
                                            onClick={() =>
                                              setExpandedUser(
                                                isExpanded ? null : user._id
                                              )
                                            }
                                            style={{
                                              marginLeft: '0.5rem',
                                              background: '#388e3c',
                                              color: 'white',
                                              border: 'none',
                                              borderRadius: '4px',
                                              padding: '0.25rem 0.5rem',
                                              cursor: 'pointer',
                                              fontSize: '0.8rem',
                                            }}
                                          >
                                            {isExpanded
                                              ? '▼ Hide Docs'
                                              : '▶ Show Docs'}
                                          </button>
                                        )}
                                    </td>
                                    <td data-label='User Type'>
                                      <span
                                        style={{
                                          background:
                                            user.userType === 'farmer'
                                              ? '#e8f5e9'
                                              : '#e3f2fd',
                                          color:
                                            user.userType === 'farmer'
                                              ? '#2e7d32'
                                              : '#1565c0',
                                          padding: '0.25rem 0.5rem',
                                          borderRadius: '4px',
                                          fontSize: '0.85rem',
                                          fontWeight: 'bold',
                                        }}
                                      >
                                        {user.userType === 'farmer'
                                          ? '🌾 Farmer'
                                          : '🛒 Buyer'}
                                      </span>
                                    </td>
                                    <td data-label='ID'>
                                      {user.farmerId || user.buyerId ? (
                                        <code
                                          style={{
                                            background: '#e3f2fd',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.9rem',
                                          }}
                                        >
                                          {user.farmerId || user.buyerId}
                                        </code>
                                      ) : (
                                        <span style={{ color: '#999' }}>-</span>
                                      )}
                                    </td>
                                    <td data-label='Email'>
                                      {decryptEmail(user.email)}
                                    </td>
                                    <td data-label='Verification Status'>
                                      <span className='status-badge status-verified'>
                                        ✓ User Verified
                                      </span>
                                    </td>
                                    <td data-label='Optional Docs Pending'>
                                      <span
                                        style={{
                                          background: '#e3f2fd',
                                          color: '#1565c0',
                                          padding: '0.25rem 0.5rem',
                                          borderRadius: '4px',
                                          fontSize: '0.85rem',
                                          fontWeight: 'bold',
                                        }}
                                      >
                                        {pendingOptional}/{optionalDocs.length}{' '}
                                        pending
                                      </span>
                                    </td>
                                    <td
                                      data-label='Joined Date'
                                      style={{ color: '#6d4c41' }}
                                    >
                                      {formatDate(user.createdAt)}
                                    </td>
                                    <td data-label='Actions'>
                                      <button
                                        onClick={() =>
                                          handleDeleteUser(
                                            user._id,
                                            user.fullName
                                          )
                                        }
                                        style={{
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '4px',
                                          padding: '0.5rem 0.75rem',
                                          cursor: 'pointer',
                                          fontSize: '0.85rem',
                                          fontWeight: 'bold',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.25rem',
                                          transition: 'all 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background =
                                            '#cccccc';
                                          e.currentTarget.style.transform =
                                            'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background =
                                            'transparent';
                                          e.currentTarget.style.transform =
                                            'scale(1)';
                                        }}
                                        title={`Delete user ${user.fullName}`}
                                      >
                                        🗑️
                                      </button>
                                    </td>
                                  </tr>

                                  {/* Expanded Documents Row - Same structure as mandatory pending users */}
                                  {isExpanded && userDocs && (
                                    <tr>
                                      <td
                                        colSpan={8}
                                        style={{
                                          padding: 0,
                                          background: '#f5f5f5',
                                        }}
                                      >
                                        <div style={{ padding: '1rem' }}>
                                          <h4
                                            style={{
                                              color: '#388e3c',
                                              marginTop: 0,
                                            }}
                                          >
                                            📄 Submitted Documents
                                          </h4>
                                          {userDocs.documents.length === 0 &&
                                          !userDocs.kisanId ? (
                                            <p style={{ color: '#757575' }}>
                                              No documents submitted yet
                                            </p>
                                          ) : (
                                            <>
                                              {(() => {
                                                const normalizeDocType = (
                                                  type: string
                                                ) => {
                                                  return type
                                                    .toLowerCase()
                                                    .trim()
                                                    .replace(/\s+/g, '_');
                                                };

                                                const mandatoryTypes = [
                                                  'aadhaar',
                                                  'aadhaar_card',
                                                  'aadhar',
                                                  'land_registration',
                                                  'land_records',
                                                  'company_incorporation',
                                                  'director_pan',
                                                  'director_aadhaar',
                                                ];

                                                const mandatoryDocs =
                                                  userDocs.documents.filter(
                                                    (doc) => {
                                                      const normalizedType =
                                                        normalizeDocType(
                                                          doc.documentType
                                                        );
                                                      return mandatoryTypes.includes(
                                                        normalizedType
                                                      );
                                                    }
                                                  );

                                                const optionalDocs =
                                                  userDocs.documents.filter(
                                                    (doc) => {
                                                      const normalizedType =
                                                        normalizeDocType(
                                                          doc.documentType
                                                        );
                                                      return !mandatoryTypes.includes(
                                                        normalizedType
                                                      );
                                                    }
                                                  );

                                                const hasKisanVerification =
                                                  userDocs.kisanId &&
                                                  userDocs.kisanConsent ===
                                                    true;

                                                return (
                                                  <>
                                                    {/* Optional Documents Section - Only show pending optional docs */}
                                                    {optionalDocs.length >
                                                      0 && (
                                                      <div>
                                                        <div
                                                          style={{
                                                            background:
                                                              '#e3f2fd',
                                                            border:
                                                              '2px solid #2196f3',
                                                            borderRadius: '8px',
                                                            padding:
                                                              '0.75rem 1rem',
                                                            marginBottom:
                                                              '1rem',
                                                            display: 'flex',
                                                            alignItems:
                                                              'center',
                                                            gap: '0.5rem',
                                                          }}
                                                        >
                                                          <span
                                                            style={{
                                                              fontSize:
                                                                '1.2rem',
                                                            }}
                                                          >
                                                            ℹ️
                                                          </span>
                                                          <strong
                                                            style={{
                                                              color: '#1565c0',
                                                            }}
                                                          >
                                                            Optional Documents
                                                            for Review
                                                          </strong>
                                                          <span
                                                            style={{
                                                              marginLeft:
                                                                'auto',
                                                              background:
                                                                '#1565c0',
                                                              color: 'white',
                                                              padding:
                                                                '0.25rem 0.75rem',
                                                              borderRadius:
                                                                '12px',
                                                              fontSize:
                                                                '0.85rem',
                                                              fontWeight:
                                                                'bold',
                                                            }}
                                                          >
                                                            {
                                                              optionalDocs.filter(
                                                                (d) =>
                                                                  !d.verified &&
                                                                  d.status !==
                                                                    'rejected'
                                                              ).length
                                                            }{' '}
                                                            Pending
                                                          </span>
                                                        </div>
                                                        <div
                                                          style={{
                                                            display: 'grid',
                                                            gap: '1rem',
                                                          }}
                                                        >
                                                          {optionalDocs.map(
                                                            (doc, index) => (
                                                              <div
                                                                key={`optional-${index}`}
                                                                style={{
                                                                  background:
                                                                    'white',
                                                                  border: `2px solid ${
                                                                    doc.verified
                                                                      ? '#4caf50'
                                                                      : doc.status ===
                                                                        'rejected'
                                                                      ? '#f44336'
                                                                      : '#ff9800'
                                                                  }`,
                                                                  borderRadius:
                                                                    '8px',
                                                                  padding:
                                                                    '1rem',
                                                                  display:
                                                                    'flex',
                                                                  justifyContent:
                                                                    'space-between',
                                                                  alignItems:
                                                                    'center',
                                                                  flexWrap:
                                                                    'wrap',
                                                                  gap: '1rem',
                                                                }}
                                                              >
                                                                <div
                                                                  style={{
                                                                    flex: 1,
                                                                  }}
                                                                >
                                                                  <div
                                                                    style={{
                                                                      fontWeight:
                                                                        'bold',
                                                                      color:
                                                                        '#388e3c',
                                                                      marginBottom:
                                                                        '0.5rem',
                                                                      display:
                                                                        'flex',
                                                                      alignItems:
                                                                        'center',
                                                                      gap: '0.5rem',
                                                                    }}
                                                                  >
                                                                    <span
                                                                      style={{
                                                                        background:
                                                                          '#e3f2fd',
                                                                        color:
                                                                          '#1565c0',
                                                                        padding:
                                                                          '0.2rem 0.5rem',
                                                                        borderRadius:
                                                                          '4px',
                                                                        fontSize:
                                                                          '0.75rem',
                                                                        fontWeight:
                                                                          'bold',
                                                                      }}
                                                                    >
                                                                      OPTIONAL
                                                                    </span>
                                                                    {
                                                                      doc.documentType
                                                                    }
                                                                  </div>
                                                                  <div
                                                                    style={{
                                                                      fontSize:
                                                                        '0.9rem',
                                                                      color:
                                                                        '#666',
                                                                    }}
                                                                  >
                                                                    📎{' '}
                                                                    {
                                                                      doc.fileName
                                                                    }
                                                                  </div>
                                                                  {doc.fileSize && (
                                                                    <div
                                                                      style={{
                                                                        fontSize:
                                                                          '0.85rem',
                                                                        color:
                                                                          '#999',
                                                                        marginTop:
                                                                          '0.25rem',
                                                                      }}
                                                                    >
                                                                      Size:{' '}
                                                                      {(
                                                                        doc.fileSize /
                                                                        1024
                                                                      ).toFixed(
                                                                        2
                                                                      )}{' '}
                                                                      KB
                                                                    </div>
                                                                  )}
                                                                  <div
                                                                    style={{
                                                                      fontSize:
                                                                        '0.85rem',
                                                                      color:
                                                                        '#666',
                                                                      marginTop:
                                                                        '0.25rem',
                                                                    }}
                                                                  >
                                                                    Submitted:{' '}
                                                                    {new Date(
                                                                      doc.submittedAt
                                                                    ).toLocaleDateString()}
                                                                  </div>
                                                                  {doc.verifiedBy && (
                                                                    <div
                                                                      style={{
                                                                        fontSize:
                                                                          '0.85rem',
                                                                        color:
                                                                          '#666',
                                                                        marginTop:
                                                                          '0.25rem',
                                                                      }}
                                                                    >
                                                                      Verified
                                                                      by:{' '}
                                                                      {
                                                                        doc.verifiedBy
                                                                      }
                                                                    </div>
                                                                  )}
                                                                </div>

                                                                <div
                                                                  style={{
                                                                    display:
                                                                      'flex',
                                                                    gap: '0.5rem',
                                                                    alignItems:
                                                                      'center',
                                                                  }}
                                                                >
                                                                  <span
                                                                    className={`status-badge ${
                                                                      doc.verified
                                                                        ? 'status-verified'
                                                                        : doc.status ===
                                                                          'rejected'
                                                                        ? 'status-unverified'
                                                                        : 'status-pending'
                                                                    }`}
                                                                    style={{
                                                                      marginRight:
                                                                        '0.5rem',
                                                                    }}
                                                                  >
                                                                    {doc.verified
                                                                      ? '✓ Verified'
                                                                      : doc.status ===
                                                                        'rejected'
                                                                      ? '✗ Rejected'
                                                                      : '⏳ Pending'}
                                                                  </span>

                                                                  <a
                                                                    href={
                                                                      doc.fileUrl
                                                                    }
                                                                    download={
                                                                      doc.fileName
                                                                    }
                                                                    target='_blank'
                                                                    rel='noopener noreferrer'
                                                                    style={{
                                                                      background:
                                                                        '#2196f3',
                                                                      color:
                                                                        'white',
                                                                      border:
                                                                        'none',
                                                                      borderRadius:
                                                                        '4px',
                                                                      padding:
                                                                        '0.5rem 1rem',
                                                                      cursor:
                                                                        'pointer',
                                                                      textDecoration:
                                                                        'none',
                                                                      fontSize:
                                                                        '0.85rem',
                                                                      display:
                                                                        'inline-block',
                                                                    }}
                                                                  >
                                                                    ⬇️ Download
                                                                  </a>

                                                                  {!doc.verified &&
                                                                    doc.status !==
                                                                      'rejected' && (
                                                                      <>
                                                                        <button
                                                                          onClick={() =>
                                                                            handleDocumentAction(
                                                                              user._id,
                                                                              doc.documentType,
                                                                              'accept'
                                                                            )
                                                                          }
                                                                          style={{
                                                                            background:
                                                                              '#4caf50',
                                                                            color:
                                                                              'white',
                                                                            border:
                                                                              'none',
                                                                            borderRadius:
                                                                              '4px',
                                                                            padding:
                                                                              '0.5rem 1rem',
                                                                            cursor:
                                                                              'pointer',
                                                                            fontSize:
                                                                              '0.85rem',
                                                                            fontWeight:
                                                                              'bold',
                                                                          }}
                                                                        >
                                                                          ✓
                                                                          Accept
                                                                        </button>
                                                                        <button
                                                                          onClick={() =>
                                                                            handleDocumentAction(
                                                                              user._id,
                                                                              doc.documentType,
                                                                              'reject'
                                                                            )
                                                                          }
                                                                          style={{
                                                                            background:
                                                                              '#f44336',
                                                                            color:
                                                                              'white',
                                                                            border:
                                                                              'none',
                                                                            borderRadius:
                                                                              '4px',
                                                                            padding:
                                                                              '0.5rem 1rem',
                                                                            cursor:
                                                                              'pointer',
                                                                            fontSize:
                                                                              '0.85rem',
                                                                            fontWeight:
                                                                              'bold',
                                                                          }}
                                                                        >
                                                                          ✗
                                                                          Reject
                                                                        </button>
                                                                      </>
                                                                    )}
                                                                </div>
                                                              </div>
                                                            )
                                                          )}
                                                        </div>
                                                      </div>
                                                    )}
                                                  </>
                                                );
                                              })()}
                                            </>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Product Management Tab */}
          {activeMainTab === 'products' && (
            <div>
              <div
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '2rem',
                  marginBottom: '2rem',
                }}
              >
                <div style={{ marginBottom: '1.5rem' }}>
                  <h2 style={{ color: '#388e3c', margin: '0 0 0.5rem 0' }}>
                    📦 Product Management - Pending Verification
                  </h2>
                  <p style={{ color: '#6d4c41', margin: 0 }}>
                    Review and manage products awaiting verification
                  </p>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #c8e6c9',
                        borderTop: '4px solid #388e3c',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem',
                      }}
                    ></div>
                    <p style={{ color: '#388e3c' }}>Loading products...</p>
                  </div>
                ) : pendingProducts.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '3rem',
                      color: '#757575',
                    }}
                  >
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                      ✅
                    </div>
                    <h3 style={{ color: '#388e3c', margin: '0 0 0.5rem 0' }}>
                      No pending products
                    </h3>
                    <p style={{ margin: 0 }}>
                      All products have been reviewed!
                    </p>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        marginBottom: '1rem',
                        padding: '0.75rem',
                        background: '#e8f5e9',
                        borderRadius: '8px',
                        color: '#2e7d32',
                      }}
                    >
                      <strong>{pendingProducts.length}</strong> product
                      {pendingProducts.length !== 1 ? 's' : ''} pending
                      verification
                    </div>

                    {pendingProducts.map((product) => (
                      <div
                        key={product._id}
                        style={{
                          background: '#f9f9f9',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          padding: '1.5rem',
                          marginBottom: '1rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '1rem',
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '0.5rem',
                              }}
                            >
                              <h3
                                style={{
                                  color: '#388e3c',
                                  margin: 0,
                                  fontSize: '1.3rem',
                                }}
                              >
                                {editingProduct &&
                                editingProduct._id === product._id ? (
                                  <input
                                    type='text'
                                    value={editingProduct.title}
                                    onChange={(e) =>
                                      setEditingProduct({
                                        ...editingProduct,
                                        title: e.target.value,
                                      })
                                    }
                                    style={{
                                      padding: '0.5rem',
                                      border: '2px solid #388e3c',
                                      borderRadius: '4px',
                                      fontSize: '1.1rem',
                                      width: '100%',
                                    }}
                                  />
                                ) : (
                                  product.title
                                )}
                              </h3>
                              <span
                                style={{
                                  background: '#fff3e0',
                                  color: '#f57c00',
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '12px',
                                  fontSize: '0.85rem',
                                  fontWeight: 'bold',
                                }}
                              >
                                Pending
                              </span>
                            </div>
                            <div
                              style={{
                                color: '#666',
                                fontSize: '0.9rem',
                                marginBottom: '0.5rem',
                              }}
                            >
                              <strong>Product ID:</strong> {product.productId} |{' '}
                              <strong>Submitted:</strong>{' '}
                              {new Date(product.createdAt).toLocaleString()}
                            </div>
                            {product.submittedBy && (
                              <div
                                style={{
                                  color: '#666',
                                  fontSize: '0.9rem',
                                }}
                              >
                                <strong>Submitted by:</strong>{' '}
                                {product.submittedBy.email} (
                                {product.submittedBy.userType})
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              if (expandedProduct === product._id) {
                                setExpandedProduct(null);
                                setEditingProduct(null);
                              } else {
                                setExpandedProduct(product._id);
                                setEditingProduct(null);
                              }
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#388e3c',
                              cursor: 'pointer',
                              fontSize: '1.5rem',
                              padding: '0.25rem',
                            }}
                          >
                            {expandedProduct === product._id ? '▲' : '▼'}
                          </button>
                        </div>

                        {expandedProduct === product._id && (
                          <div
                            style={{
                              borderTop: '1px solid #e0e0e0',
                              paddingTop: '1rem',
                            }}
                          >
                            <div style={{ marginBottom: '1rem' }}>
                              <label
                                style={{
                                  display: 'block',
                                  fontWeight: 'bold',
                                  marginBottom: '0.5rem',
                                  color: '#388e3c',
                                }}
                              >
                                Type:
                              </label>
                              {editingProduct &&
                              editingProduct._id === product._id ? (
                                <input
                                  type='text'
                                  value={editingProduct.type}
                                  onChange={(e) =>
                                    setEditingProduct({
                                      ...editingProduct,
                                      type: e.target.value,
                                    })
                                  }
                                  style={{
                                    padding: '0.5rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    width: '100%',
                                  }}
                                />
                              ) : (
                                <div style={{ color: '#333' }}>
                                  {product.type}
                                </div>
                              )}
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                              <label
                                style={{
                                  display: 'block',
                                  fontWeight: 'bold',
                                  marginBottom: '0.5rem',
                                  color: '#388e3c',
                                }}
                              >
                                Description:
                              </label>
                              {editingProduct &&
                              editingProduct._id === product._id ? (
                                <textarea
                                  value={editingProduct.description}
                                  onChange={(e) =>
                                    setEditingProduct({
                                      ...editingProduct,
                                      description: e.target.value,
                                    })
                                  }
                                  style={{
                                    padding: '0.5rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    width: '100%',
                                    minHeight: '100px',
                                    resize: 'vertical',
                                  }}
                                />
                              ) : (
                                <div style={{ color: '#333' }}>
                                  {product.description}
                                </div>
                              )}
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                              <label
                                style={{
                                  display: 'block',
                                  fontWeight: 'bold',
                                  marginBottom: '0.5rem',
                                  color: '#388e3c',
                                }}
                              >
                                Price:
                              </label>
                              {editingProduct &&
                              editingProduct._id === product._id ? (
                                <input
                                  type='number'
                                  step='0.01'
                                  value={editingProduct.price}
                                  onChange={(e) =>
                                    setEditingProduct({
                                      ...editingProduct,
                                      price: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  style={{
                                    padding: '0.5rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    width: '100%',
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    color: '#2e7d32',
                                    fontWeight: 'bold',
                                  }}
                                >
                                  ₹{product.price}
                                </div>
                              )}
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                              <label
                                style={{
                                  display: 'block',
                                  fontWeight: 'bold',
                                  marginBottom: '0.5rem',
                                  color: '#388e3c',
                                }}
                              >
                                Admin Notes:
                              </label>
                              {editingProduct &&
                              editingProduct._id === product._id ? (
                                <textarea
                                  value={editingProduct.adminNotes || ''}
                                  onChange={(e) =>
                                    setEditingProduct({
                                      ...editingProduct,
                                      adminNotes: e.target.value,
                                    })
                                  }
                                  placeholder='Add internal notes about this product...'
                                  style={{
                                    padding: '0.5rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    width: '100%',
                                    minHeight: '80px',
                                    resize: 'vertical',
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    color: '#666',
                                    fontStyle: product.adminNotes
                                      ? 'normal'
                                      : 'italic',
                                  }}
                                >
                                  {product.adminNotes || 'No admin notes'}
                                </div>
                              )}
                            </div>

                            {product.images && product.images.length > 0 && (
                              <div style={{ marginBottom: '1rem' }}>
                                <label
                                  style={{
                                    display: 'block',
                                    fontWeight: 'bold',
                                    marginBottom: '0.5rem',
                                    color: '#388e3c',
                                  }}
                                >
                                  Images:
                                </label>
                                <div
                                  style={{
                                    display: 'flex',
                                    gap: '0.5rem',
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  {product.images.map((img, idx) => (
                                    <img
                                      key={idx}
                                      src={img}
                                      alt={`Product ${idx + 1}`}
                                      style={{
                                        width: '100px',
                                        height: '100px',
                                        objectFit: 'cover',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd',
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            {product.videos && product.videos.length > 0 && (
                              <div style={{ marginBottom: '1rem' }}>
                                <label
                                  style={{
                                    display: 'block',
                                    fontWeight: 'bold',
                                    marginBottom: '0.5rem',
                                    color: '#388e3c',
                                  }}
                                >
                                  Videos:
                                </label>
                                <div style={{ color: '#666' }}>
                                  {product.videos.length} video
                                  {product.videos.length !== 1 ? 's' : ''}{' '}
                                  uploaded
                                </div>
                              </div>
                            )}

                            <div
                              style={{
                                display: 'flex',
                                gap: '1rem',
                                marginTop: '1.5rem',
                                paddingTop: '1rem',
                                borderTop: '1px solid #e0e0e0',
                              }}
                            >
                              {editingProduct &&
                              editingProduct._id === product._id ? (
                                <>
                                  <button
                                    onClick={() => {
                                      handleApproveProduct(product._id);
                                    }}
                                    style={{
                                      flex: 1,
                                      background: '#4caf50',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '8px',
                                      padding: '0.75rem 1.5rem',
                                      cursor: 'pointer',
                                      fontSize: '1rem',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    ✓ Save & Approve
                                  </button>
                                  <button
                                    onClick={() => setEditingProduct(null)}
                                    style={{
                                      flex: 1,
                                      background: '#757575',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '8px',
                                      padding: '0.75rem 1.5rem',
                                      cursor: 'pointer',
                                      fontSize: '1rem',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() =>
                                      setEditingProduct({ ...product })
                                    }
                                    style={{
                                      flex: 1,
                                      background: '#2196f3',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '8px',
                                      padding: '0.75rem 1.5rem',
                                      cursor: 'pointer',
                                      fontSize: '1rem',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleApproveProduct(product._id)
                                    }
                                    style={{
                                      flex: 1,
                                      background: '#4caf50',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '8px',
                                      padding: '0.75rem 1.5rem',
                                      cursor: 'pointer',
                                      fontSize: '1rem',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    ✓ Approve
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleRejectProduct(
                                        product._id,
                                        product.title
                                      )
                                    }
                                    style={{
                                      flex: 1,
                                      background: '#f44336',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '8px',
                                      padding: '0.75rem 1.5rem',
                                      cursor: 'pointer',
                                      fontSize: '1rem',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    ✕ Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Verification Tab */}
          {activeMainTab === 'payments' && (
            <div>
              <div
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '2rem',
                  marginBottom: '2rem',
                }}
              >
                <div style={{ marginBottom: '1.5rem' }}>
                  <h2 style={{ color: '#388e3c', margin: '0 0 0.5rem 0' }}>
                    💳 Payment Verification - Pending Approvals
                  </h2>
                  <p style={{ color: '#6d4c41', margin: 0 }}>
                    Review and verify payment screenshots submitted by buyers
                  </p>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #c8e6c9',
                        borderTop: '4px solid #388e3c',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem',
                      }}
                    ></div>
                    <p style={{ color: '#388e3c' }}>Loading payments...</p>
                  </div>
                ) : pendingPayments.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '3rem',
                      color: '#757575',
                    }}
                  >
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                      ✅
                    </div>
                    <h3 style={{ color: '#388e3c', margin: '0 0 0.5rem 0' }}>
                      No pending payments
                    </h3>
                    <p style={{ margin: 0 }}>
                      All payments have been verified!
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        border: '1px solid #e0e0e0',
                      }}
                    >
                      <thead>
                        <tr style={{ background: '#e8f5e9' }}>
                          <th
                            style={{
                              padding: '1rem',
                              textAlign: 'left',
                              borderBottom: '2px solid #c8e6c9',
                              color: '#388e3c',
                            }}
                          >
                            Buyer Name
                          </th>
                          <th
                            style={{
                              padding: '1rem',
                              textAlign: 'left',
                              borderBottom: '2px solid #c8e6c9',
                              color: '#388e3c',
                            }}
                          >
                            Company
                          </th>
                          <th
                            style={{
                              padding: '1rem',
                              textAlign: 'left',
                              borderBottom: '2px solid #c8e6c9',
                              color: '#388e3c',
                            }}
                          >
                            Transaction ID
                          </th>
                          <th
                            style={{
                              padding: '1rem',
                              textAlign: 'right',
                              borderBottom: '2px solid #c8e6c9',
                              color: '#388e3c',
                            }}
                          >
                            Amount
                          </th>
                          <th
                            style={{
                              padding: '1rem',
                              textAlign: 'left',
                              borderBottom: '2px solid #c8e6c9',
                              color: '#388e3c',
                            }}
                          >
                            Payment Type
                          </th>
                          <th
                            style={{
                              padding: '1rem',
                              textAlign: 'left',
                              borderBottom: '2px solid #c8e6c9',
                              color: '#388e3c',
                            }}
                          >
                            Farmer
                          </th>
                          <th
                            style={{
                              padding: '1rem',
                              textAlign: 'left',
                              borderBottom: '2px solid #c8e6c9',
                              color: '#388e3c',
                            }}
                          >
                            Submitted
                          </th>
                          <th
                            style={{
                              padding: '1rem',
                              textAlign: 'center',
                              borderBottom: '2px solid #c8e6c9',
                              color: '#388e3c',
                            }}
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingPayments.flatMap((payment) => {
                          const rows = [];

                          // Add row for pending advance payment (10%)
                          if (
                            payment.payment?.verificationStatus === 'pending'
                          ) {
                            rows.push(
                              <tr
                                key={`${payment._id}-advance`}
                                style={{
                                  borderBottom: '1px solid #e0e0e0',
                                  transition: 'background 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#f1f8e9';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'white';
                                }}
                              >
                                <td style={{ padding: '1rem' }}>
                                  <div
                                    style={{
                                      fontWeight: 'bold',
                                      color: '#2e7d32',
                                    }}
                                  >
                                    {payment.buyer?.fullName || 'N/A'}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '0.85rem',
                                      color: '#666',
                                    }}
                                  >
                                    {payment.buyerid}
                                  </div>
                                </td>
                                <td
                                  style={{ padding: '1rem', color: '#6d4c41' }}
                                >
                                  {payment.buyer?.companyName || 'N/A'}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                  <code
                                    style={{
                                      background: '#e3f2fd',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '4px',
                                      fontSize: '0.85rem',
                                      fontFamily: 'monospace',
                                      color: '#01579b',
                                    }}
                                  >
                                    {payment.payment?.transactionId || 'N/A'}
                                  </code>
                                </td>
                                <td
                                  style={{
                                    padding: '1rem',
                                    textAlign: 'right',
                                  }}
                                >
                                  <div
                                    style={{
                                      fontWeight: 'bold',
                                      color: '#f57f17',
                                      fontSize: '1.1rem',
                                    }}
                                  >
                                    ₹
                                    {payment.payment?.advanceAmount?.toFixed(
                                      2
                                    ) || '0.00'}
                                  </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                  <span
                                    style={{
                                      background: '#fff9c4',
                                      padding: '0.25rem 0.75rem',
                                      borderRadius: '12px',
                                      fontSize: '0.85rem',
                                      fontWeight: 'bold',
                                      color: '#f57f17',
                                    }}
                                  >
                                    Advance (10%)
                                  </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                  <div
                                    style={{
                                      fontWeight: 'bold',
                                      color: '#2e7d32',
                                    }}
                                  >
                                    {payment.farmer?.contactPerson || 'N/A'}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '0.85rem',
                                      color: '#666',
                                    }}
                                  >
                                    {payment.farmerid}
                                  </div>
                                </td>
                                <td
                                  style={{
                                    padding: '1rem',
                                    fontSize: '0.85rem',
                                    color: '#666',
                                  }}
                                >
                                  {payment.payment?.submittedAt
                                    ? new Date(
                                        payment.payment.submittedAt
                                      ).toLocaleString()
                                    : 'N/A'}
                                </td>
                                <td
                                  style={{
                                    padding: '1rem',
                                    textAlign: 'center',
                                  }}
                                >
                                  <button
                                    onClick={() =>
                                      router.push(`/account/${payment.buyerid}`)
                                    }
                                    style={{
                                      background: '#0277bd',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      padding: '0.5rem 1rem',
                                      cursor: 'pointer',
                                      fontSize: '0.9rem',
                                      fontWeight: 'bold',
                                      transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background =
                                        '#01579b';
                                      e.currentTarget.style.transform =
                                        'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background =
                                        '#0277bd';
                                      e.currentTarget.style.transform =
                                        'translateY(0)';
                                    }}
                                  >
                                    👁️ View Details
                                  </button>
                                </td>
                              </tr>
                            );
                          }

                          // Add row for pending balance payment (90%)
                          if (
                            payment.paymentBalance?.verificationStatus ===
                            'pending'
                          ) {
                            rows.push(
                              <tr
                                key={`${payment._id}-balance`}
                                style={{
                                  borderBottom: '1px solid #e0e0e0',
                                  transition: 'background 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#e8f5e9';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'white';
                                }}
                              >
                                <td style={{ padding: '1rem' }}>
                                  <div
                                    style={{
                                      fontWeight: 'bold',
                                      color: '#2e7d32',
                                    }}
                                  >
                                    {payment.buyer?.fullName || 'N/A'}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '0.85rem',
                                      color: '#666',
                                    }}
                                  >
                                    {payment.buyerid}
                                  </div>
                                </td>
                                <td
                                  style={{ padding: '1rem', color: '#6d4c41' }}
                                >
                                  {payment.buyer?.companyName || 'N/A'}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                  <code
                                    style={{
                                      background: '#e3f2fd',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '4px',
                                      fontSize: '0.85rem',
                                      fontFamily: 'monospace',
                                      color: '#01579b',
                                    }}
                                  >
                                    {payment.paymentBalance?.transactionId ||
                                      'N/A'}
                                  </code>
                                </td>
                                <td
                                  style={{
                                    padding: '1rem',
                                    textAlign: 'right',
                                  }}
                                >
                                  <div
                                    style={{
                                      fontWeight: 'bold',
                                      color: '#2e7d32',
                                      fontSize: '1.1rem',
                                    }}
                                  >
                                    ₹
                                    {payment.paymentBalance?.balanceAmount?.toFixed(
                                      2
                                    ) || '0.00'}
                                  </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                  <span
                                    style={{
                                      background: '#c8e6c9',
                                      padding: '0.25rem 0.75rem',
                                      borderRadius: '12px',
                                      fontSize: '0.85rem',
                                      fontWeight: 'bold',
                                      color: '#2e7d32',
                                    }}
                                  >
                                    Balance (90%)
                                  </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                  <div
                                    style={{
                                      fontWeight: 'bold',
                                      color: '#2e7d32',
                                    }}
                                  >
                                    {payment.farmer?.contactPerson || 'N/A'}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '0.85rem',
                                      color: '#666',
                                    }}
                                  >
                                    {payment.farmerid}
                                  </div>
                                </td>
                                <td
                                  style={{
                                    padding: '1rem',
                                    fontSize: '0.85rem',
                                    color: '#666',
                                  }}
                                >
                                  {payment.paymentBalance?.submittedAt
                                    ? new Date(
                                        payment.paymentBalance.submittedAt
                                      ).toLocaleString()
                                    : 'N/A'}
                                </td>
                                <td
                                  style={{
                                    padding: '1rem',
                                    textAlign: 'center',
                                  }}
                                >
                                  <button
                                    onClick={() =>
                                      router.push(`/account/${payment.buyerid}`)
                                    }
                                    style={{
                                      background: '#0277bd',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      padding: '0.5rem 1rem',
                                      cursor: 'pointer',
                                      fontSize: '0.9rem',
                                      fontWeight: 'bold',
                                      transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background =
                                        '#01579b';
                                      e.currentTarget.style.transform =
                                        'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background =
                                        '#0277bd';
                                      e.currentTarget.style.transform =
                                        'translateY(0)';
                                    }}
                                  >
                                    👁️ View Details
                                  </button>
                                </td>
                              </tr>
                            );
                          }

                          return rows;
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />

      {/* Rejection Reason Modal */}
      {rejectionModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() =>
            setRejectionModal({
              isOpen: false,
              userId: '',
              documentType: '',
              userEmail: '',
            })
          }
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: '#d32f2f', margin: '0 0 1.5rem 0' }}>
              🚫 Reject Document
            </h2>

            <p style={{ color: '#666', marginBottom: '1rem' }}>
              Please select a reason for rejecting this document:
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              {rejectionReasons.map((reason) => (
                <div
                  key={reason}
                  style={{
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.75rem',
                    border:
                      rejectionReason === reason
                        ? '2px solid #388e3c'
                        : '1px solid #e0e0e0',
                    borderRadius: '8px',
                    background:
                      rejectionReason === reason ? '#f1f8e9' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setRejectionReason(reason)}
                >
                  <input
                    type='radio'
                    name='rejectionReason'
                    value={reason}
                    checked={rejectionReason === reason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    style={{
                      marginRight: '0.75rem',
                      accentColor: '#388e3c',
                    }}
                  />
                  <label
                    style={{
                      cursor: 'pointer',
                      flex: 1,
                      color: '#333',
                      fontSize: '0.95rem',
                    }}
                  >
                    {reason}
                  </label>
                </div>
              ))}
            </div>

            {rejectionReason === 'Other' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: 'bold',
                    color: '#388e3c',
                  }}
                >
                  Custom Reason:
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder='Enter custom rejection reason...'
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    resize: 'vertical',
                    minHeight: '100px',
                    fontFamily: 'Arial, sans-serif',
                  }}
                />
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() =>
                  setRejectionModal({
                    isOpen: false,
                    userId: '',
                    documentType: '',
                    userEmail: '',
                  })
                }
                style={{
                  background: '#f5f5f5',
                  color: '#757575',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmRejection}
                disabled={
                  !rejectionReason ||
                  (rejectionReason === 'Other' && !customReason)
                }
                style={{
                  background:
                    rejectionReason &&
                    (rejectionReason !== 'Other' || customReason)
                      ? '#d32f2f'
                      : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  cursor:
                    rejectionReason &&
                    (rejectionReason !== 'Other' || customReason)
                      ? 'pointer'
                      : 'not-allowed',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Rejection Modal */}
      {productRejectionModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() =>
            setProductRejectionModal({
              isOpen: false,
              productId: '',
              productTitle: '',
            })
          }
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: '#d32f2f', margin: '0 0 1rem 0' }}>
              🚫 Reject Product
            </h2>

            <div
              style={{
                background: '#fff3e0',
                border: '1px solid #ffb74d',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <strong style={{ color: '#f57c00' }}>Product:</strong>{' '}
              {productRejectionModal.productTitle}
            </div>

            <p style={{ color: '#666', marginBottom: '1rem' }}>
              Please select a reason for rejecting this product. An email will
              be sent to the submitter with your reason.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              {productRejectionReasons.map((reason) => (
                <div
                  key={reason}
                  style={{
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.75rem',
                    border:
                      productRejectionReason === reason
                        ? '2px solid #388e3c'
                        : '1px solid #e0e0e0',
                    borderRadius: '8px',
                    background:
                      productRejectionReason === reason ? '#f1f8e9' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setProductRejectionReason(reason)}
                >
                  <input
                    type='radio'
                    name='productRejectionReason'
                    value={reason}
                    checked={productRejectionReason === reason}
                    onChange={(e) => setProductRejectionReason(e.target.value)}
                    style={{
                      marginRight: '0.75rem',
                      accentColor: '#388e3c',
                    }}
                  />
                  <label
                    style={{
                      cursor: 'pointer',
                      flex: 1,
                      color: '#333',
                      fontSize: '0.95rem',
                    }}
                  >
                    {reason}
                  </label>
                </div>
              ))}
            </div>

            {productRejectionReason === 'Other' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: 'bold',
                    color: '#388e3c',
                  }}
                >
                  Custom Reason:
                </label>
                <textarea
                  value={productCustomReason}
                  onChange={(e) => setProductCustomReason(e.target.value)}
                  placeholder='Enter custom rejection reason...'
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    resize: 'vertical',
                    minHeight: '100px',
                    fontFamily: 'Arial, sans-serif',
                  }}
                />
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() =>
                  setProductRejectionModal({
                    isOpen: false,
                    productId: '',
                    productTitle: '',
                  })
                }
                style={{
                  background: '#f5f5f5',
                  color: '#757575',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmProductRejection}
                disabled={
                  !productRejectionReason ||
                  (productRejectionReason === 'Other' && !productCustomReason)
                }
                style={{
                  background:
                    productRejectionReason &&
                    (productRejectionReason !== 'Other' || productCustomReason)
                      ? '#d32f2f'
                      : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  cursor:
                    productRejectionReason &&
                    (productRejectionReason !== 'Other' || productCustomReason)
                      ? 'pointer'
                      : 'not-allowed',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        isOpen={snackbar.isOpen}
        onClose={closeSnackbar}
        duration={5000}
      />
    </>
  );
}
