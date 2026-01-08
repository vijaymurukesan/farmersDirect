'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Snackbar from '../../components/Snackbar';

// Helper function to format email for display
const formatEmail = (email: string): string => {
  if (!email) return 'N/A';
  // If email contains @ symbol, it's already in proper format
  if (email.includes('@')) return email;
  // Otherwise return N/A
  return 'N/A';
};

interface Interaction {
  _id: string;
  interactionType: string;
  farmerid: string;
  buyerid: string;
  farmer: {
    farmerId: string;
    email: string;
    contactPerson: string;
    companyName: string;
    phoneNumber: string;
    address: string;
    mapLocation: { lat: number; lng: number };
  };
  buyer: {
    buyerId: string;
    email: string;
    fullName: string;
    companyName: string;
    phoneNumber: string;
  };
  product: {
    productId: string;
    productName: string;
    type: string;
    category: string;
    pricePerUnit: number;
  };
  status: string;
  sampleDetails?: {
    quantity: string;
    address: string;
    notes: string;
  };
  buyerNotes: string;
  farmerResponse: string;
  farmerAccepted?: boolean;
  buyerAccepted?: boolean;
  contract?: {
    generatedAt: string;
    farmerSignature?: string;
    farmerSignedAt?: string;
    buyerSignature?: string;
    buyerSignedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
  respondedAt?: string;
}

export default function AccountPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string;

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [interestSubTab, setInterestSubTab] = useState('all');

