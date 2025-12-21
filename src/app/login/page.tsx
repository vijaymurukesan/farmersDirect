'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Snackbar from '../components/Snackbar';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    isOpen: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call login API
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Store JWT token in localStorage
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('userData', JSON.stringify(result.data));

        showSnackbar(`Welcome back, ${result.data.fullName}! 🎉`, 'success');

        // Redirect to dashboard after successful login
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        throw new Error(result.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      showSnackbar(
        error instanceof Error
          ? error.message
          : 'Invalid email or password. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

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
          fontFamily: 'Arial, Georgia, serif',
        }}
      >
        <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .form-input {
          padding: 0.75rem;
          border: 2px solid #c8e6c9;
          border-radius: 8px;
          font-size: 1rem;
          color: #000000;
          transition: border-color 0.3s ease;
          width: 100%;
        }
        .form-input:focus {
          outline: none;
          border-color: #388e3c;
          box-shadow: 0 0 0 3px rgba(56, 142, 60, 0.1);
        }
      `}</style>

        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(56, 142, 60, 0.15)',
            padding: '3rem',
            width: '100%',
            maxWidth: '450px',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌱</div>
            <h1
              style={{
                color: '#388e3c',
                fontSize: '2rem',
                margin: '0 0 0.5rem 0',
                fontWeight: 'bold',
                letterSpacing: '1px',
              }}
            >
              Farmers Direct
            </h1>
            <p style={{ color: '#6d4c41', fontSize: '1rem', margin: 0 }}>
              Sign in to your account
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  color: '#388e3c',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                }}
              >
                Email Address *
              </label>
              <input
                type='email'
                className='form-input'
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                placeholder='Enter your email'
                style={{
                  padding: '0.75rem',
                  border: '2px solid #c8e6c9',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  color: '#000000',
                  width: '100%',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  color: '#388e3c',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                }}
              >
                Password *
              </label>
              <input
                type='password'
                className='form-input'
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                placeholder='Enter your password'
                style={{
                  padding: '0.75rem',
                  border: '2px solid #c8e6c9',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  color: '#000000',
                  width: '100%',
                }}
              />
            </div>

            <button
              type='submit'
              disabled={loading}
              style={{
                background: loading
                  ? '#c8e6c9'
                  : 'linear-gradient(45deg, #388e3c, #2e7d32)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  ></div>
                  Signing in...
                </>
              ) : (
                <>🔐 Sign In</>
              )}
            </button>

            {/* Forgot Password Link */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <a
                href='#'
                onClick={(e) => {
                  e.preventDefault();
                  showSnackbar('Password reset feature coming soon!', 'info');
                }}
                style={{
                  color: '#388e3c',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                }}
              >
                Forgot password?
              </a>
            </div>

            {/* Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                margin: '1.5rem 0',
                gap: '1rem',
              }}
            >
              <div
                style={{ flex: 1, height: '1px', background: '#e0e0e0' }}
              ></div>
              <span style={{ color: '#757575', fontSize: '0.9rem' }}>OR</span>
              <div
                style={{ flex: 1, height: '1px', background: '#e0e0e0' }}
              ></div>
            </div>

            {/* Register Link */}
            <div
              style={{
                textAlign: 'center',
                padding: '1rem',
                background: '#f1f8e9',
                borderRadius: '8px',
                border: '2px solid #c8e6c9',
              }}
            >
              <p
                style={{
                  margin: '0 0 0.75rem 0',
                  color: '#6d4c41',
                  fontSize: '0.9rem',
                }}
              >
                Don&apos;t have an account?
              </p>
              <button
                type='button'
                onClick={() => router.push('/register')}
                style={{
                  background: 'white',
                  color: '#388e3c',
                  border: '2px solid #388e3c',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#388e3c';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.color = '#388e3c';
                }}
              >
                ✨ Register
              </button>
            </div>
          </form>

          {/* Back to Home Link */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'none',
                border: 'none',
                color: '#757575',
                cursor: 'pointer',
                fontSize: '0.9rem',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              ← Back to Home
            </button>
          </div>
        </div>

        {/* Snackbar */}
        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          isOpen={snackbar.isOpen}
          onClose={closeSnackbar}
          duration={5000}
        />
      </div>
      <Footer />
    </>
  );
}
