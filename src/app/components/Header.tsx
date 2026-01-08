'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userType, setUserType] = useState('');
  const [emailVerified, setEmailVerified] = useState(true);
  const [userVerified, setUserVerified] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setIsLoggedIn(true);
        setUserName(user.fullName || user.email);
        setUserType(user.userType || '');
        setEmailVerified(user.emailVerified !== false);
        setUserVerified(user.userVerified !== false);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setIsLoggedIn(false);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setIsLoggedIn(false);
    setUserName('');
    router.push('/');
  };

  return (
    <header
      style={{
        padding: '1rem 2rem',
        background: '#e8f5e9',
        color: '#388e3c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span
          style={{ fontSize: '2.5rem', marginRight: '0.75rem' }}
          aria-label='Farm Icon'
          role='img'
        >
          🌱
        </span>
        <h1
          style={{
            fontFamily: 'Arial, Georgia, serif',
            letterSpacing: '2px',
            fontWeight: 'bold',
            fontSize: '2rem',
            margin: 0,
            cursor: 'pointer',
          }}
          onClick={() => router.push('/')}
        >
          Farmers Direct
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {isLoggedIn ? (
          <>
            <div
              style={{
                color: '#388e3c',
                fontWeight: 'bold',
                fontSize: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '0.25rem',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span>👤 {userName}</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: '#6d4c41',
                    fontWeight: 'normal',
                    textTransform: 'capitalize',
                    background: '#fffde7',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '12px',
                    border: '1px solid #c8e6c9',
                  }}
                >
                  {userType === 'farmer'
                    ? '🌾 Farmer'
                    : userType === 'buyer'
                    ? '🛒 Buyer'
                    : userType === 'admin'
                    ? '👨‍💼 Admin'
                    : userType === 'owner'
                    ? '👑 Owner'
                    : ''}
                </span>
              </div>
              <a
                onClick={() => {
                  const userData = localStorage.getItem('userData');
                  if (userData) {
                    const user = JSON.parse(userData);
                    const userId = user.farmerId || user.buyerId || user.email;
                    router.push(`/account/${userId}`);
                  }
                }}
                style={{
                  fontSize: '0.75rem',
                  color: '#388e3c',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontWeight: 'normal',
                  transition: 'color 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#2e7d32';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#388e3c';
                }}
              >
                📊 My Account
              </a>
              {(!emailVerified || !userVerified) && (
                <span>
                  ⚠️{' '}
                  <a
                    onClick={() => router.push('/verification')}
                    style={{
                      color: '#d32f2f',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      fontWeight: 'Normal',
                      transition: 'color 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#b71c1c';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#d32f2f';
                    }}
                  >
                    Verification Pending
                  </a>
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              title='Logout'
              style={{
                background: 'transparent',
                color: '#388e3c',
                border: '2px solid #388e3c',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#388e3c';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#388e3c';
              }}
            >
              →
            </button>
          </>
        ) : (
          <button
            onClick={() => router.push('/login')}
            style={{
              background: '#388e3c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2e7d32';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#388e3c';
            }}
          >
            🔐 Login
          </button>
        )}
      </div>
    </header>
  );
}
