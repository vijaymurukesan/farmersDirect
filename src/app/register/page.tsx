'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Snackbar from '../components/Snackbar';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    email: '',
    userType: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
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
    // Clear email error when user modifies email
    if (field === 'email') {
      setEmailError('');
    }

    // Name validation - only letters and spaces
    if (field === 'fullName') {
      const nameRegex = /^[a-zA-Z\s]*$/;
      if (!nameRegex.test(value)) {
        return; // Don't update if invalid characters
      }
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Validation helper functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (
    password: string
  ): { valid: boolean; message: string } => {
    if (password.length < 6) {
      return {
        valid: false,
        message: 'Password must be at least 6 characters long',
      };
    }
    if (!/[A-Z]/.test(password)) {
      return {
        valid: false,
        message: 'Password must contain at least one uppercase letter',
      };
    }
    if (!/[a-z]/.test(password)) {
      return {
        valid: false,
        message: 'Password must contain at least one lowercase letter',
      };
    }
    if (!/[0-9]/.test(password)) {
      return {
        valid: false,
        message: 'Password must contain at least one number',
      };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return {
        valid: false,
        message: 'Password must contain at least one special character',
      };
    }
    return { valid: true, message: '' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Name validation
    if (!formData.fullName.trim()) {
      showSnackbar('Please enter your full name', 'error');
      return;
    }

    // Email validation
    if (!validateEmail(formData.email)) {
      showSnackbar('Please enter a valid email address', 'error');
      return;
    }

    // User type validation
    if (!formData.userType) {
      showSnackbar('Please select user type (Farmer or Buyer)', 'error');
      return;
    }

    // Password validation
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      showSnackbar(passwordValidation.message, 'error');
      return;
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      showSnackbar('Passwords do not match!', 'error');
      return;
    }

    setLoading(true);

    try {
      // Send data to API
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          dob: formData.dob,
          email: formData.email,
          userType: formData.userType,
          password: formData.password,
          emailVerified: false,
          userVerified: false,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Store JWT token in localStorage
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('userData', JSON.stringify(result.data));

        // Show success message with Farmer ID if applicable
        const successMessage = result.data.farmerId
          ? `🎉 Registration successful! Your Farmer ID is ${result.data.farmerId}. Welcome, ${result.data.fullName}!`
          : `Registration successful! 🎉 Welcome, ${result.data.fullName}!`;

        showSnackbar(successMessage, 'success');

        // Redirect to login after successful registration
        setTimeout(() => {
          router.push('/login');
        }, 3000); // Increased timeout to allow reading the Farmer ID
      } else {
        // Check if error is due to existing email
        if (
          result.message &&
          result.message.toLowerCase().includes('email already exists')
        ) {
          setEmailError(
            'This email is already registered. Please use a different email or login.'
          );
          // Scroll to email field
          const emailInput = document.querySelector('input[type="email"]');
          if (emailInput) {
            emailInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        throw new Error(result.message || 'Failed to register user');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showSnackbar(
        `Registration failed: ${
          error instanceof Error ? error.message : 'Please try again.'
        }`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: '#f1f8e9',
        minHeight: '100vh',
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
          background: white;
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
          maxWidth: '500px',
          maxHeight: '90vh',
          overflowY: 'auto',
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
            Create Account
          </h1>
          <p style={{ color: '#6d4c41', fontSize: '1rem', margin: 0 }}>
            Join Farmers Direct today
          </p>
        </div>

        {/* Registration Form */}
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
              Full Name *
            </label>
            <input
              type='text'
              className='form-input'
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              required
              placeholder='Enter your full name'
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
              Date of Birth *
            </label>
            <input
              type='date'
              className='form-input'
              value={formData.dob}
              onChange={(e) => handleInputChange('dob', e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                color: emailError ? '#d32f2f' : '#388e3c',
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
                borderColor: emailError ? '#d32f2f' : undefined,
                borderWidth: emailError ? '2px' : undefined,
                background: emailError ? '#ffebee' : 'white',
              }}
            />
            {emailError && (
              <p
                style={{
                  color: '#d32f2f',
                  fontSize: '0.8rem',
                  marginTop: '0.5rem',
                  marginBottom: 0,
                  fontWeight: 'bold',
                  background: '#ffebee',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #ffcdd2',
                }}
              >
                ⚠️ {emailError}
              </p>
            )}
            {formData.email &&
              !validateEmail(formData.email) &&
              !emailError && (
                <p
                  style={{
                    color: '#d32f2f',
                    fontSize: '0.8rem',
                    marginTop: '0.5rem',
                    marginBottom: 0,
                  }}
                >
                  ⚠️ Please enter a valid email address
                </p>
              )}
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
              I am a *
            </label>
            <select
              className='form-input'
              value={formData.userType}
              onChange={(e) => handleInputChange('userType', e.target.value)}
              required
              style={{
                padding: '0.75rem',
                border: '2px solid #c8e6c9',
                borderRadius: '8px',
                fontSize: '1rem',
                color: formData.userType ? '#000000' : '#757575',
                width: '100%',
                background: 'white',
                cursor: 'pointer',
              }}
            >
              <option value=''>Select user type</option>
              <option value='farmer'>👨‍🌾 Farmer</option>
              <option value='buyer'>🛒 Buyer</option>
            </select>
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
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className='form-input'
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                placeholder='Enter password'
                minLength={6}
                style={{
                  paddingRight: '2.5rem',
                }}
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  color: '#757575',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {formData.password && (
              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                }}
              >
                <p
                  style={{
                    margin: '0 0 0.5rem 0',
                    fontWeight: 'bold',
                    color: '#388e3c',
                  }}
                >
                  Password Requirements:
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                  }}
                >
                  <span
                    style={{
                      color:
                        formData.password.length >= 6 ? '#388e3c' : '#757575',
                    }}
                  >
                    {formData.password.length >= 6 ? '✓' : '○'} At least 6
                    characters
                  </span>
                  <span
                    style={{
                      color: /[A-Z]/.test(formData.password)
                        ? '#388e3c'
                        : '#757575',
                    }}
                  >
                    {/[A-Z]/.test(formData.password) ? '✓' : '○'} One uppercase
                    letter
                  </span>
                  <span
                    style={{
                      color: /[a-z]/.test(formData.password)
                        ? '#388e3c'
                        : '#757575',
                    }}
                  >
                    {/[a-z]/.test(formData.password) ? '✓' : '○'} One lowercase
                    letter
                  </span>
                  <span
                    style={{
                      color: /[0-9]/.test(formData.password)
                        ? '#388e3c'
                        : '#757575',
                    }}
                  >
                    {/[0-9]/.test(formData.password) ? '✓' : '○'} One number
                  </span>
                  <span
                    style={{
                      color: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
                        ? '#388e3c'
                        : '#757575',
                    }}
                  >
                    {/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
                      ? '✓'
                      : '○'}{' '}
                    One special character (!@#$%^&*...)
                  </span>
                </div>
              </div>
            )}
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
              Confirm Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className='form-input'
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange('confirmPassword', e.target.value)
                }
                required
                placeholder='Re-enter password'
                minLength={6}
                style={{
                  paddingRight: '2.5rem',
                }}
              />
              <button
                type='button'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  color: '#757575',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label={
                  showConfirmPassword ? 'Hide password' : 'Show password'
                }
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {formData.confirmPassword &&
              formData.password !== formData.confirmPassword && (
                <p
                  style={{
                    color: '#d32f2f',
                    fontSize: '0.8rem',
                    marginTop: '0.5rem',
                    marginBottom: 0,
                  }}
                >
                  ⚠️ Passwords do not match
                </p>
              )}
          </div>

          <button
            type='submit'
            disabled={
              loading ||
              (formData.password !== formData.confirmPassword &&
                formData.confirmPassword !== '')
            }
            style={{
              background:
                loading ||
                (formData.password !== formData.confirmPassword &&
                  formData.confirmPassword !== '')
                  ? '#c8e6c9'
                  : 'linear-gradient(45deg, #388e3c, #2e7d32)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '1rem',
              cursor:
                loading ||
                (formData.password !== formData.confirmPassword &&
                  formData.confirmPassword !== '')
                  ? 'not-allowed'
                  : 'pointer',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem',
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
                Creating account...
              </>
            ) : (
              <>✨ Create Account</>
            )}
          </button>

          {/* Already have account */}
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
              Already have an account?
            </p>
            <button
              type='button'
              onClick={() => router.push('/login')}
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
              🔐 Login
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
  );
}
