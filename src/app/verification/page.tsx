'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Snackbar from '../components/Snackbar';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function VerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userData, setUserData] = useState<any>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [documentVerified, setDocumentVerified] = useState(false);
  const [documentPending, setDocumentPending] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [landRegistrationFile, setLandRegistrationFile] = useState<File | null>(
    null
  );
  const [landRecordsFile, setLandRecordsFile] = useState<File | null>(null);
  const [organicLicenseFile, setOrganicLicenseFile] = useState<File | null>(
    null
  );
  const [farmerCertificateFile, setFarmerCertificateFile] =
    useState<File | null>(null);
  const [cropInsuranceFile, setCropInsuranceFile] = useState<File | null>(null);
  const [fpoMembershipFile, setFpoMembershipFile] = useState<File | null>(null);
  const [soilHealthCardFile, setSoilHealthCardFile] = useState<File | null>(
    null
  );
  const [otherFarmingDocFile, setOtherFarmingDocFile] = useState<File | null>(
    null
  );
  const [kisanId, setKisanId] = useState('');
  const [verificationLink, setVerificationLink] = useState<string | null>(null);

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

  // Check if user is logged in and get verification status
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userDataStr = localStorage.getItem('userData');

    if (!token || !userDataStr) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userDataStr);
      setUserData(user);
      setEmailVerified(user.emailVerified === true);
      setDocumentVerified(user.userVerified === true);
      setDocumentPending(user.documentStatus === 'pending');
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    }
  }, [router]);

  // Check for email verification token in URL
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyEmailToken(token);
    }
  }, [searchParams]);

  const verifyEmailToken = async (token: string) => {
    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setEmailVerified(true);

        // Update localStorage
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
          const user = JSON.parse(userDataStr);
          user.emailVerified = true;
          localStorage.setItem('userData', JSON.stringify(user));
        }

        showSnackbar('Email verified successfully! ✅', 'success');

        // Remove token from URL
        router.replace('/verification');
      } else {
        showSnackbar(result.message || 'Email verification failed', 'error');
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      showSnackbar('Error verifying email', 'error');
    }
  };

  const handleSendVerificationEmail = async () => {
    setSendingEmail(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Store the verification link if provided (development mode)
        if (result.verificationLink) {
          setVerificationLink(result.verificationLink);
          showSnackbar(
            'Verification link generated! Click the link below to verify. 📧',
            'success'
          );
        } else {
          showSnackbar(
            'Verification email sent! Please check your inbox. 📧',
            'success'
          );
        }
      } else {
        showSnackbar(
          result.message || 'Failed to send verification email',
          'error'
        );
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      showSnackbar('Error sending verification email', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleAadhaarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileType = file.type;

      // Accept only images and PDFs
      if (fileType.startsWith('image/') || fileType === 'application/pdf') {
        setAadhaarFile(file);
      } else {
        showSnackbar('Please select an image or PDF file', 'error');
        e.target.value = '';
      }
    }
  };

  const handleLandRegistrationFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileType = file.type;

      if (fileType.startsWith('image/') || fileType === 'application/pdf') {
        setLandRegistrationFile(file);
      } else {
        showSnackbar('Please select an image or PDF file', 'error');
        e.target.value = '';
      }
    }
  };

  const handleLandRecordsFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileType = file.type;

      if (fileType.startsWith('image/') || fileType === 'application/pdf') {
        setLandRecordsFile(file);
      } else {
        showSnackbar('Please select an image or PDF file', 'error');
        e.target.value = '';
      }
    }
  };

  const handleOrganicLicenseFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileType = file.type;

      // Accept only images and PDFs
      if (fileType.startsWith('image/') || fileType === 'application/pdf') {
        setOrganicLicenseFile(file);
      } else {
        showSnackbar('Please select an image or PDF file', 'error');
        e.target.value = '';
      }
    }
  };

  const handleFarmerCertificateFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileType = file.type;
      if (fileType.startsWith('image/') || fileType === 'application/pdf') {
        setFarmerCertificateFile(file);
      } else {
        showSnackbar('Please select an image or PDF file', 'error');
        e.target.value = '';
      }
    }
  };

  const handleCropInsuranceFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileType = file.type;
      if (fileType.startsWith('image/') || fileType === 'application/pdf') {
        setCropInsuranceFile(file);
      } else {
        showSnackbar('Please select an image or PDF file', 'error');
        e.target.value = '';
      }
    }
  };

  const handleFpoMembershipFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileType = file.type;
      if (fileType.startsWith('image/') || fileType === 'application/pdf') {
        setFpoMembershipFile(file);
      } else {
        showSnackbar('Please select an image or PDF file', 'error');
        e.target.value = '';
      }
    }
  };

  const handleSoilHealthCardFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileType = file.type;
      if (fileType.startsWith('image/') || fileType === 'application/pdf') {
        setSoilHealthCardFile(file);
      } else {
        showSnackbar('Please select an image or PDF file', 'error');
        e.target.value = '';
      }
    }
  };

  const handleOtherFarmingDocFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileType = file.type;
      if (fileType.startsWith('image/') || fileType === 'application/pdf') {
        setOtherFarmingDocFile(file);
      } else {
        showSnackbar('Please select an image or PDF file', 'error');
        e.target.value = '';
      }
    }
  };

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!aadhaarFile) {
      showSnackbar('Please upload Aadhaar card (mandatory)', 'error');
      return;
    }

    // For farmers, validate land documents
    if (userData.userType === 'farmer') {
      if (!landRegistrationFile) {
        showSnackbar(
          'Please upload Land Registration Document (mandatory)',
          'error'
        );
        return;
      }
      if (!landRecordsFile) {
        showSnackbar(
          'Please upload Land Records document (mandatory)',
          'error'
        );
        return;
      }
    }

    setUploadingDocs(true);

    try {
      const token = localStorage.getItem('authToken');

      // Helper function to upload a file to Vercel Blob
      const uploadFile = async (file: File, documentType: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);
        formData.append('farmerId', userData.farmerId || '');

        const uploadResponse = await fetch('/api/upload-document', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.message || 'Failed to upload file');
        }

        return await uploadResponse.json();
      };

      // Upload all mandatory and optional documents
      showSnackbar('Uploading documents to cloud storage...', 'info');
      
      const documents = [];

      // Upload Aadhaar (mandatory)
      const aadhaarUpload = await uploadFile(aadhaarFile, 'aadhaar');
      documents.push({
        documentType: 'aadhaar',
        fileName: aadhaarUpload.data.fileName,
        fileUrl: aadhaarUpload.data.url,
        fileSize: aadhaarUpload.data.fileSize,
        fileType: aadhaarUpload.data.fileType,
      });

      // Upload land documents for farmers (mandatory)
      if (userData.userType === 'farmer') {
        if (landRegistrationFile) {
          const landRegUpload = await uploadFile(landRegistrationFile, 'land_registration');
          documents.push({
            documentType: 'land_registration',
            fileName: landRegUpload.data.fileName,
            fileUrl: landRegUpload.data.url,
            fileSize: landRegUpload.data.fileSize,
            fileType: landRegUpload.data.fileType,
          });
        }
        if (landRecordsFile) {
          const landRecUpload = await uploadFile(landRecordsFile, 'land_records');
          documents.push({
            documentType: 'land_records',
            fileName: landRecUpload.data.fileName,
            fileUrl: landRecUpload.data.url,
            fileSize: landRecUpload.data.fileSize,
            fileType: landRecUpload.data.fileType,
          });
        }
      }

      // Upload optional documents if provided
      if (organicLicenseFile) {
        const organicUpload = await uploadFile(organicLicenseFile, 'organic_certificate');
        documents.push({
          documentType: 'organic_certificate',
          fileName: organicUpload.data.fileName,
          fileUrl: organicUpload.data.url,
          fileSize: organicUpload.data.fileSize,
          fileType: organicUpload.data.fileType,
        });
      }

      if (userData.userType === 'farmer') {
        if (farmerCertificateFile) {
          const farmerCertUpload = await uploadFile(farmerCertificateFile, 'farmer_certificate');
          documents.push({
            documentType: 'farmer_certificate',
            fileName: farmerCertUpload.data.fileName,
            fileUrl: farmerCertUpload.data.url,
            fileSize: farmerCertUpload.data.fileSize,
            fileType: farmerCertUpload.data.fileType,
          });
        }
        if (cropInsuranceFile) {
          const cropInsUpload = await uploadFile(cropInsuranceFile, 'crop_insurance');
          documents.push({
            documentType: 'crop_insurance',
            fileName: cropInsUpload.data.fileName,
            fileUrl: cropInsUpload.data.url,
            fileSize: cropInsUpload.data.fileSize,
            fileType: cropInsUpload.data.fileType,
          });
        }
        if (fpoMembershipFile) {
          const fpoUpload = await uploadFile(fpoMembershipFile, 'fpo_membership');
          documents.push({
            documentType: 'fpo_membership',
            fileName: fpoUpload.data.fileName,
            fileUrl: fpoUpload.data.url,
            fileSize: fpoUpload.data.fileSize,
            fileType: fpoUpload.data.fileType,
          });
        }
        if (soilHealthCardFile) {
          const soilUpload = await uploadFile(soilHealthCardFile, 'soil_health_card');
          documents.push({
            documentType: 'soil_health_card',
            fileName: soilUpload.data.fileName,
            fileUrl: soilUpload.data.url,
            fileSize: soilUpload.data.fileSize,
            fileType: soilUpload.data.fileType,
          });
        }
        if (otherFarmingDocFile) {
          const otherUpload = await uploadFile(otherFarmingDocFile, 'other_farming_document');
          documents.push({
            documentType: 'other_farming_document',
            fileName: otherUpload.data.fileName,
            fileUrl: otherUpload.data.url,
            fileSize: otherUpload.data.fileSize,
            fileType: otherUpload.data.fileType,
          });
        }
      }

      showSnackbar('Saving document information...', 'info');

      // Submit document information to database
      const response = await fetch('/api/submit-verification-docs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          documents,
          kisanId: userData.userType === 'farmer' ? kisanId : undefined,
          farmerId: userData.farmerId || null,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setDocumentPending(true);

        // Update localStorage
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
          const user = JSON.parse(userDataStr);
          user.documentStatus = 'pending';
          localStorage.setItem('userData', JSON.stringify(user));
        }

        showSnackbar(
          'Documents submitted successfully! Pending admin verification. 📄',
          'success'
        );
        setAadhaarFile(null);
        setLandRegistrationFile(null);
        setLandRecordsFile(null);
        setOrganicLicenseFile(null);
        setFarmerCertificateFile(null);
        setCropInsuranceFile(null);
        setFpoMembershipFile(null);
        setSoilHealthCardFile(null);
        setOtherFarmingDocFile(null);
        setKisanId('');
      } else {
        showSnackbar(result.message || 'Failed to submit documents', 'error');
      }
    } catch (error) {
      console.error('Error submitting documents:', error);
      showSnackbar(
        error instanceof Error ? error.message : 'Error submitting documents',
        'error'
      );
    } finally {
      setUploadingDocs(false);
    }
  };

  // Document types based on user type
  const getDocumentTypes = () => {
    if (!userData) return [];

    if (userData.userType === 'farmer') {
      return [
        { value: 'land_ownership', label: 'Land Ownership Certificate' },
        { value: 'farming_license', label: 'Farming License' },
        { value: 'identity_proof', label: 'Identity Proof (Aadhar/PAN)' },
        { value: 'bank_details', label: 'Bank Account Details' },
        {
          value: 'organic_certificate',
          label: 'Organic Certification (if applicable)',
        },
      ];
    } else {
      return [
        { value: 'business_license', label: 'Business License' },
        { value: 'identity_proof', label: 'Identity Proof (Aadhar/PAN)' },
        { value: 'gst_certificate', label: 'GST Certificate' },
        { value: 'bank_details', label: 'Bank Account Details' },
      ];
    }
  };

  if (!userData) {
    return (
      <div style={{ background: '#f1f8e9', minHeight: '100vh' }}>
        <Header />
        <main style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ background: '#f1f8e9', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .verification-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }
        .step-card {
          background: #fffde7;
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 2px 8px rgba(200, 230, 201, 0.4);
          border: 2px solid #c8e6c9;
        }
        .step-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .step-number {
          background: #388e3c;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.2rem;
        }
        .step-number.completed {
          background: #2e7d32;
        }
        .step-number.pending {
          background: #ff9800;
        }
        .step-title {
          color: #388e3c;
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: bold;
          font-size: 0.9rem;
        }
        .status-verified {
          background: #c8e6c9;
          color: #2e7d32;
        }
        .status-pending {
          background: #ffe0b2;
          color: #f57c00;
        }
        .status-not-started {
          background: #ffcdd2;
          color: #c62828;
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        .form-label {
          display: block;
          color: #388e3c;
          font-weight: bold;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }
        .form-select {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #c8e6c9;
          border-radius: 8px;
          font-size: 1rem;
          color: #000000;
          background: white;
          transition: border-color 0.3s ease;
        }
        .form-select:focus {
          outline: none;
          border-color: #388e3c;
        }
        .file-input {
          display: none;
        }
        .file-label {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          background: #388e3c;
          color: white;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          transition: background 0.3s ease;
        }
        .file-label:hover {
          background: #2e7d32;
        }
        .file-info {
          margin-top: 0.5rem;
          color: #6d4c41;
          font-size: 0.9rem;
        }
        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1rem;
        }
        .btn-primary {
          background: #388e3c;
          color: white;
        }
        .btn-primary:hover {
          background: #2e7d32;
        }
        .btn-primary:disabled {
          background: #c8e6c9;
          cursor: not-allowed;
        }
      `}</style>

      <Header />

      <main className='verification-container'>
        <h1
          style={{ color: '#388e3c', fontSize: '2rem', marginBottom: '2rem' }}
        >
          Account Verification
        </h1>

        {/* Step 1: Email Verification */}
        <div className='step-card'>
          <div className='step-header'>
            <div className={`step-number ${emailVerified ? 'completed' : ''}`}>
              {emailVerified ? '✓' : '1'}
            </div>
            <h2 className='step-title'>Email Verification</h2>
          </div>

          {emailVerified ? (
            <div className='status-badge status-verified'>
              ✅ Email Verified
            </div>
          ) : (
            <div>
              <p style={{ color: '#6d4c41', marginBottom: '1.5rem' }}>
                Verify your email address to continue. Click the button below to
                receive a verification link.
              </p>
              <button
                className='btn btn-primary'
                onClick={handleSendVerificationEmail}
                disabled={sendingEmail}
              >
                {sendingEmail ? (
                  <>
                    <div
                      style={{
                        display: 'inline-block',
                        width: '16px',
                        height: '16px',
                        border: '2px solid transparent',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginRight: '0.5rem',
                      }}
                    ></div>
                    Sending...
                  </>
                ) : (
                  <>📧 Send Verification Email</>
                )}
              </button>

              {/* Display verification link in development mode */}
              {verificationLink && (
                <div
                  style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: '#e3f2fd',
                    border: '2px solid #2196f3',
                    borderRadius: '8px',
                  }}
                >
                  <p
                    style={{
                      color: '#1976d2',
                      fontWeight: 'bold',
                      margin: '0 0 0.5rem 0',
                    }}
                  >
                    🔗 Development Mode - Verification Link:
                  </p>
                  <a
                    href={verificationLink}
                    style={{
                      color: '#1976d2',
                      textDecoration: 'underline',
                      wordBreak: 'break-all',
                      fontSize: '0.9rem',
                    }}
                  >
                    {verificationLink}
                  </a>
                  <p
                    style={{
                      color: '#6d4c41',
                      fontSize: '0.8rem',
                      margin: '0.5rem 0 0 0',
                      fontStyle: 'italic',
                    }}
                  >
                    Click the link above to verify your email
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Document Verification */}
        <div className='step-card'>
          <div className='step-header'>
            <div
              className={`step-number ${
                !emailVerified
                  ? ''
                  : documentVerified
                  ? 'completed'
                  : documentPending
                  ? 'pending'
                  : ''
              }`}
            >
              {documentVerified ? '✓' : '2'}
            </div>
            <h2 className='step-title'>Document Verification</h2>
          </div>

          {!emailVerified ? (
            <div className='status-badge status-not-started'>
              ⏸️ Complete email verification first
            </div>
          ) : documentVerified ? (
            <div className='status-badge status-verified'>
              ✅ Documents Verified
            </div>
          ) : documentPending ? (
            <div>
              <div className='status-badge status-pending'>
                ⏳ Pending Admin Verification
              </div>
              <p style={{ color: '#6d4c41', marginTop: '1rem' }}>
                Your documents have been submitted and are pending admin review.
                You will be notified once the verification is complete.
              </p>
            </div>
          ) : (
            <form onSubmit={handleDocumentSubmit}>
              <p style={{ color: '#6d4c41', marginBottom: '1.5rem' }}>
                Upload your verification documents. Aadhaar card is mandatory
                for all users.
                {userData.userType === 'farmer' &&
                  ' Organic certification is optional but recommended for organic farmers.'}
              </p>

              {/* Aadhaar Card Upload - Mandatory */}
              <div
                className='form-group'
                style={{
                  background: '#fff3e0',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  border: '2px solid #ff9800',
                  marginBottom: '2rem',
                }}
              >
                <label
                  className='form-label'
                  style={{
                    fontSize: '1.1rem',
                    color: '#e65100',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                  }}
                >
                  🆔 Aadhaar Card{' '}
                  <span
                    style={{
                      background: '#d32f2f',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                    }}
                  >
                    MANDATORY
                  </span>
                </label>
                <p
                  style={{
                    color: '#6d4c41',
                    fontSize: '0.9rem',
                    marginBottom: '1rem',
                    fontStyle: 'italic',
                  }}
                >
                  Upload a clear copy of your Aadhaar card (front and back).
                  Accepted formats: JPG, PNG, PDF
                </p>
                <input
                  type='file'
                  id='aadhaar-upload'
                  className='file-input'
                  accept='image/*,.pdf'
                  onChange={handleAadhaarFileChange}
                  required
                />
                <label
                  htmlFor='aadhaar-upload'
                  className='file-label'
                  style={{
                    background: '#ff9800',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#f57c00';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#ff9800';
                  }}
                >
                  📎 Choose Aadhaar File
                </label>
                {aadhaarFile && (
                  <div
                    className='file-info'
                    style={{
                      color: '#2e7d32',
                      fontWeight: 'bold',
                      marginTop: '0.75rem',
                      background: '#e8f5e9',
                      padding: '0.75rem',
                      borderRadius: '4px',
                      border: '1px solid #c8e6c9',
                    }}
                  >
                    ✅ Selected: {aadhaarFile.name} (
                    {(aadhaarFile.size / 1024).toFixed(2)} KB)
                  </div>
                )}
              </div>

              {/* Land Registration Document - Mandatory (Only for Farmers) */}
              {userData.userType === 'farmer' && (
                <div
                  className='form-group'
                  style={{
                    background: '#fff3e0',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '2px solid #ff6f00',
                    marginBottom: '2rem',
                  }}
                >
                  <label
                    className='form-label'
                    style={{
                      fontSize: '1.1rem',
                      color: '#e65100',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                    }}
                  >
                    📄 Land Registration Document{' '}
                    <span
                      style={{
                        background: '#d32f2f',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                      }}
                    >
                      MANDATORY
                    </span>
                  </label>
                  <p
                    style={{
                      color: '#6d4c41',
                      fontSize: '0.9rem',
                      marginBottom: '1rem',
                      fontStyle: 'italic',
                    }}
                  >
                    Upload your official Land Registration Document showing land
                    ownership. This is required to verify your farming
                    credentials. Accepted formats: JPG, PNG, PDF
                  </p>
                  <input
                    type='file'
                    id='land-registration-upload'
                    className='file-input'
                    accept='image/*,.pdf'
                    onChange={handleLandRegistrationFileChange}
                    required
                  />
                  <label
                    htmlFor='land-registration-upload'
                    className='file-label'
                    style={{
                      background: '#ff6f00',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#e65100';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#ff6f00';
                    }}
                  >
                    📎 Choose Land Registration Document
                  </label>
                  {landRegistrationFile && (
                    <div
                      className='file-info'
                      style={{
                        color: '#2e7d32',
                        fontWeight: 'bold',
                        marginTop: '0.75rem',
                        background: '#ffe0b2',
                        padding: '0.75rem',
                        borderRadius: '4px',
                        border: '1px solid #ff6f00',
                      }}
                    >
                      ✅ Selected: {landRegistrationFile.name} (
                      {(landRegistrationFile.size / 1024).toFixed(2)} KB)
                    </div>
                  )}
                </div>
              )}

              {/* Land Records Document - Mandatory (Only for Farmers) */}
              {userData.userType === 'farmer' && (
                <div
                  className='form-group'
                  style={{
                    background: '#fff3e0',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '2px solid #ff6f00',
                    marginBottom: '2rem',
                  }}
                >
                  <label
                    className='form-label'
                    style={{
                      fontSize: '1.1rem',
                      color: '#e65100',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                    }}
                  >
                    📋 Land Records{' '}
                    <span
                      style={{
                        background: '#d32f2f',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                      }}
                    >
                      MANDATORY
                    </span>
                  </label>
                  <p
                    style={{
                      color: '#6d4c41',
                      fontSize: '0.9rem',
                      marginBottom: '1rem',
                      fontStyle: 'italic',
                    }}
                  >
                    Upload your Land Records document. The document name varies
                    by state (see below). Accepted formats: JPG, PNG, PDF
                  </p>

                  {/* State-specific document names */}
                  <div
                    style={{
                      background: '#ffe0b2',
                      padding: '1rem',
                      borderRadius: '6px',
                      marginBottom: '1rem',
                      border: '1px solid #ffb74d',
                    }}
                  >
                    <p
                      style={{
                        color: '#e65100',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        marginBottom: '0.5rem',
                      }}
                    >
                      💡 Document names by state:
                    </p>
                    <ul
                      style={{
                        margin: '0',
                        paddingLeft: '1.5rem',
                        color: '#5d4037',
                        fontSize: '0.8rem',
                        lineHeight: '1.6',
                      }}
                    >
                      <li>
                        <strong>UP, MP, Rajasthan:</strong> Khasra–Khatauni
                      </li>
                      <li>
                        <strong>Punjab, Haryana, Himachal:</strong> Jamabandi
                      </li>
                      <li>
                        <strong>Tamil Nadu:</strong> Patta / Chitta / Adangal
                      </li>
                      <li>
                        <strong>Maharashtra:</strong> 7/12 Extract
                      </li>
                      <li>
                        <strong>Karnataka:</strong> RTC (Record of Tenancy &
                        Crops)
                      </li>
                      <li>
                        <strong>Telangana, Andhra Pradesh:</strong> ROR / Pahani
                      </li>
                    </ul>
                  </div>

                  <input
                    type='file'
                    id='land-records-upload'
                    className='file-input'
                    accept='image/*,.pdf'
                    onChange={handleLandRecordsFileChange}
                    required
                  />
                  <label
                    htmlFor='land-records-upload'
                    className='file-label'
                    style={{
                      background: '#ff6f00',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#e65100';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#ff6f00';
                    }}
                  >
                    📎 Choose Land Records Document
                  </label>
                  {landRecordsFile && (
                    <div
                      className='file-info'
                      style={{
                        color: '#2e7d32',
                        fontWeight: 'bold',
                        marginTop: '0.75rem',
                        background: '#ffe0b2',
                        padding: '0.75rem',
                        borderRadius: '4px',
                        border: '1px solid #ff6f00',
                      }}
                    >
                      ✅ Selected: {landRecordsFile.name} (
                      {(landRecordsFile.size / 1024).toFixed(2)} KB)
                    </div>
                  )}
                </div>
              )}

              {/* Kisan ID / Farmer ID - Optional (Only for Farmers) */}
              {userData.userType === 'farmer' && (
                <div
                  className='form-group'
                  style={{
                    background: '#fff9c4',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '2px solid #fbc02d',
                    marginBottom: '2rem',
                  }}
                >
                  <label
                    className='form-label'
                    style={{
                      fontSize: '1.1rem',
                      color: '#f57f17',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                    }}
                  >
                    🪪 Kisan ID / Farmer ID{' '}
                    <span
                      style={{
                        background: '#2196f3',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                      }}
                    >
                      OPTIONAL
                    </span>
                  </label>
                  <p
                    style={{
                      color: '#6d4c41',
                      fontSize: '0.9rem',
                      marginBottom: '1rem',
                      fontStyle: 'italic',
                    }}
                  >
                    Enter your Kisan ID or Farmer ID if you have one. This helps
                    in faster verification.
                  </p>
                  <input
                    type='text'
                    placeholder='Enter your Kisan ID or Farmer ID'
                    value={kisanId}
                    onChange={(e) => setKisanId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #fbc02d',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      color: '#000000',
                      background: 'white',
                    }}
                  />
                </div>
              )}

              {/* Organic License Upload - Optional (Only for Farmers) */}
              {userData.userType === 'farmer' && (
                <div
                  className='form-group'
                  style={{
                    background: '#e8f5e9',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '2px solid #c8e6c9',
                    marginBottom: '2rem',
                  }}
                >
                  <label
                    className='form-label'
                    style={{
                      fontSize: '1.1rem',
                      color: '#388e3c',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                    }}
                  >
                    🌿 Organic Certification{' '}
                    <span
                      style={{
                        background: '#2196f3',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                      }}
                    >
                      OPTIONAL
                    </span>
                  </label>
                  <p
                    style={{
                      color: '#6d4c41',
                      fontSize: '0.9rem',
                      marginBottom: '1rem',
                      fontStyle: 'italic',
                    }}
                  >
                    If you are an organic farmer, upload your organic
                    certification. This will help you get better visibility and
                    pricing. Accepted formats: JPG, PNG, PDF
                  </p>
                  <input
                    type='file'
                    id='organic-license-upload'
                    className='file-input'
                    accept='image/*,.pdf'
                    onChange={handleOrganicLicenseFileChange}
                  />
                  <label
                    htmlFor='organic-license-upload'
                    className='file-label'
                    style={{
                      background: '#388e3c',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#2e7d32';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#388e3c';
                    }}
                  >
                    📎 Choose Organic Certificate (Optional)
                  </label>
                  {organicLicenseFile && (
                    <div
                      className='file-info'
                      style={{
                        color: '#2e7d32',
                        fontWeight: 'bold',
                        marginTop: '0.75rem',
                        background: '#c8e6c9',
                        padding: '0.75rem',
                        borderRadius: '4px',
                        border: '1px solid #388e3c',
                      }}
                    >
                      ✅ Selected: {organicLicenseFile.name} (
                      {(organicLicenseFile.size / 1024).toFixed(2)} KB)
                    </div>
                  )}
                </div>
              )}

              {/* Farmer Certificate Upload - Optional (Only for Farmers) */}
              {userData.userType === 'farmer' && (
                <div
                  className='form-group'
                  style={{
                    background: '#e1f5fe',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '2px solid #81d4fa',
                    marginBottom: '2rem',
                  }}
                >
                  <label
                    className='form-label'
                    style={{
                      fontSize: '1.1rem',
                      color: '#0277bd',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                    }}
                  >
                    📜 Farmer Certificate{' '}
                    <span
                      style={{
                        background: '#2196f3',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                      }}
                    >
                      OPTIONAL
                    </span>
                  </label>
                  <p
                    style={{
                      color: '#6d4c41',
                      fontSize: '0.9rem',
                      marginBottom: '1rem',
                      fontStyle: 'italic',
                    }}
                  >
                    Upload your Farmer Certificate issued by agricultural
                    authorities. This helps verify your farming credentials.
                    Accepted formats: JPG, PNG, PDF
                  </p>
                  <input
                    type='file'
                    id='farmer-certificate-upload'
                    className='file-input'
                    accept='image/*,.pdf'
                    onChange={handleFarmerCertificateFileChange}
                  />
                  <label
                    htmlFor='farmer-certificate-upload'
                    className='file-label'
                    style={{
                      background: '#0288d1',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#0277bd';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#0288d1';
                    }}
                  >
                    📎 Choose Farmer Certificate (Optional)
                  </label>
                  {farmerCertificateFile && (
                    <div
                      className='file-info'
                      style={{
                        color: '#2e7d32',
                        fontWeight: 'bold',
                        marginTop: '0.75rem',
                        background: '#b3e5fc',
                        padding: '0.75rem',
                        borderRadius: '4px',
                        border: '1px solid #0288d1',
                      }}
                    >
                      ✅ Selected: {farmerCertificateFile.name} (
                      {(farmerCertificateFile.size / 1024).toFixed(2)} KB)
                    </div>
                  )}
                </div>
              )}

              {/* Crop Insurance Upload - Optional (Only for Farmers) */}
              {userData.userType === 'farmer' && (
                <div
                  className='form-group'
                  style={{
                    background: '#fce4ec',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '2px solid #f8bbd0',
                    marginBottom: '2rem',
                  }}
                >
                  <label
                    className='form-label'
                    style={{
                      fontSize: '1.1rem',
                      color: '#c2185b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                    }}
                  >
                    🛡️ Crop Insurance Document{' '}
                    <span
                      style={{
                        background: '#2196f3',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                      }}
                    >
                      OPTIONAL
                    </span>
                  </label>
                  <p
                    style={{
                      color: '#6d4c41',
                      fontSize: '0.9rem',
                      marginBottom: '1rem',
                      fontStyle: 'italic',
                    }}
                  >
                    Upload your Crop Insurance policy or certificate. This
                    demonstrates your commitment to risk management. Accepted
                    formats: JPG, PNG, PDF
                  </p>
                  <input
                    type='file'
                    id='crop-insurance-upload'
                    className='file-input'
                    accept='image/*,.pdf'
                    onChange={handleCropInsuranceFileChange}
                  />
                  <label
                    htmlFor='crop-insurance-upload'
                    className='file-label'
                    style={{
                      background: '#d81b60',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#c2185b';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#d81b60';
                    }}
                  >
                    📎 Choose Crop Insurance Doc (Optional)
                  </label>
                  {cropInsuranceFile && (
                    <div
                      className='file-info'
                      style={{
                        color: '#2e7d32',
                        fontWeight: 'bold',
                        marginTop: '0.75rem',
                        background: '#f8bbd0',
                        padding: '0.75rem',
                        borderRadius: '4px',
                        border: '1px solid #d81b60',
                      }}
                    >
                      ✅ Selected: {cropInsuranceFile.name} (
                      {(cropInsuranceFile.size / 1024).toFixed(2)} KB)
                    </div>
                  )}
                </div>
              )}

              {/* FPO Membership Upload - Optional (Only for Farmers) */}
              {userData.userType === 'farmer' && (
                <div
                  className='form-group'
                  style={{
                    background: '#f3e5f5',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '2px solid #ce93d8',
                    marginBottom: '2rem',
                  }}
                >
                  <label
                    className='form-label'
                    style={{
                      fontSize: '1.1rem',
                      color: '#7b1fa2',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                    }}
                  >
                    🤝 FPO Membership Certificate{' '}
                    <span
                      style={{
                        background: '#2196f3',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                      }}
                    >
                      OPTIONAL
                    </span>
                  </label>
                  <p
                    style={{
                      color: '#6d4c41',
                      fontSize: '0.9rem',
                      marginBottom: '1rem',
                      fontStyle: 'italic',
                    }}
                  >
                    Upload your Farmer Producer Organization (FPO) membership
                    certificate. This shows your association with organized
                    farming groups. Accepted formats: JPG, PNG, PDF
                  </p>
                  <input
                    type='file'
                    id='fpo-membership-upload'
                    className='file-input'
                    accept='image/*,.pdf'
                    onChange={handleFpoMembershipFileChange}
                  />
                  <label
                    htmlFor='fpo-membership-upload'
                    className='file-label'
                    style={{
                      background: '#8e24aa',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#7b1fa2';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#8e24aa';
                    }}
                  >
                    📎 Choose FPO Certificate (Optional)
                  </label>
                  {fpoMembershipFile && (
                    <div
                      className='file-info'
                      style={{
                        color: '#2e7d32',
                        fontWeight: 'bold',
                        marginTop: '0.75rem',
                        background: '#ce93d8',
                        padding: '0.75rem',
                        borderRadius: '4px',
                        border: '1px solid #8e24aa',
                      }}
                    >
                      ✅ Selected: {fpoMembershipFile.name} (
                      {(fpoMembershipFile.size / 1024).toFixed(2)} KB)
                    </div>
                  )}
                </div>
              )}

              {/* Soil Health Card Upload - Optional (Only for Farmers) */}
              {userData.userType === 'farmer' && (
                <div
                  className='form-group'
                  style={{
                    background: '#efebe9',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '2px solid #bcaaa4',
                    marginBottom: '2rem',
                  }}
                >
                  <label
                    className='form-label'
                    style={{
                      fontSize: '1.1rem',
                      color: '#5d4037',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                    }}
                  >
                    🌱 Soil Health Card{' '}
                    <span
                      style={{
                        background: '#2196f3',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                      }}
                    >
                      OPTIONAL
                    </span>
                  </label>
                  <p
                    style={{
                      color: '#6d4c41',
                      fontSize: '0.9rem',
                      marginBottom: '1rem',
                      fontStyle: 'italic',
                    }}
                  >
                    Upload your Soil Health Card issued by the government. This
                    demonstrates your knowledge of soil nutrients and farming
                    practices. Accepted formats: JPG, PNG, PDF
                  </p>
                  <input
                    type='file'
                    id='soil-health-card-upload'
                    className='file-input'
                    accept='image/*,.pdf'
                    onChange={handleSoilHealthCardFileChange}
                  />
                  <label
                    htmlFor='soil-health-card-upload'
                    className='file-label'
                    style={{
                      background: '#6d4c41',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#5d4037';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#6d4c41';
                    }}
                  >
                    📎 Choose Soil Health Card (Optional)
                  </label>
                  {soilHealthCardFile && (
                    <div
                      className='file-info'
                      style={{
                        color: '#2e7d32',
                        fontWeight: 'bold',
                        marginTop: '0.75rem',
                        background: '#d7ccc8',
                        padding: '0.75rem',
                        borderRadius: '4px',
                        border: '1px solid #6d4c41',
                      }}
                    >
                      ✅ Selected: {soilHealthCardFile.name} (
                      {(soilHealthCardFile.size / 1024).toFixed(2)} KB)
                    </div>
                  )}
                </div>
              )}

              {/* Other Farming Document Upload - Optional (Only for Farmers) */}
              {userData.userType === 'farmer' && (
                <div
                  className='form-group'
                  style={{
                    background: '#e0f2f1',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '2px solid #80cbc4',
                    marginBottom: '2rem',
                  }}
                >
                  <label
                    className='form-label'
                    style={{
                      fontSize: '1.1rem',
                      color: '#00695c',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                    }}
                  >
                    📋 Other Farming Related Document{' '}
                    <span
                      style={{
                        background: '#2196f3',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                      }}
                    >
                      OPTIONAL
                    </span>
                  </label>
                  <p
                    style={{
                      color: '#6d4c41',
                      fontSize: '0.9rem',
                      marginBottom: '1rem',
                      fontStyle: 'italic',
                    }}
                  >
                    Upload any other relevant farming document that validates
                    your farming activities (e.g., Awards, Training
                    Certificates, etc.). Accepted formats: JPG, PNG, PDF
                  </p>
                  <input
                    type='file'
                    id='other-farming-doc-upload'
                    className='file-input'
                    accept='image/*,.pdf'
                    onChange={handleOtherFarmingDocFileChange}
                  />
                  <label
                    htmlFor='other-farming-doc-upload'
                    className='file-label'
                    style={{
                      background: '#00897b',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#00695c';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#00897b';
                    }}
                  >
                    📎 Choose Other Document (Optional)
                  </label>
                  {otherFarmingDocFile && (
                    <div
                      className='file-info'
                      style={{
                        color: '#2e7d32',
                        fontWeight: 'bold',
                        marginTop: '0.75rem',
                        background: '#b2dfdb',
                        padding: '0.75rem',
                        borderRadius: '4px',
                        border: '1px solid #00897b',
                      }}
                    >
                      ✅ Selected: {otherFarmingDocFile.name} (
                      {(otherFarmingDocFile.size / 1024).toFixed(2)} KB)
                    </div>
                  )}
                </div>
              )}

              <button
                type='submit'
                className='btn btn-primary'
                disabled={
                  uploadingDocs ||
                  !aadhaarFile ||
                  (userData.userType === 'farmer' &&
                    (!landRegistrationFile || !landRecordsFile))
                }
                style={{
                  opacity:
                    uploadingDocs ||
                    !aadhaarFile ||
                    (userData.userType === 'farmer' &&
                      (!landRegistrationFile || !landRecordsFile))
                      ? 0.6
                      : 1,
                }}
              >
                {uploadingDocs ? (
                  <>
                    <div
                      style={{
                        display: 'inline-block',
                        width: '16px',
                        height: '16px',
                        border: '2px solid transparent',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginRight: '0.5rem',
                      }}
                    ></div>
                    Submitting...
                  </>
                ) : (
                  <>📄 Submit Documents for Verification</>
                )}
              </button>
              {(!aadhaarFile ||
                (userData.userType === 'farmer' &&
                  (!landRegistrationFile || !landRecordsFile))) && (
                <p
                  style={{
                    color: '#d32f2f',
                    fontSize: '0.85rem',
                    marginTop: '0.75rem',
                    fontStyle: 'italic',
                  }}
                >
                  * {!aadhaarFile && 'Aadhaar card is required'}
                  {!aadhaarFile &&
                    userData.userType === 'farmer' &&
                    (!landRegistrationFile || !landRecordsFile) &&
                    ', '}
                  {userData.userType === 'farmer' &&
                    !landRegistrationFile &&
                    'Land Registration Document is required'}
                  {userData.userType === 'farmer' &&
                    !landRegistrationFile &&
                    !landRecordsFile &&
                    ', '}
                  {userData.userType === 'farmer' &&
                    !landRecordsFile &&
                    'Land Records document is required'}
                </p>
              )}
            </form>
          )}
        </div>
      </main>

      <Footer />

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
