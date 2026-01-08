'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

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

  // Reply state
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [replyLoading, setReplyLoading] = useState<{ [key: string]: boolean }>(
    {}
  );

  // Check authentication and ownership
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userDataStr = localStorage.getItem('userData');

    if (token && userDataStr) {
      try {
        const user = JSON.parse(userDataStr);
        setIsLoggedIn(true);
        setUserData(user);

        // Check if this is the user's own account
        const currentUserId = user.farmerId || user.buyerId || user.email;
        setIsOwner(currentUserId === userId);
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
    if (activeTab === 'interest')
      return interaction.interactionType === 'express_interest';
    if (activeTab === 'sample')
      return interaction.interactionType === 'request_sample';
    if (activeTab === 'pending') return interaction.status === 'pending';
    if (activeTab === 'accepted') return interaction.status === 'accepted';
    if (activeTab === 'rejected') return interaction.status === 'rejected';
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
        alert('✅ Reply sent successfully!');
        setReplyText({ ...replyText, [interactionId]: '' });
        window.location.reload();
      } else {
        alert(result.message || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Error sending reply. Please try again.');
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
        alert(`✅ You have ${action}ed this interaction!`);
        window.location.reload();
      } else {
        alert(result.message || `Failed to ${action} interaction`);
      }
    } catch (error) {
      console.error(`Error ${action}ing interaction:`, error);
      alert(`Error ${action}ing interaction. Please try again.`);
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
        alert(`✅ You have ${action}ed this interaction!`);
        window.location.reload();
      } else {
        alert(result.message || `Failed to ${action} interaction`);
      }
    } catch (error) {
      console.error(`Error ${action}ing interaction:`, error);
      alert(`Error ${action}ing interaction. Please try again.`);
    }
  };

  // Handle enter contract
  const handleEnterContract = async (interactionId: string) => {
    if (
      !confirm(
        'Are you sure you want to enter into a contract? This will mark the interaction as completed.'
      )
    )
      return;

    try {
      const response = await fetch('/api/interactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionId: interactionId,
          status: 'completed',
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('✅ Contract established! Interaction marked as completed.');
        window.location.reload();
      } else {
        alert(result.message || 'Failed to establish contract');
      }
    } catch (error) {
      console.error('Error establishing contract:', error);
      alert('Error establishing contract. Please try again.');
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
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
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
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
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
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
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
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
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
                { id: 'pending', label: 'Pending', icon: '⏳' },
                { id: 'accepted', label: 'Accepted', icon: '✅' },
                { id: 'rejected', label: 'Rejected', icon: '❌' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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
                      <div>
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
                      {getStatusBadge(interaction.status)}
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

                    {/* Reply Input - Only for farmers */}
                    {userId.startsWith('FID') && isOwner && (
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
                              color: interaction.farmerAccepted
                                ? '#2e7d32'
                                : interaction.farmerAccepted === false
                                ? '#c62828'
                                : '#757575',
                            }}
                          >
                            {interaction.farmerAccepted
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
                              color: interaction.buyerAccepted
                                ? '#2e7d32'
                                : interaction.buyerAccepted === false
                                ? '#c62828'
                                : '#757575',
                            }}
                          >
                            {interaction.buyerAccepted
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
                                handleEnterContract(interaction._id)
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
      </div>
      <Footer />
    </>
  );
}