  // Reply state
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [replyLoading, setReplyLoading] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    interactionId: string;
  }>({ isOpen: false, interactionId: '' });
  const [snackbar, setSnackbar] = useState({
    isOpen: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  // Contract modal state
  const [contractModal, setContractModal] = useState<{
    isOpen: boolean;
    mode: 'preview' | 'sign' | null;
    interaction: Interaction | null;
  }>({ isOpen: false, mode: null, interaction: null });
  const [signatureName, setSignatureName] = useState('');

  // Contract confirmation modal state
  const [contractConfirmModal, setContractConfirmModal] = useState<{
    isOpen: boolean;
    interactionId: string;
  }>({ isOpen: false, interactionId: '' });

  // Check authentication and ownership
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userDataStr = localStorage.getItem('userData');

    if (token && userDataStr) {
      try {
        const user = JSON.parse(userDataStr);
        setIsLoggedIn(true);
        setUserData(user);

        // Check if this is the user's own account OR if user is admin/owner
        const currentUserId = user.farmerId || user.buyerId || user.email;
        const isOwnAccount = currentUserId === userId;
        const isAdminOrOwner =
          user.userType === 'admin' || user.userType === 'owner';
        setIsOwner(isOwnAccount || isAdminOrOwner);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [userId]);

  // Fetch interactions
  useEffect(() => {
    const fetchInteractions = async () => {
      if (!userId) return;

      try {
        setLoading(true);

        // Determine user type based on ID format
        let userType = 'buyer';
        if (userId.startsWith('FID')) {
          userType = 'farmer';
        } else if (userId.startsWith('BID')) {
          userType = 'buyer';
        }

        const response = await fetch(
          `/api/interactions?userId=${userId}&userType=${userType}`
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setInteractions(result.data || []);
          }
        }
      } catch (error) {
        console.error('Error fetching interactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInteractions();
  }, [userId]);

  // Filter interactions by tab
  const filteredInteractions = interactions.filter((interaction) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'shortlist')
      return interaction.interactionType === 'shortlist';
    if (activeTab === 'interest') {
      const isInterest = interaction.interactionType === 'express_interest';
      if (!isInterest) return false;

      // Apply sub-filter for Express Interest
      if (interestSubTab === 'all') return true;
      if (interestSubTab === 'pending') return interaction.status === 'pending';
      if (interestSubTab === 'rejected')
        return interaction.status === 'rejected';
      if (interestSubTab === 'accepted') {
        return (
          interaction.farmerAccepted &&
          interaction.buyerAccepted &&
          interaction.status !== 'contract' &&
          interaction.status !== 'completed'
        );
      }
      if (interestSubTab === 'contract') {
        return interaction.status === 'contract';
      }
      if (interestSubTab === 'completed') {
        return interaction.status === 'completed';
      }
      return true;
    }
    if (activeTab === 'sample')
      return interaction.interactionType === 'request_sample';
    return true;
  });

  // Handle reply submission
  const handleReplySubmit = async (
    interactionId: string,
    currentResponse: string
  ) => {
    const reply = replyText[interactionId];
    if (!reply || !reply.trim()) return;

    setReplyLoading({ ...replyLoading, [interactionId]: true });

    try {
      const response = await fetch('/api/interactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionId: interactionId,
          farmerResponse: currentResponse
            ? `${currentResponse}\n\n---\n\n${reply.trim()}`
            : reply.trim(),
          status: 'pending',
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSnackbar({
          isOpen: true,
          message: '✅ Reply sent successfully!',
          type: 'success',
        });
        setReplyText({ ...replyText, [interactionId]: '' });
        window.location.reload();
      } else {
        setSnackbar({
          isOpen: true,
          message: result.message || 'Failed to send reply',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      setSnackbar({
        isOpen: true,
        message: 'Error sending reply. Please try again.',
        type: 'error',
      });
    } finally {
      setReplyLoading({ ...replyLoading, [interactionId]: false });
    }
  };

  // Handle farmer accept/reject
  const handleFarmerAction = async (
    interactionId: string,
    action: 'accept' | 'reject'
  ) => {
    if (!confirm(`Are you sure you want to ${action} this interaction?`))
      return;

    try {
      const response = await fetch('/api/interactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionId: interactionId,
          farmerAccepted: action === 'accept',
          status: action === 'reject' ? 'rejected' : 'pending',
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSnackbar({
          isOpen: true,
          message: `✅ You have ${action}ed this interaction!`,
          type: 'success',
        });
        window.location.reload();
      } else {
        setSnackbar({
          isOpen: true,
          message: result.message || `Failed to ${action} interaction`,
          type: 'error',
        });
      }
    } catch (error) {
      console.error(`Error ${action}ing interaction:`, error);
      setSnackbar({
        isOpen: true,
        message: `Error ${action}ing interaction. Please try again.`,
        type: 'error',
      });
    }
  };

  // Handle buyer accept/reject
  const handleBuyerAction = async (
    interactionId: string,
    action: 'accept' | 'reject'
  ) => {
    if (!confirm(`Are you sure you want to ${action} this interaction?`))
      return;

    try {
      const response = await fetch('/api/interactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionId: interactionId,
          buyerAccepted: action === 'accept',
          status: action === 'reject' ? 'rejected' : 'pending',
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSnackbar({
          isOpen: true,
          message: `✅ You have ${action}ed this interaction!`,
          type: 'success',
        });
        window.location.reload();
      } else {
        setSnackbar({
          isOpen: true,
          message: result.message || `Failed to ${action} interaction`,
          type: 'error',
        });
      }
    } catch (error) {
      console.error(`Error ${action}ing interaction:`, error);
      setSnackbar({
        isOpen: true,
        message: `Error ${action}ing interaction. Please try again.`,
        type: 'error',
      });
    }
  };

  // Handle enter contract - show confirmation modal
  const handleEnterContractConfirm = (interactionId: string) => {
    setContractConfirmModal({ isOpen: true, interactionId });
  };

  // Handle enter contract - actual execution after confirmation
  const handleEnterContract = async () => {
    const interactionId = contractConfirmModal.interactionId;
    setContractConfirmModal({ isOpen: false, interactionId: '' });

    try {
      const response = await fetch('/api/interactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionId: interactionId,
          status: 'contract',
          generateContract: true,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSnackbar({
          isOpen: true,
          message:
            '✅ Contract generated! Both parties need to review and sign.',
          type: 'success',
        });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setSnackbar({
          isOpen: true,
          message: result.message || 'Failed to establish contract',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error establishing contract:', error);
      setSnackbar({
        isOpen: true,
        message: 'Error establishing contract. Please try again.',
        type: 'error',
      });
    }
  };

  // Generate contract content
  const generateContractContent = (interaction: Interaction): string => {
    const today = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return `
AGRICULTURAL PRODUCE SALE AGREEMENT

This Agreement is made on ${today}

BETWEEN:

PARTY OF THE FIRST PART (SELLER):
Name: ${interaction.farmer.contactPerson}
Company: ${interaction.farmer.companyName}
Address: ${interaction.farmer.address}
Email: ${interaction.farmer.email}
Phone: ${interaction.farmer.phoneNumber}
Farmer ID: ${interaction.farmerid}
(Hereinafter referred to as "the Seller" which expression shall, unless repugnant to the context or meaning thereof, include its successors and permitted assigns)

AND

PARTY OF THE SECOND PART (BUYER):
Name: ${interaction.buyer.fullName}
Company: ${interaction.buyer.companyName || 'Individual'}
Email: ${interaction.buyer.email}
Phone: ${interaction.buyer.phoneNumber}
Buyer ID: ${interaction.buyerid}
(Hereinafter referred to as "the Buyer" which expression shall, unless repugnant to the context or meaning thereof, include its successors and permitted assigns)

WHEREAS:
A. The Seller is engaged in the business of agricultural production and is the lawful producer/owner of agricultural produce.
B. The Buyer is desirous of purchasing agricultural produce from the Seller.
C. Both parties have agreed to enter into this Agreement on mutually acceptable terms and conditions as set forth herein.

NOW THIS AGREEMENT WITNESSETH AS FOLLOWS:

1. PRODUCT DETAILS
   Product Name: ${interaction.product.productName}
   Product Type: ${interaction.product.type}
   Category: ${interaction.product.category}
   Price per Unit: ₹${interaction.product.pricePerUnit}
   ${
     interaction.sampleDetails
       ? `Quantity: ${interaction.sampleDetails.quantity}`
       : ''
   }

2. TERMS AND CONDITIONS

2.1 QUALITY STANDARDS
The Seller warrants that the produce shall conform to the agreed specifications and quality standards as per Food Safety and Standards Act, 2006 and Agricultural Produce Market Committee Act applicable in the respective state.

2.2 DELIVERY
${
  interaction.sampleDetails
    ? `Delivery Address: ${interaction.sampleDetails.address}`
    : 'Delivery terms to be mutually agreed upon'
}
The Seller shall deliver the produce within the agreed timeline unless prevented by force majeure events.

2.3 PAYMENT TERMS
Payment shall be made as per the terms agreed upon completion of delivery and quality verification. Payment mode shall comply with the provisions of the Indian Contract Act, 1872.

2.4 RISK AND TITLE
Risk and title in the goods shall pass to the Buyer upon delivery and acceptance at the specified delivery location.

2.5 WARRANTIES
The Seller warrants that:
a) The produce is grown/produced by the Seller and is free from any encumbrances
b) The produce meets all applicable food safety and quality standards
c) The Seller has all necessary licenses and permits for cultivation and sale

2.6 INSPECTION AND ACCEPTANCE
The Buyer shall have the right to inspect the produce upon delivery. Any quality issues must be reported within 24 hours of delivery.

2.7 DISPUTE RESOLUTION
Any disputes arising out of or in connection with this Agreement shall be resolved through:
a) Good faith negotiations between the parties
b) If unresolved, through mediation
c) If mediation fails, through arbitration as per the Arbitration and Conciliation Act, 1996
d) The arbitration shall be conducted in English language and the seat of arbitration shall be [Location]
e) The award of the arbitrator shall be final and binding on both parties

2.8 JURISDICTION
This Agreement shall be governed by and construed in accordance with the laws of India. The courts at [Location] shall have exclusive jurisdiction over any disputes.

2.9 FORCE MAJEURE
Neither party shall be liable for any failure or delay in performing their obligations under this Agreement due to force majeure events including but not limited to acts of God, natural disasters, war, governmental actions, epidemics, or any other events beyond reasonable control.

2.10 TERMINATION
Either party may terminate this Agreement by providing written notice if the other party:
a) Commits a material breach and fails to remedy within 15 days of written notice
b) Becomes insolvent or enters into bankruptcy proceedings

2.11 CONFIDENTIALITY
Both parties agree to maintain confidentiality of all business information exchanged during the course of this transaction.

2.12 ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, and agreements.

3. COMMUNICATION HISTORY

Initial Contact Date: ${new Date(interaction.createdAt).toLocaleDateString(
      'en-IN'
    )}
Interaction Type: ${
      interaction.interactionType === 'express_interest'
        ? 'Express Interest'
        : interaction.interactionType === 'request_sample'
        ? 'Sample Request'
        : 'Shortlist'
    }

${
  interaction.buyerNotes
    ? `Buyer's Initial Notes:\n${interaction.buyerNotes}\n`
    : ''
}
${
  interaction.farmerResponse
    ? `Seller's Response:\n${interaction.farmerResponse}\n`
    : ''
}
${
  interaction.sampleDetails?.notes
    ? `Additional Notes:\n${interaction.sampleDetails.notes}\n`
    : ''
}

Last Updated: ${new Date(interaction.updatedAt).toLocaleDateString('en-IN')}

4. DECLARATIONS

The parties hereby declare that:
a) They have read and understood all terms and conditions of this Agreement
b) They enter into this Agreement voluntarily and without any coercion
c) All information provided is true and accurate to the best of their knowledge
d) They have the legal capacity and authority to enter into this Agreement

5. SIGNATURES

This Agreement is executed electronically with digital signatures of both parties.

SELLER'S SIGNATURE:
${
  interaction.contract?.farmerSignature
    ? `Signed by: ${interaction.contract.farmerSignature}\nDate: ${new Date(
        interaction.contract.farmerSignedAt!
      ).toLocaleDateString('en-IN')}`
    : '[Pending Signature]'
}

BUYER'S SIGNATURE:
${
  interaction.contract?.buyerSignature
    ? `Signed by: ${interaction.contract.buyerSignature}\nDate: ${new Date(
        interaction.contract.buyerSignedAt!
      ).toLocaleDateString('en-IN')}`
    : '[Pending Signature]'
}

---END OF AGREEMENT---

Note: This is a legally binding electronic document. By signing this agreement, both parties acknowledge their acceptance of all terms and conditions stated herein.
    `.trim();
  };

  // Handle preview contract
  const handlePreviewContract = (interaction: Interaction) => {
    setContractModal({ isOpen: true, mode: 'preview', interaction });
  };

  // Handle sign contract
  const handleSignContract = (interaction: Interaction) => {
    setSignatureName('');
    setContractModal({ isOpen: true, mode: 'sign', interaction });
  };

  // Submit signature
  const submitSignature = async () => {
    if (!signatureName.trim()) {
      setSnackbar({
        isOpen: true,
        message: 'Please enter your name to sign the contract',
        type: 'warning',
      });
      return;
    }

    if (!contractModal.interaction) return;

    const isFarmer = userData?.userType === 'farmer';
    const interactionId = contractModal.interaction._id;

    try {
      const response = await fetch('/api/interactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionId: interactionId,
          signContract: true,
          signatureType: isFarmer ? 'farmer' : 'buyer',
          signatureName: signatureName.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSnackbar({
          isOpen: true,
          message: result.bothSigned
            ? '✅ Contract fully signed! Moving to payment phase.'
            : '✅ Contract signed successfully! Waiting for other party to sign.',
          type: 'success',
        });
        setContractModal({ isOpen: false, mode: null, interaction: null });
        setSignatureName('');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setSnackbar({
          isOpen: true,
          message: result.message || 'Failed to sign contract',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error signing contract:', error);
      setSnackbar({
        isOpen: true,
        message: 'Error signing contract. Please try again.',
        type: 'error',
      });
    }
  };

  // Handle delete interaction
  const handleDeleteInteraction = async (interactionId: string) => {
    setDeleteModal({ isOpen: true, interactionId });
  };

  // Confirm delete interaction
  const confirmDeleteInteraction = async () => {
    const interactionId = deleteModal.interactionId;
    setDeleteModal({ isOpen: false, interactionId: '' });

    try {
      const response = await fetch('/api/interactions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interactionId }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSnackbar({
          isOpen: true,
          message: '✅ Interaction deleted successfully!',
          type: 'success',
        });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setSnackbar({
          isOpen: true,
          message: result.message || 'Failed to delete interaction',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error deleting interaction:', error);
      setSnackbar({
        isOpen: true,
        message: 'Error deleting interaction. Please try again.',
        type: 'error',
      });
    }
  };

  const getInteractionTypeLabel = (type: string) => {
    switch (type) {
      case 'shortlist':
        return '⭐ Shortlist';
      case 'express_interest':
        return '💼 Express Interest';
      case 'request_sample':
        return '📦 Request Sample';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: { bg: '#fff3e0', color: '#e65100', text: '⏳ Pending' },
      accepted: { bg: '#e8f5e9', color: '#2e7d32', text: '✅ Accepted' },
      rejected: { bg: '#ffebee', color: '#c62828', text: '❌ Rejected' },
      contract: { bg: '#fff9c4', color: '#f57f17', text: '📝 Contract' },
      payment: { bg: '#e1f5fe', color: '#01579b', text: '💳 Payment' },
      completed: { bg: '#e3f2fd', color: '#1565c0', text: '✔️ Completed' },
    };
    const style = styles[status as keyof typeof styles] || styles.pending;
    return (
      <span
        style={{
          background: style.bg,
          color: style.color,
          padding: '0.25rem 0.75rem',
          borderRadius: '12px',
          fontSize: '0.85rem',
          fontWeight: 'bold',
        }}
      >
        {style.text}
      </span>
    );
  };

  return (
    <>
      <Header />
      <div
        style={{
          background: '#f1f8e9',
          minHeight: '100vh',
          padding: '2rem',
        }}
      >
        {/* Header Section - Publicly Visible */}
        <div
          style={{
            background: '#fffde7',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <h1 style={{ color: '#388e3c', margin: '0 0 1rem 0' }}>
            📊 Account Dashboard
          </h1>
          <p style={{ color: '#6d4c41', margin: 0 }}>
            {userId.startsWith('FID')
              ? '🌾 Farmer Account'
              : userId.startsWith('BID')
              ? '🛒 Buyer Account'
              : 'User Account'}{' '}
            - {userId}
          </p>
          {!isLoggedIn && (
            <p
              style={{
                color: '#757575',
                fontSize: '0.9rem',
                marginTop: '1rem',
                padding: '1rem',
                background: '#fff',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
              }}
            >
              ℹ️ This is a public profile. Some sections are only visible to the
              account owner.{' '}
              <a
                onClick={() => router.push('/login')}
                style={{
                  color: '#388e3c',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                Login
              </a>{' '}
              to view private information.
            </p>
          )}
        </div>

        {/* Public Statistics Section */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <h2 style={{ color: '#388e3c', marginBottom: '1.5rem' }}>
            📈 Public Statistics
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            <div
              style={{
                background: '#e8f5e9',
                padding: '1.5rem',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '2rem',
                  marginBottom: '0.5rem',
                  color: '#2e7d32',
                  fontWeight: 'bold',
                }}
              >
                {interactions.length}
              </div>
              <div style={{ color: '#6d4c41', fontSize: '0.9rem' }}>
                Total Interactions
              </div>
            </div>
            <div
              style={{
                background: '#fff3e0',
                padding: '1.5rem',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '2rem',
                  marginBottom: '0.5rem',
                  color: '#e65100',
                  fontWeight: 'bold',
                }}
              >
                {interactions.filter((i) => i.status === 'pending').length}
              </div>
              <div style={{ color: '#6d4c41', fontSize: '0.9rem' }}>
                Pending
              </div>
            </div>
            <div
              style={{
                background: '#e3f2fd',
                padding: '1.5rem',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '2rem',
                  marginBottom: '0.5rem',
                  color: '#1565c0',
                  fontWeight: 'bold',
                }}
              >
                {interactions.filter((i) => i.status === 'accepted').length}
              </div>
              <div style={{ color: '#6d4c41', fontSize: '0.9rem' }}>
                Accepted
              </div>
            </div>
            <div
              style={{
                background: '#fce4ec',
                padding: '1.5rem',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '2rem',
                  marginBottom: '0.5rem',
                  color: '#c2185b',
                  fontWeight: 'bold',
                }}
              >
                {interactions.filter((i) => i.status === 'completed').length}
              </div>
              <div style={{ color: '#6d4c41', fontSize: '0.9rem' }}>
                Completed
              </div>
            </div>
          </div>
        </div>

        {/* Private Section - Only visible to owner when logged in */}
        {isOwner && isLoggedIn && (
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '2px solid #388e3c',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <h2 style={{ color: '#388e3c', margin: 0 }}>
                🔒 My Interactions (Private)
              </h2>
              <span
                style={{
                  background: '#388e3c',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                }}
              >
                Only visible to you
              </span>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
              }}
            >
              {[
                { id: 'all', label: 'All', icon: '📋' },
                { id: 'shortlist', label: 'Shortlisted', icon: '⭐' },
                { id: 'interest', label: 'Expressed Interest', icon: '💼' },
                { id: 'sample', label: 'Sample Requests', icon: '📦' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'interest') {
                      setInterestSubTab('all');
                    }
                  }}
                  style={{
                    background: activeTab === tab.id ? '#388e3c' : '#f1f8e9',
                    color: activeTab === tab.id ? 'white' : '#388e3c',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.background = '#c8e6c9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.background = '#f1f8e9';
                    }
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Express Interest Sub-Tabs */}
            {activeTab === 'interest' && (
              <div
                style={{
                  background: '#e8f5e9',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  border: '1px solid #c8e6c9',
                }}
              >
                <div
                  style={{
                    marginBottom: '0.5rem',
                    color: '#388e3c',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                  }}
                >
                  📊 Filter by Status:
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  {[
                    { id: 'all', label: 'All', icon: '📋' },
                    { id: 'pending', label: 'Pending', icon: '⏳' },
                    { id: 'rejected', label: 'Rejected', icon: '❌' },
                    { id: 'accepted', label: 'Accepted', icon: '✅' },
                    { id: 'contract', label: 'Contract', icon: '📝' },
                    { id: 'payment', label: 'Payment', icon: '💳' },
                    { id: 'completed', label: 'Completed', icon: '✔️' },
                  ].map((subTab) => (
                    <button
                      key={subTab.id}
                      onClick={() => setInterestSubTab(subTab.id)}
                      style={{
                        background:
                          interestSubTab === subTab.id ? '#2e7d32' : 'white',
                        color:
                          interestSubTab === subTab.id ? 'white' : '#388e3c',
                        border: '1px solid #c8e6c9',
                        borderRadius: '6px',
                        padding: '0.4rem 0.8rem',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight:
                          interestSubTab === subTab.id ? 'bold' : 'normal',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (interestSubTab !== subTab.id) {
                          e.currentTarget.style.background = '#f1f8e9';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (interestSubTab !== subTab.id) {
                          e.currentTarget.style.background = 'white';
                        }
                      }}
                    >
                      {subTab.icon} {subTab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Interactions List */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #c8e6c9',
                    borderTop: '4px solid #388e3c',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto',
                  }}
                ></div>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
                <p style={{ color: '#388e3c', marginTop: '1rem' }}>
                  Loading interactions...
                </p>
              </div>
            ) : filteredInteractions.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem',
                  color: '#757575',
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <p style={{ fontSize: '1.1rem' }}>
                  No interactions found for this filter
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                {filteredInteractions.map((interaction) => (
                  <div
                    key={interaction._id}
                    style={{
                      background: '#f9f9f9',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '1.5rem',
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
                        <h3
                          style={{
                            color: '#388e3c',
                            margin: '0 0 0.5rem 0',
                            fontSize: '1.1rem',
                          }}
                        >
                          {getInteractionTypeLabel(interaction.interactionType)}
                        </h3>
                        <p style={{ margin: 0, color: '#6d4c41' }}>
                          Product:{' '}
                          <strong>{interaction.product.productName}</strong> (
                          {interaction.product.type})
                        </p>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                        }}
                      >
                        {getStatusBadge(interaction.status)}
                        {/* Delete button - only for admin/owner */}
                        {(userData?.userType === 'admin' ||
                          userData?.userType === 'owner') && (
                          <button
                            onClick={() =>
                              handleDeleteInteraction(interaction._id)
                            }
                            title='Delete this interaction'
                            style={{
                              background: '#e0e0e0',
                              color: '#666',
                              border: 'none',
                              borderRadius: '50%',
                              width: '36px',
                              height: '36px',
                              cursor: 'pointer',
                              fontSize: '1.1rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#bdbdbd';
                              e.currentTarget.style.transform = 'scale(1.1)';
                              e.currentTarget.style.boxShadow =
                                '0 4px 8px rgba(0,0,0,0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#e0e0e0';
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow =
                                '0 2px 4px rgba(0,0,0,0.1)';
                            }}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '1rem',
                        marginTop: '1rem',
                        padding: '1rem',
                        background: 'white',
                        borderRadius: '8px',
                      }}
                    >
                      {/* Farmer Info */}
                      <div>
                        <h4
                          style={{
                            color: '#388e3c',
                            fontSize: '0.9rem',
                            margin: '0 0 0.5rem 0',
                          }}
                        >
                          🌾 Farmer Details
                        </h4>
                        <div style={{ fontSize: '0.85rem', color: '#6d4c41' }}>
                          <div>
                            <strong>Name:</strong>{' '}
                            {interaction.farmer.contactPerson}
                          </div>
                          <div>
                            <strong>Company:</strong>{' '}
                            {interaction.farmer.companyName}
                          </div>
                          <div style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                            📞 {interaction.farmer.phoneNumber}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#999' }}>
                            ✉️ {formatEmail(interaction.farmer.email)}
                          </div>
                        </div>
                      </div>

                      {/* Buyer Info */}
                      <div>
                        <h4
                          style={{
                            color: '#388e3c',
                            fontSize: '0.9rem',
                            margin: '0 0 0.5rem 0',
                          }}
                        >
                          🛒 Buyer Details
                        </h4>
                        <div style={{ fontSize: '0.85rem', color: '#6d4c41' }}>
                          <div>
                            <strong>Name:</strong> {interaction.buyer.fullName}
                          </div>
                          <div>
                            <strong>Company:</strong>{' '}
                            {interaction.buyer.companyName || 'N/A'}
                          </div>
                          <div style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                            📞 {interaction.buyer.phoneNumber || 'N/A'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#999' }}>
                            ✉️ {formatEmail(interaction.buyer.email)}
                          </div>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div>
                        <h4
                          style={{
                            color: '#388e3c',
                            fontSize: '0.9rem',
                            margin: '0 0 0.5rem 0',
                          }}
                        >
                          📦 Product Details
                        </h4>
                        <div style={{ fontSize: '0.85rem', color: '#6d4c41' }}>
                          <div>
                            <strong>{interaction.product.productName}</strong>
                          </div>
                          <div>
                            Type: {interaction.product.type} |{' '}
                            {interaction.product.category}
                          </div>
                          <div style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                            ₹{interaction.product.pricePerUnit}/unit
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sample Details */}
                    {interaction.sampleDetails && (
                      <div
                        style={{
                          marginTop: '1rem',
                          padding: '1rem',
                          background: '#fff3e0',
                          borderRadius: '8px',
                        }}
                      >
                        <h4
                          style={{
                            color: '#e65100',
                            fontSize: '0.9rem',
                            margin: '0 0 0.5rem 0',
                          }}
                        >
                          📦 Sample Request Details
                        </h4>
                        <div style={{ fontSize: '0.85rem', color: '#6d4c41' }}>
                          <div>
                            <strong>Quantity:</strong>{' '}
                            {interaction.sampleDetails.quantity}
                          </div>
                          <div>
                            <strong>Delivery Address:</strong>{' '}
                            {interaction.sampleDetails.address}
                          </div>
                          {interaction.sampleDetails.notes && (
                            <div>
                              <strong>Notes:</strong>{' '}
                              {interaction.sampleDetails.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Buyer Notes */}
                    {interaction.buyerNotes && (
                      <div
                        style={{
                          marginTop: '1rem',
                          padding: '1.5rem',
                          background:
                            'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                          borderRadius: '12px 12px 12px 4px',
                          border: '2px solid #90caf9',
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.75rem',
                          }}
                        >
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: '#1565c0',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1rem',
                              fontWeight: 'bold',
                            }}
                          >
                            🛒
                          </div>
                          <div>
                            <div
                              style={{
                                color: '#1565c0',
                                fontSize: '0.85rem',
                                fontWeight: 'bold',
                              }}
                            >
                              {interaction.buyer.fullName}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#666' }}>
                              {new Date(interaction.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.9rem',
                            color: '#1a237e',
                            lineHeight: '1.5',
                            paddingLeft: '2.5rem',
                          }}
                        >
                          {interaction.buyerNotes}
                        </p>
                      </div>
                    )}

                    {/* Farmer Response - Chat Style */}
                    {interaction.farmerResponse && (
                      <div
                        style={{
                          marginTop: '1rem',
                          padding: '1.5rem',
                          background:
                            'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                          borderRadius: '12px 12px 4px 12px',
                          border: '2px solid #81c784',
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.75rem',
                          }}
                        >
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: '#2e7d32',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1rem',
                              fontWeight: 'bold',
                            }}
                          >
                            🌾
                          </div>
                          <div>
                            <div
                              style={{
                                color: '#2e7d32',
                                fontSize: '0.85rem',
                                fontWeight: 'bold',
                              }}
                            >
                              {interaction.farmer.contactPerson}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#666' }}>
                              {interaction.respondedAt
                                ? new Date(
                                    interaction.respondedAt
                                  ).toLocaleString()
                                : new Date(
                                    interaction.updatedAt
                                  ).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            paddingLeft: '2.5rem',
                          }}
                        >
                          {interaction.farmerResponse
                            .split('\n\n---\n\n')
                            .map((msg, idx) => (
                              <p
                                key={idx}
                                style={{
                                  margin: idx > 0 ? '1rem 0 0 0' : 0,
                                  fontSize: '0.9rem',
                                  color: '#1b5e20',
                                  lineHeight: '1.5',
                                  paddingTop: idx > 0 ? '1rem' : 0,
                                  borderTop:
                                    idx > 0 ? '1px dashed #81c784' : 'none',
                                }}
                              >
                                {msg}
                              </p>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Reply Input - Only for farmers and only before acceptance */}
                    {userId.startsWith('FID') &&
                      isOwner &&
                      interaction.status !== 'accepted' &&
                      interaction.status !== 'contract' &&
                      interaction.status !== 'payment' && (
                        <div
                          style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            background: '#f5f5f5',
                            borderRadius: '8px',
                            border: '1px solid #e0e0e0',
                          }}
                        >
                          <textarea
                            placeholder='Type your reply to the buyer...'
                            value={replyText[interaction._id] || ''}
                            onChange={(e) =>
                              setReplyText({
                                ...replyText,
                                [interaction._id]: e.target.value,
                              })
                            }
                            style={{
                              width: '100%',
                              minHeight: '80px',
                              padding: '0.75rem',
                              border: '1px solid #c8e6c9',
                              borderRadius: '8px',
                              fontSize: '0.9rem',
                              resize: 'vertical',
                              fontFamily: 'Arial, sans-serif',
                              marginBottom: '0.5rem',
                              color: '#1a1a1a',
                            }}
                          />
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'flex-end',
                              gap: '0.5rem',
                            }}
                          >
                            <button
                              onClick={() =>
                                handleReplySubmit(
                                  interaction._id,
                                  interaction.farmerResponse
                                )
                              }
                              disabled={
                                !replyText[interaction._id] ||
                                !replyText[interaction._id].trim() ||
                                replyLoading[interaction._id]
                              }
                              style={{
                                background:
                                  !replyText[interaction._id] ||
                                  !replyText[interaction._id].trim() ||
                                  replyLoading[interaction._id]
                                    ? '#ccc'
                                    : '#388e3c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0.5rem 1.5rem',
                                cursor:
                                  !replyText[interaction._id] ||
                                  !replyText[interaction._id].trim() ||
                                  replyLoading[interaction._id]
                                    ? 'not-allowed'
                                    : 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                transition: 'all 0.3s ease',
                              }}
                            >
                              {replyLoading[interaction._id]
                                ? '⏳ Sending...'
                                : '📤 Send Reply'}
                            </button>
                          </div>
                        </div>
                      )}

                    {/* Action Buttons Section */}
                    <div
                      style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: '#fff9e6',
                        borderRadius: '8px',
                        border: '2px solid #ffd54f',
                      }}
                    >
                      <h4
                        style={{
                          color: '#f57f17',
                          fontSize: '0.9rem',
                          margin: '0 0 1rem 0',
                        }}
                      >
                        📋 Interaction Status & Actions
                      </h4>

                      {/* Status Display */}
                      <div
                        style={{
                          display: 'flex',
                          gap: '1rem',
                          marginBottom: '1rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            minWidth: '200px',
                            padding: '0.75rem',
                            background: 'white',
                            borderRadius: '6px',
                            border: '1px solid #e0e0e0',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: '#999',
                              marginBottom: '0.25rem',
                            }}
                          >
                            Farmer Status
                          </div>
                          <div
                            style={{
                              fontSize: '0.9rem',
                              fontWeight: 'bold',
                              color:
                                interaction.farmerAccepted === true
                                  ? '#2e7d32'
                                  : interaction.farmerAccepted === false
                                  ? '#c62828'
                                  : '#757575',
                            }}
                          >
                            {interaction.farmerAccepted === true
                              ? '✅ Accepted'
                              : interaction.farmerAccepted === false
                              ? '❌ Rejected'
                              : '⏳ Pending'}
                          </div>
                        </div>
                        <div
                          style={{
                            flex: 1,
                            minWidth: '200px',
                            padding: '0.75rem',
                            background: 'white',
                            borderRadius: '6px',
                            border: '1px solid #e0e0e0',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: '#999',
                              marginBottom: '0.25rem',
                            }}
                          >
                            Buyer Status
                          </div>
                          <div
                            style={{
                              fontSize: '0.9rem',
                              fontWeight: 'bold',
                              color:
                                interaction.buyerAccepted === true
                                  ? '#2e7d32'
                                  : interaction.buyerAccepted === false
                                  ? '#c62828'
                                  : '#757575',
                            }}
                          >
                            {interaction.buyerAccepted === true
                              ? '✅ Accepted'
                              : interaction.buyerAccepted === false
                              ? '❌ Rejected'
                              : '⏳ Pending'}
                          </div>
                        </div>
                      </div>

                      {/* Farmer Action Buttons */}
                      {userId.startsWith('FID') &&
                        isOwner &&
                        interaction.status !== 'completed' &&
                        interaction.status !== 'contract' &&
                        interaction.status !== 'rejected' &&
                        interaction.farmerAccepted === undefined && (
                          <div
                            style={{
                              display: 'flex',
                              gap: '0.5rem',
                              marginBottom: '0.5rem',
                            }}
                          >
                            <button
                              onClick={() =>
                                handleFarmerAction(interaction._id, 'accept')
                              }
                              style={{
                                flex: 1,
                                background: '#4caf50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0.75rem',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                transition: 'all 0.3s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#388e3c';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#4caf50';
                              }}
                            >
                              ✅ Accept as Farmer
                            </button>
                            <button
                              onClick={() =>
                                handleFarmerAction(interaction._id, 'reject')
                              }
                              style={{
                                flex: 1,
                                background: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0.75rem',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                transition: 'all 0.3s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#c62828';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#f44336';
                              }}
                            >
                              ❌ Reject as Farmer
                            </button>
                          </div>
                        )}

                      {/* Buyer Action Buttons */}
                      {userId.startsWith('BID') &&
                        isOwner &&
                        interaction.status !== 'completed' &&
                        interaction.status !== 'contract' &&
                        interaction.status !== 'rejected' &&
                        interaction.buyerAccepted === undefined && (
                          <div
                            style={{
                              display: 'flex',
                              gap: '0.5rem',
                              marginBottom: '0.5rem',
                            }}
                          >
                            <button
                              onClick={() =>
                                handleBuyerAction(interaction._id, 'accept')
                              }
                              style={{
                                flex: 1,
                                background: '#2196f3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0.75rem',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                transition: 'all 0.3s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#1565c0';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#2196f3';
                              }}
                            >
                              ✅ Accept as Buyer
                            </button>
                            <button
                              onClick={() =>
                                handleBuyerAction(interaction._id, 'reject')
                              }
                              style={{
                                flex: 1,
                                background: '#ff5722',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0.75rem',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                transition: 'all 0.3s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#d84315';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#ff5722';
                              }}
                            >
                              ❌ Reject as Buyer
                            </button>
                          </div>
                        )}

                      {/* Enter Contract Button - Show when both accepted */}
                      {interaction.farmerAccepted &&
                        interaction.buyerAccepted &&
                        interaction.status !== 'completed' &&
                        interaction.status !== 'contract' &&
                        interaction.status !== 'payment' &&
                        isOwner && (
                          <div
                            style={{
                              marginTop: '1rem',
                              padding: '1rem',
                              background:
                                'linear-gradient(135deg, #ffd54f 0%, #ffeb3b 100%)',
                              borderRadius: '8px',
                              border: '2px solid #fbc02d',
                            }}
                          >
                            <div
                              style={{
                                textAlign: 'center',
                                marginBottom: '0.75rem',
                                color: '#f57f17',
                                fontWeight: 'bold',
                              }}
                            >
                              🎉 Both parties have accepted! Ready to proceed?
                            </div>
                            <button
                              onClick={() =>
                                handleEnterContractConfirm(interaction._id)
                              }
                              style={{
                                width: '100%',
                                background: '#ff9800',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '1rem',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f57c00';
                                e.currentTarget.style.transform =
                                  'translateY(-2px)';
                                e.currentTarget.style.boxShadow =
                                  '0 6px 16px rgba(255, 152, 0, 0.4)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#ff9800';
                                e.currentTarget.style.transform =
                                  'translateY(0)';
                                e.currentTarget.style.boxShadow =
                                  '0 4px 12px rgba(255, 152, 0, 0.3)';
                              }}
                            >
                              📝 Enter into Contract
                            </button>
                          </div>
                        )}

                      {/* Contract Phase - Preview and Sign Buttons */}
                      {(interaction.status === 'contract' ||
                        interaction.status === 'payment') &&
                        isOwner && (
                          <div
                            style={{
                              marginTop: '1rem',
                              padding: '1.5rem',
                              background:
                                'linear-gradient(135deg, #fff9c4 0%, #fff59d 100%)',
                              borderRadius: '12px',
                              border: '2px solid #f57f17',
                            }}
                          >
                            <div
                              style={{
                                textAlign: 'center',
                                marginBottom: '1rem',
                              }}
                            >
                              <h4
                                style={{
                                  color: '#f57f17',
                                  margin: '0 0 0.5rem 0',
                                  fontSize: '1.1rem',
                                }}
                              >
                                📋 Legal Contract Generated
                              </h4>
                              <p
                                style={{
                                  margin: 0,
                                  color: '#6d4c41',
                                  fontSize: '0.9rem',
                                }}
                              >
                                Review and sign the contract to proceed to
                                payment
                              </p>
                            </div>

                            {/* Contract Signature Status */}
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '1rem',
                                marginBottom: '1rem',
                              }}
                            >
                              <div
                                style={{
                                  padding: '1rem',
                                  background: interaction.contract
                                    ?.farmerSignature
                                    ? '#e8f5e9'
                                    : 'white',
                                  borderRadius: '8px',
                                  border: `2px solid ${
                                    interaction.contract?.farmerSignature
                                      ? '#4caf50'
                                      : '#e0e0e0'
                                  }`,
                                  textAlign: 'center',
                                }}
                              >
                                <div style={{ fontSize: '2rem' }}>
                                  {interaction.contract?.farmerSignature
                                    ? '✅'
                                    : '⏳'}
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 'bold',
                                    color: interaction.contract?.farmerSignature
                                      ? '#2e7d32'
                                      : '#757575',
                                    marginTop: '0.5rem',
                                  }}
                                >
                                  Farmer Signature
                                </div>
                                {interaction.contract?.farmerSignature && (
                                  <div
                                    style={{
                                      fontSize: '0.75rem',
                                      color: '#666',
                                      marginTop: '0.25rem',
                                    }}
                                  >
                                    Signed by:{' '}
                                    {interaction.contract.farmerSignature}
                                  </div>
                                )}
                              </div>

                              <div
                                style={{
                                  padding: '1rem',
                                  background: interaction.contract
                                    ?.buyerSignature
                                    ? '#e8f5e9'
                                    : 'white',
                                  borderRadius: '8px',
                                  border: `2px solid ${
                                    interaction.contract?.buyerSignature
                                      ? '#4caf50'
                                      : '#e0e0e0'
                                  }`,
                                  textAlign: 'center',
                                }}
                              >
                                <div style={{ fontSize: '2rem' }}>
                                  {interaction.contract?.buyerSignature
                                    ? '✅'
                                    : '⏳'}
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 'bold',
                                    color: interaction.contract?.buyerSignature
                                      ? '#2e7d32'
                                      : '#757575',
                                    marginTop: '0.5rem',
                                  }}
                                >
                                  Buyer Signature
                                </div>
                                {interaction.contract?.buyerSignature && (
                                  <div
                                    style={{
                                      fontSize: '0.75rem',
                                      color: '#666',
                                      marginTop: '0.25rem',
                                    }}
                                  >
                                    Signed by:{' '}
                                    {interaction.contract.buyerSignature}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div
                              style={{
                                display: 'flex',
                                gap: '0.75rem',
                                flexWrap: 'wrap',
                              }}
                            >
                              <button
                                onClick={() =>
                                  handlePreviewContract(interaction)
                                }
                                style={{
                                  flex: 1,
                                  minWidth: '180px',
                                  background: '#2196f3',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '1rem',
                                  cursor: 'pointer',
                                  fontSize: '0.95rem',
                                  fontWeight: 'bold',
                                  transition: 'all 0.3s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#1976d2';
                                  e.currentTarget.style.transform =
                                    'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#2196f3';
                                  e.currentTarget.style.transform =
                                    'translateY(0)';
                                }}
                              >
                                👁️ Preview Contract
                              </button>

                              {/* Sign Button - Only show if current user hasn't signed */}
                              {((userId.startsWith('FID') &&
                                !interaction.contract?.farmerSignature) ||
                                (userId.startsWith('BID') &&
                                  !interaction.contract?.buyerSignature)) && (
                                <button
                                  onClick={() =>
                                    handleSignContract(interaction)
                                  }
                                  style={{
                                    flex: 1,
                                    minWidth: '180px',
                                    background: '#4caf50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    cursor: 'pointer',
                                    fontSize: '0.95rem',
                                    fontWeight: 'bold',
                                    transition: 'all 0.3s ease',
                                    boxShadow:
                                      '0 4px 12px rgba(76, 175, 80, 0.3)',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background =
                                      '#388e3c';
                                    e.currentTarget.style.transform =
                                      'translateY(-2px)';
                                    e.currentTarget.style.boxShadow =
                                      '0 6px 16px rgba(76, 175, 80, 0.4)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background =
                                      '#4caf50';
                                    e.currentTarget.style.transform =
                                      'translateY(0)';
                                    e.currentTarget.style.boxShadow =
                                      '0 4px 12px rgba(76, 175, 80, 0.3)';
                                  }}
                                >
                                  ✍️ Sign Contract
                                </button>
                              )}
                            </div>

                            {/* Both Signed - Ready for Payment */}
                            {interaction.contract?.farmerSignature &&
                              interaction.contract?.buyerSignature && (
                                <div
                                  style={{
                                    marginTop: '1rem',
                                    padding: '1rem',
                                    background: '#e8f5e9',
                                    borderRadius: '8px',
                                    border: '2px solid #4caf50',
                                    textAlign: 'center',
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: '1.5rem',
                                      marginBottom: '0.5rem',
                                    }}
                                  >
                                    🎉
                                  </div>
                                  <div
                                    style={{
                                      color: '#2e7d32',
                                      fontWeight: 'bold',
                                      fontSize: '1rem',
                                      marginBottom: '0.25rem',
                                    }}
                                  >
                                    Contract Fully Signed!
                                  </div>
                                  <div
                                    style={{
                                      color: '#6d4c41',
                                      fontSize: '0.85rem',
                                    }}
                                  >
                                    Status has been updated to Payment. Proceed
                                    with payment processing.
                                  </div>
                                </div>
                              )}
                          </div>
                        )}
                    </div>

                    {/* Timestamps */}
                    <div
                      style={{
                        marginTop: '1rem',
                        fontSize: '0.75rem',
                        color: '#999',
                        display: 'flex',
                        gap: '1rem',
                      }}
                    >
                      <div>
                        Created:{' '}
                        {new Date(interaction.createdAt).toLocaleString()}
                      </div>
                      <div>
                        Updated:{' '}
                        {new Date(interaction.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Message for non-owners */}
        {!isOwner && isLoggedIn && (
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <h3 style={{ color: '#6d4c41', marginBottom: '0.5rem' }}>
              Private Information
            </h3>
            <p style={{ color: '#757575' }}>
              Detailed interactions are only visible to the account owner.
            </p>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal.isOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => setDeleteModal({ isOpen: false, interactionId: '' })}
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
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗑️</div>
                <h2 style={{ color: '#d32f2f', margin: '0 0 0.5rem 0' }}>
                  Delete Interaction
                </h2>
                <p style={{ color: '#666', margin: 0 }}>
                  Are you sure you want to delete this interaction? This action
                  cannot be undone.
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'center',
                }}
              >
                <button
                  onClick={() =>
                    setDeleteModal({ isOpen: false, interactionId: '' })
                  }
                  style={{
                    background: '#f5f5f5',
                    color: '#666',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e0e0e0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f5f5f5';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteInteraction}
                  style={{
                    background: '#d32f2f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#b71c1c';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#d32f2f';
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contract Entry Confirmation Modal */}
        {contractConfirmModal.isOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              backdropFilter: 'blur(4px)',
            }}
            onClick={() =>
              setContractConfirmModal({ isOpen: false, interactionId: '' })
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
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                <h2 style={{ color: '#ff9800', margin: '0 0 0.5rem 0' }}>
                  Enter Contract Phase
                </h2>
                <p style={{ color: '#666', margin: 0 }}>
                  Are you sure you want to enter into a contract? This will
                  generate a legal contract document.
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'center',
                }}
              >
                <button
                  onClick={() =>
                    setContractConfirmModal({
                      isOpen: false,
                      interactionId: '',
                    })
                  }
                  style={{
                    background: '#f5f5f5',
                    color: '#666',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e0e0e0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f5f5f5';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEnterContract}
                  style={{
                    background: '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f57c00';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ff9800';
                  }}
                >
                  Generate Contract
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contract Preview/Sign Modal */}
        {contractModal.isOpen && contractModal.interaction && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10001,
              backdropFilter: 'blur(4px)',
              padding: '1rem',
            }}
            onClick={() => {
              setContractModal({
                isOpen: false,
                mode: null,
                interaction: null,
              });
              setSignatureName('');
            }}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '16px',
                width: '95%',
                maxWidth: contractModal.mode === 'preview' ? '1200px' : '600px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '1.5rem 2rem',
                  borderBottom: '2px solid #e0e0e0',
                  background: '#f5f5f5',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h2 style={{ color: '#388e3c', margin: 0, fontSize: '1.4rem' }}>
                  {contractModal.mode === 'preview'
                    ? '📄 Contract Preview'
                    : '✍️ Sign Contract'}
                </h2>
                <button
                  onClick={() => {
                    setContractModal({
                      isOpen: false,
                      mode: null,
                      interaction: null,
                    });
                    setSignatureName('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#666',
                    padding: '0.5rem',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e0e0e0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              {contractModal.mode === 'preview' ? (
                <div
                  style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '2rem',
                  }}
                >
                  <pre
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: '0.95rem',
                      lineHeight: '1.8',
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word',
                      color: '#333',
                      background: 'white',
                      padding: '2rem',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      margin: 0,
                    }}
                  >
                    {generateContractContent(contractModal.interaction)}
                  </pre>
                </div>
              ) : (
                <div
                  style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '2rem',
                  }}
                >
                  <div
                    style={{
                      marginBottom: '2rem',
                      padding: '1.5rem',
                      background: '#e8f5e9',
                      borderRadius: '8px',
                      border: '2px solid #4caf50',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.5rem',
                        textAlign: 'center',
                        marginBottom: '0.5rem',
                      }}
                    >
                      📋
                    </div>
                    <h3
                      style={{
                        color: '#2e7d32',
                        margin: '0 0 0.5rem 0',
                        textAlign: 'center',
                      }}
                    >
                      Digital Signature
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        color: '#6d4c41',
                        textAlign: 'center',
                        fontSize: '0.9rem',
                      }}
                    >
                      By signing this contract, you acknowledge that you have
                      read, understood, and agree to all terms and conditions.
                    </p>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label
                      style={{
                        display: 'block',
                        color: '#388e3c',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem',
                        fontSize: '0.95rem',
                      }}
                    >
                      Full Name (as per records) *
                    </label>
                    <input
                      type='text'
                      value={signatureName}
                      onChange={(e) => setSignatureName(e.target.value)}
                      placeholder='Enter your full name'
                      style={{
                        width: '100%',
                        padding: '1rem',
                        border: '2px solid #c8e6c9',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontFamily: 'Brush Script MT, cursive',
                        transition: 'border-color 0.3s ease',
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#388e3c';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#c8e6c9';
                      }}
                    />
                  </div>

                  {signatureName && (
                    <div
                      style={{
                        padding: '2rem',
                        background: '#f9f9f9',
                        borderRadius: '8px',
                        border: '2px dashed #388e3c',
                        textAlign: 'center',
                        marginBottom: '1.5rem',
                      }}
                    >
                      <div
                        style={{
                          color: '#999',
                          fontSize: '0.8rem',
                          marginBottom: '0.5rem',
                        }}
                      >
                        Signature Preview
                      </div>
                      <div
                        style={{
                          fontFamily: 'Brush Script MT, cursive',
                          fontSize: '2rem',
                          color: '#388e3c',
                          fontWeight: 'bold',
                        }}
                      >
                        {signatureName}
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      padding: '1rem',
                      background: '#fff3e0',
                      borderRadius: '8px',
                      border: '1px solid #ffb74d',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', color: '#e65100' }}>
                      ⚠️ <strong>Important:</strong> This is a legally binding
                      electronic signature. Make sure all contract details are
                      correct before signing.
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div
                style={{
                  padding: '1.5rem 2rem',
                  borderTop: '1px solid #e0e0e0',
                  background: '#f9f9f9',
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  onClick={() => {
                    setContractModal({
                      isOpen: false,
                      mode: null,
                      interaction: null,
                    });
                    setSignatureName('');
                  }}
                  style={{
                    background: '#f5f5f5',
                    color: '#666',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e0e0e0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f5f5f5';
                  }}
                >
                  {contractModal.mode === 'preview' ? 'Close' : 'Cancel'}
                </button>

                {contractModal.mode === 'sign' && (
                  <button
                    onClick={submitSignature}
                    disabled={!signatureName.trim()}
                    style={{
                      background: signatureName.trim() ? '#4caf50' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem 2rem',
                      cursor: signatureName.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '0.95rem',
                      fontWeight: 'bold',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (signatureName.trim()) {
                        e.currentTarget.style.background = '#388e3c';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (signatureName.trim()) {
                        e.currentTarget.style.background = '#4caf50';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    ✍️ Sign Contract
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Snackbar */}
        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          isOpen={snackbar.isOpen}
          onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
          duration={3000}
        />
      </div>
      <Footer />
    </>
  );
}
