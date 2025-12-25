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
  const [verificationMethod, setVerificationMethod] = useState<
    'documents' | 'kisan'
  >('documents');
  const [kisanConsent, setKisanConsent] = useState(false);
  const [verificationLink, setVerificationLink] = useState<string | null>(null);

  // State for tracking individual optional document statuses
  const [optionalDocStatuses, setOptionalDocStatuses] = useState<{
    kisanId: 'none' | 'pending' | 'verified' | 'rejected';
    organicLicense: 'none' | 'pending' | 'verified' | 'rejected';
    farmerCertificate: 'none' | 'pending' | 'verified' | 'rejected';
    cropInsurance: 'none' | 'pending' | 'verified' | 'rejected';
    fpoMembership: 'none' | 'pending' | 'verified' | 'rejected';
    soilHealthCard: 'none' | 'pending' | 'verified' | 'rejected';
    otherFarmingDoc: 'none' | 'pending' | 'verified' | 'rejected';
  }>({
    kisanId: 'none',
    organicLicense: 'none',
    farmerCertificate: 'none',
    cropInsurance: 'none',
    fpoMembership: 'none',
    soilHealthCard: 'none',
    otherFarmingDoc: 'none',
  });

  const [uploadingOptionalDoc, setUploadingOptionalDoc] = useState<
    string | null
  >(null);

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

      // Extract userId from JWT token (most reliable source)
      let userId = user.userId || user._id;

      // If still not found, decode JWT token
      if (!userId && token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const decoded = JSON.parse(jsonPayload);
          userId = decoded.userId;
          console.log('Decoded userId from JWT:', userId);
        } catch (decodeError) {
          console.error('Error decoding JWT:', decodeError);
        }
      }

      if (userId) {
        console.log('Fetching optional doc statuses for userId:', userId);
        fetchOptionalDocStatuses(token, userId);
      } else {
        console.error('No userId found in user data or JWT token:', user);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    }
  }, [router]);

  // Fetch optional document statuses from database
  const fetchOptionalDocStatuses = async (token: string, userId: string) => {
    try {
      console.log('Fetching verification docs for userId:', userId);
      const response = await fetch(`/api/verification-docs?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('API response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Verification docs result:', result);
        if (result.success && result.data) {
          // result.data is a single document object (not an array) when userId is provided
          const verificationDoc = result.data;
          const docs = verificationDoc.documents || [];
          console.log('Documents found:', docs.length, docs);
          const newStatuses = { ...optionalDocStatuses };

          // Map document types to state keys
          const docTypeMap: {
            [key: string]: keyof typeof optionalDocStatuses;
          } = {
            kisanId: 'kisanId',
            organic_certificate: 'organicLicense',
            organicLicense: 'organicLicense',
            farmer_certificate: 'farmerCertificate',
            farmerCertificate: 'farmerCertificate',
            crop_insurance: 'cropInsurance',
            cropInsurance: 'cropInsurance',
            fpo_membership: 'fpoMembership',
            fpoMembership: 'fpoMembership',
            soil_health_card: 'soilHealthCard',
            soilHealthCard: 'soilHealthCard',
            other_farming_document: 'otherFarmingDoc',
            otherFarmingDoc: 'otherFarmingDoc',
          };

          // Check if kisanId exists (stored differently)
          if (verificationDoc.kisanId) {
            newStatuses.kisanId =
              verificationDoc.documentStatus === 'verified'
                ? 'verified'
                : 'pending';
            console.log('KisanId status set to:', newStatuses.kisanId);
          }

          // Process each document
          docs.forEach((doc: any) => {
            const stateKey = docTypeMap[doc.documentType];
            console.log(
              'Processing doc:',
              doc.documentType,
              'verified:',
              doc.verified,
              'status:',
              doc.status,
              'stateKey:',
              stateKey
            );
            if (stateKey) {
              // Check status field first for rejected status
              if (doc.status === 'rejected') {
                newStatuses[stateKey] = 'rejected';
              } else if (doc.verified === true) {
                newStatuses[stateKey] = 'verified';
              } else if (doc.verified === false) {
                newStatuses[stateKey] = 'pending';
              } else {
                // Fallback to status field if verified is not set
                newStatuses[stateKey] = doc.status || 'pending';
              }
              console.log(`Set ${stateKey} status to:`, newStatuses[stateKey]);
            }
          });

          console.log('Final statuses to set:', newStatuses);
          setOptionalDocStatuses(newStatuses);
        }
      }
    } catch (error) {
      console.error('Error fetching optional doc statuses:', error);
    }
  };

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

  // Handler for mandatory document submission (Section 2 only)
  const handleMandatoryDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For farmers using Kisan ID verification
    if (userData.userType === 'farmer' && verificationMethod === 'kisan') {
      if (!kisanId || kisanId.trim() === '') {
        showSnackbar('Please enter your Kisan ID', 'error');
        return;
      }
      if (!kisanConsent) {
        showSnackbar(
          'Please provide consent for Kisan ID verification',
          'error'
        );
        return;
      }

      // Handle Kisan ID verification
      setUploadingDocs(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/submit-verification-docs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            kisanId: kisanId,
            verificationMethod: 'kisan',
            consent: kisanConsent,
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          showSnackbar(
            '🎉 Kisan ID submitted successfully! Your verification is pending. You will receive an OTP for verification.',
            'success'
          );
          setDocumentPending(true);
          const updatedUserData = {
            ...userData,
            documentStatus: 'pending',
          };
          localStorage.setItem('userData', JSON.stringify(updatedUserData));
          setUserData(updatedUserData);
        } else {
          throw new Error(result.message || 'Failed to submit Kisan ID');
        }
      } catch (error) {
        console.error('Error submitting Kisan ID:', error);
        showSnackbar(
          `Error: ${
            error instanceof Error ? error.message : 'Failed to submit Kisan ID'
          }`,
          'error'
        );
      } finally {
        setUploadingDocs(false);
      }
      return;
    }

    // Regular document upload validation for mandatory documents only
    if (!aadhaarFile) {
      showSnackbar('Please upload Aadhaar card (mandatory)', 'error');
      return;
    }

    // For farmers using document verification, validate land documents
    if (userData.userType === 'farmer' && verificationMethod === 'documents') {
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

      // Upload only mandatory documents
      showSnackbar('Uploading mandatory documents to cloud storage...', 'info');

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
          const landRegUpload = await uploadFile(
            landRegistrationFile,
            'land_registration'
          );
          documents.push({
            documentType: 'land_registration',
            fileName: landRegUpload.data.fileName,
            fileUrl: landRegUpload.data.url,
            fileSize: landRegUpload.data.fileSize,
            fileType: landRegUpload.data.fileType,
          });
        }
        if (landRecordsFile) {
          const landRecUpload = await uploadFile(
            landRecordsFile,
            'land_records'
          );
          documents.push({
            documentType: 'land_records',
            fileName: landRecUpload.data.fileName,
            fileUrl: landRecUpload.data.url,
            fileSize: landRecUpload.data.fileSize,
            fileType: landRecUpload.data.fileType,
          });
        }
      }

      showSnackbar('Saving mandatory document information...', 'info');

      // Submit mandatory document information to database
      const response = await fetch('/api/submit-verification-docs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          documents,
          farmerId: userData.farmerId || null,
          verificationMethod: 'documents',
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
          'Mandatory documents submitted successfully! Pending admin verification. 📄',
          'success'
        );
        setAadhaarFile(null);
        setLandRegistrationFile(null);
        setLandRecordsFile(null);
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

  // Handler for individual optional document submission
  const handleOptionalDocSubmit = async (
    docType:
      | 'kisanId'
      | 'organicLicense'
      | 'farmerCertificate'
      | 'cropInsurance'
      | 'fpoMembership'
      | 'soilHealthCard'
      | 'otherFarmingDoc',
    file: File | null,
    additionalData?: any
  ) => {
    setUploadingOptionalDoc(docType);

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

      const documents = [];

      // Handle Kisan ID (text input, not file)
      if (docType === 'kisanId') {
        if (!kisanId || kisanId.trim() === '') {
          showSnackbar('Please enter your Kisan ID', 'error');
          setUploadingOptionalDoc(null);
          return;
        }

        // Submit Kisan ID as optional document
        const response = await fetch('/api/submit-verification-docs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            kisanId: kisanId,
            farmerId: userData.farmerId || null,
            isOptional: true,
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setOptionalDocStatuses((prev) => ({ ...prev, kisanId: 'pending' }));
          showSnackbar('Kisan ID submitted for verification! ✅', 'success');
        } else {
          throw new Error(result.message || 'Failed to submit Kisan ID');
        }
      } else {
        // Handle file upload
        if (!file) {
          showSnackbar('Please select a file to upload', 'error');
          setUploadingOptionalDoc(null);
          return;
        }

        showSnackbar(`Uploading ${docType} document...`, 'info');

        const uploadResult = await uploadFile(file, docType);
        documents.push({
          documentType: docType,
          fileName: uploadResult.data.fileName,
          fileUrl: uploadResult.data.url,
          fileSize: uploadResult.data.fileSize,
          fileType: uploadResult.data.fileType,
        });

        // Submit document information to database
        const response = await fetch('/api/submit-verification-docs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            documents,
            farmerId: userData.farmerId || null,
            isOptional: true,
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setOptionalDocStatuses((prev) => ({ ...prev, [docType]: 'pending' }));
          showSnackbar('Document submitted for verification! ✅', 'success');

          // Clear the file state
          switch (docType) {
            case 'organicLicense':
              setOrganicLicenseFile(null);
              break;
            case 'farmerCertificate':
              setFarmerCertificateFile(null);
              break;
            case 'cropInsurance':
              setCropInsuranceFile(null);
              break;
            case 'fpoMembership':
              setFpoMembershipFile(null);
              break;
            case 'soilHealthCard':
              setSoilHealthCardFile(null);
              break;
            case 'otherFarmingDoc':
              setOtherFarmingDocFile(null);
              break;
          }
        } else {
          throw new Error(result.message || 'Failed to submit document');
        }
      }
    } catch (error) {
      console.error('Error submitting optional document:', error);
      showSnackbar(
        error instanceof Error ? error.message : 'Error submitting document',
        'error'
      );
    } finally {
      setUploadingOptionalDoc(null);
    }
  };

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // This is now a placeholder that calls the mandatory handler
    await handleMandatoryDocumentSubmit(e);
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

        {/* Step 2: Mandatory Document Verification */}
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
            <h2 className='step-title'>Mandatory Document Verification</h2>
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
                  ' For farmers, you can either provide Kisan ID or upload mandatory documents.'}
              </p>

              {/* Verification Method Selection - Only for Farmers */}
              {userData.userType === 'farmer' && (
                <div
                  style={{
                    background: '#e8f5e9',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '2px solid #4caf50',
                    marginBottom: '2rem',
                  }}
                >
                  <label
                    style={{
                      fontSize: '1.1rem',
                      color: '#2e7d32',
                      fontWeight: 'bold',
                      display: 'block',
                      marginBottom: '1rem',
                    }}
                  >
                    🔐 Choose Your Verification Method:
                  </label>

                  <div
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <label
                      style={{
                        flex: 1,
                        padding: '1rem',
                        border: `3px solid ${
                          verificationMethod === 'kisan' ? '#2e7d32' : '#c8e6c9'
                        }`,
                        borderRadius: '8px',
                        background:
                          verificationMethod === 'kisan' ? '#c8e6c9' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <input
                        type='radio'
                        name='verificationMethod'
                        value='kisan'
                        checked={verificationMethod === 'kisan'}
                        onChange={() => setVerificationMethod('kisan')}
                        style={{
                          width: '20px',
                          height: '20px',
                          accentColor: '#2e7d32',
                        }}
                      />
                      <div>
                        <div
                          style={{
                            fontWeight: 'bold',
                            color: '#2e7d32',
                            marginBottom: '0.25rem',
                          }}
                        >
                          🆔 Kisan ID Verification
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#6d4c41' }}>
                          Quick verification using your Kisan ID
                        </div>
                      </div>
                    </label>

                    <label
                      style={{
                        flex: 1,
                        padding: '1rem',
                        border: `3px solid ${
                          verificationMethod === 'documents'
                            ? '#2e7d32'
                            : '#c8e6c9'
                        }`,
                        borderRadius: '8px',
                        background:
                          verificationMethod === 'documents'
                            ? '#c8e6c9'
                            : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <input
                        type='radio'
                        name='verificationMethod'
                        value='documents'
                        checked={verificationMethod === 'documents'}
                        onChange={() => setVerificationMethod('documents')}
                        style={{
                          width: '20px',
                          height: '20px',
                          accentColor: '#2e7d32',
                        }}
                      />
                      <div>
                        <div
                          style={{
                            fontWeight: 'bold',
                            color: '#2e7d32',
                            marginBottom: '0.25rem',
                          }}
                        >
                          📄 Document Upload
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#6d4c41' }}>
                          Upload Aadhaar and land documents
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Kisan ID Section for Kisan Verification Method */}
              {userData.userType === 'farmer' &&
                verificationMethod === 'kisan' && (
                  <div
                    style={{
                      background: '#fff3e0',
                      padding: '1.5rem',
                      borderRadius: '8px',
                      border: '2px solid #ff9800',
                      marginBottom: '2rem',
                    }}
                  >
                    <label
                      style={{
                        fontSize: '1.1rem',
                        color: '#e65100',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '1rem',
                      }}
                    >
                      🆔 Kisan ID (PM-KISAN)
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
                        REQUIRED FOR VERIFICATION
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
                      Enter your official Kisan ID (PM-KISAN beneficiary ID).
                      You will receive an OTP for verification.
                    </p>

                    <input
                      type='text'
                      placeholder='Enter your Kisan ID (e.g., TN01234567890)'
                      value={kisanId}
                      onChange={(e) => setKisanId(e.target.value.trim())}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #ffb74d',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontFamily: 'monospace',
                        letterSpacing: '1px',
                        marginBottom: '1rem',
                      }}
                      required
                    />

                    {/* Consent Checkbox */}
                    <div
                      style={{
                        background: 'white',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '2px solid #ffe0b2',
                      }}
                    >
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type='checkbox'
                          checked={kisanConsent}
                          onChange={(e) => setKisanConsent(e.target.checked)}
                          style={{
                            width: '20px',
                            height: '20px',
                            marginTop: '2px',
                            accentColor: '#ff9800',
                          }}
                          required
                        />
                        <div style={{ flex: 1 }}>
                          <span
                            style={{ color: '#e65100', fontWeight: 'bold' }}
                          >
                            I hereby authorize "Farmer's Direct"
                          </span>
                          <span
                            style={{ color: '#6d4c41', fontSize: '0.95rem' }}
                          >
                            {' '}
                            to verify my Kisan ID through the official
                            government portal (PM-KISAN database). I understand
                            that I will need to provide an OTP for verification
                            purposes, and I consent to the verification of my
                            farmer status and beneficiary details.
                          </span>
                        </div>
                      </label>
                    </div>

                    <div
                      style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        background: '#fff3e0',
                        borderRadius: '6px',
                        border: '1px solid #ffb74d',
                      }}
                    >
                      <p
                        style={{
                          color: '#e65100',
                          fontSize: '0.85rem',
                          margin: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>📱</span>
                        <span>
                          <strong>Note:</strong> You will receive an OTP on your
                          registered mobile number for Kisan ID verification.
                          Please keep your phone handy.
                        </span>
                      </p>
                    </div>
                  </div>
                )}

              {/* Show document upload section only if not using Kisan ID or if not a farmer */}
              {(userData.userType !== 'farmer' ||
                verificationMethod === 'documents') && (
                <>
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
                        Upload your official Land Registration Document showing
                        land ownership. This is required to verify your farming
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
                        Upload your Land Records document. The document name
                        varies by state (see below). Accepted formats: JPG, PNG,
                        PDF
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
                            <strong>Punjab, Haryana, Himachal:</strong>{' '}
                            Jamabandi
                          </li>
                          <li>
                            <strong>Tamil Nadu:</strong> Patta / Chitta /
                            Adangal
                          </li>
                          <li>
                            <strong>Maharashtra:</strong> 7/12 Extract
                          </li>
                          <li>
                            <strong>Karnataka:</strong> RTC (Record of Tenancy &
                            Crops)
                          </li>
                          <li>
                            <strong>Telangana, Andhra Pradesh:</strong> ROR /
                            Pahani
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
                </>
              )}

              {/* Submit Button for Section 2 - Mandatory Documents */}
              <button
                type='submit'
                className='btn btn-primary'
                disabled={
                  uploadingDocs ||
                  (userData.userType === 'farmer' &&
                  verificationMethod === 'kisan'
                    ? !kisanId || !kisanConsent
                    : !aadhaarFile ||
                      (userData.userType === 'farmer' &&
                        verificationMethod === 'documents' &&
                        (!landRegistrationFile || !landRecordsFile)))
                }
                style={{
                  opacity:
                    uploadingDocs ||
                    (userData.userType === 'farmer' &&
                    verificationMethod === 'kisan'
                      ? !kisanId || !kisanConsent
                      : !aadhaarFile ||
                        (userData.userType === 'farmer' &&
                          verificationMethod === 'documents' &&
                          (!landRegistrationFile || !landRecordsFile)))
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
                ) : userData.userType === 'farmer' &&
                  verificationMethod === 'kisan' ? (
                  <>🆔 Submit Kisan ID for Verification</>
                ) : (
                  <>📄 Submit Mandatory Documents</>
                )}
              </button>
              {userData.userType === 'farmer' && verificationMethod === 'kisan'
                ? (!kisanId || !kisanConsent) && (
                    <p
                      style={{
                        color: '#d32f2f',
                        fontSize: '0.9rem',
                        marginTop: '1rem',
                        fontStyle: 'italic',
                      }}
                    >
                      ⚠️ Please enter your Kisan ID and provide consent to
                      continue
                    </p>
                  )
                : (!aadhaarFile ||
                    (userData.userType === 'farmer' &&
                      verificationMethod === 'documents' &&
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

        {/* Step 3: Optional Documents (Recommended to highlight your profile) */}
        {emailVerified && !documentVerified && (
          <div className='step-card'>
            <div className='step-header'>
              <div className='step-number'>3</div>
              <h2 className='step-title'>
                Optional Documents (Recommended to highlight your profile)
              </h2>
            </div>

            <div>
              <p
                style={{
                  color: '#6d4c41',
                  marginBottom: '1.5rem',
                  fontSize: '1.05rem',
                }}
              >
                💡{' '}
                <strong>
                  These documents are optional but highly recommended.
                </strong>{' '}
                They help enhance your profile credibility, improve trust with
                buyers, and can lead to better pricing and more business
                opportunities.
              </p>

              {/* Only show optional documents for farmers */}
              {userData.userType === 'farmer' && (
                <>
                  {/* Organic License Upload - Optional (Only for Farmers) */}
                  {(optionalDocStatuses.organicLicense === 'none' ||
                    optionalDocStatuses.organicLicense === 'rejected') && (
                    <div
                      className='form-group'
                      style={{
                        background: '#e8f5e9',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        border: '2px solid #c8e6c9',
                        marginBottom: '2rem',
                        marginTop: '0',
                      }}
                    >
                      {/* Rejection Warning */}
                      {optionalDocStatuses.organicLicense === 'rejected' && (
                        <div
                          style={{
                            background: '#ffebee',
                            border: '2px solid #f44336',
                            borderRadius: '8px',
                            padding: '1rem',
                            marginBottom: '1rem',
                          }}
                        >
                          <p
                            style={{
                              color: '#c62828',
                              fontWeight: 'bold',
                              margin: 0,
                              fontSize: '0.95rem',
                            }}
                          >
                            ❌ Previous document was rejected. Please upload a
                            new document.
                          </p>
                        </div>
                      )}
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
                        certification. This will help you get better visibility
                        and pricing. Accepted formats: JPG, PNG, PDF
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
                      <button
                        type='button'
                        onClick={() =>
                          handleOptionalDocSubmit(
                            'organicLicense',
                            organicLicenseFile
                          )
                        }
                        disabled={
                          uploadingOptionalDoc === 'organicLicense' ||
                          !organicLicenseFile
                        }
                        style={{
                          marginTop: '1rem',
                          background:
                            uploadingOptionalDoc === 'organicLicense' ||
                            !organicLicenseFile
                              ? '#cccccc'
                              : '#388e3c',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.75rem 1.5rem',
                          cursor:
                            uploadingOptionalDoc === 'organicLicense' ||
                            !organicLicenseFile
                              ? 'not-allowed'
                              : 'pointer',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                        }}
                      >
                        {uploadingOptionalDoc === 'organicLicense'
                          ? 'Submitting...'
                          : 'Submit Organic Certificate'}
                      </button>
                    </div>
                  )}

                  {/* Organic Certificate Status Message */}
                  {optionalDocStatuses.organicLicense === 'pending' && (
                    <div
                      style={{
                        background: '#fff3e0',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        border: '2px solid #ff9800',
                        marginBottom: '2rem',
                      }}
                    >
                      <p
                        style={{
                          color: '#e65100',
                          fontWeight: 'bold',
                          margin: 0,
                        }}
                      >
                        ⏳ Organic Certificate submitted - Pending verification
                      </p>
                    </div>
                  )}
                  {optionalDocStatuses.organicLicense === 'verified' && (
                    <div
                      style={{
                        background: '#e8f5e9',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        border: '2px solid #4caf50',
                        marginBottom: '2rem',
                      }}
                    >
                      <p
                        style={{
                          color: '#2e7d32',
                          fontWeight: 'bold',
                          margin: 0,
                        }}
                      >
                        ✅ Organic Certificate Verified
                      </p>
                    </div>
                  )}

                  {/* Farmer Certificate Upload - Optional (Only for Farmers) */}
                  {(optionalDocStatuses.farmerCertificate === 'none' ||
                    optionalDocStatuses.farmerCertificate === 'rejected') && (
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
                      {/* Rejection Warning */}
                      {optionalDocStatuses.farmerCertificate === 'rejected' && (
                        <div
                          style={{
                            background: '#ffebee',
                            border: '2px solid #f44336',
                            borderRadius: '8px',
                            padding: '1rem',
                            marginBottom: '1rem',
                          }}
                        >
                          <p
                            style={{
                              color: '#c62828',
                              fontWeight: 'bold',
                              margin: 0,
                              fontSize: '0.95rem',
                            }}
                          >
                            ❌ Previous document was rejected. Please upload a
                            new document.
                          </p>
                        </div>
                      )}
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
                      <button
                        type='button'
                        onClick={() =>
                          handleOptionalDocSubmit(
                            'farmerCertificate',
                            farmerCertificateFile
                          )
                        }
                        disabled={
                          uploadingOptionalDoc === 'farmerCertificate' ||
                          !farmerCertificateFile
                        }
                        style={{
                          marginTop: '1rem',
                          background:
                            uploadingOptionalDoc === 'farmerCertificate' ||
                            !farmerCertificateFile
                              ? '#cccccc'
                              : '#0288d1',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.75rem 1.5rem',
                          cursor:
                            uploadingOptionalDoc === 'farmerCertificate' ||
                            !farmerCertificateFile
                              ? 'not-allowed'
                              : 'pointer',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                        }}
                      >
                        {uploadingOptionalDoc === 'farmerCertificate'
                          ? 'Submitting...'
                          : 'Submit Farmer Certificate'}
                      </button>
                    </div>
                  )}

                  {/* Farmer Certificate Status Message */}
                  {optionalDocStatuses.farmerCertificate === 'pending' && (
                    <div
                      style={{
                        background: '#fff3e0',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        border: '2px solid #ff9800',
                        marginBottom: '2rem',
                      }}
                    >
                      <p
                        style={{
                          color: '#e65100',
                          fontWeight: 'bold',
                          margin: 0,
                        }}
                      >
                        ⏳ Farmer Certificate submitted - Pending verification
                      </p>
                    </div>
                  )}
                  {optionalDocStatuses.farmerCertificate === 'verified' && (
                    <div
                      style={{
                        background: '#e3f2fd',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        border: '2px solid #2196f3',
                        marginBottom: '2rem',
                      }}
                    >
                      <p
                        style={{
                          color: '#0277bd',
                          fontWeight: 'bold',
                          margin: 0,
                        }}
                      >
                        ✅ Farmer Certificate Verified
                      </p>
                    </div>
                  )}

                  {/* Crop Insurance Upload - Optional (Only for Farmers) */}
                  {(optionalDocStatuses.cropInsurance === 'none' ||
                    optionalDocStatuses.cropInsurance === 'rejected') && (
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
                      {/* Rejection Warning */}
                      {optionalDocStatuses.cropInsurance === 'rejected' && (
                        <div
                          style={{
                            background: '#ffebee',
                            border: '2px solid #f44336',
                            borderRadius: '8px',
                            padding: '1rem',
                            marginBottom: '1rem',
                          }}
                        >
                          <p
                            style={{
                              color: '#c62828',
                              fontWeight: 'bold',
                              margin: 0,
                              fontSize: '0.95rem',
                            }}
                          >
                            ❌ Previous document was rejected. Please upload a
                            new document.
                          </p>
                        </div>
                      )}
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
                        demonstrates your commitment to risk management.
                        Accepted formats: JPG, PNG, PDF
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
                      <button
                        type='button'
                        onClick={() =>
                          handleOptionalDocSubmit(
                            'cropInsurance',
                            cropInsuranceFile
                          )
                        }
                        disabled={
                          uploadingOptionalDoc === 'cropInsurance' ||
                          !cropInsuranceFile
                        }
                        style={{
                          marginTop: '1rem',
                          background:
                            uploadingOptionalDoc === 'cropInsurance' ||
                            !cropInsuranceFile
                              ? '#cccccc'
                              : '#d81b60',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.75rem 1.5rem',
                          cursor:
                            uploadingOptionalDoc === 'cropInsurance' ||
                            !cropInsuranceFile
                              ? 'not-allowed'
                              : 'pointer',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                        }}
                      >
                        {uploadingOptionalDoc === 'cropInsurance'
                          ? 'Submitting...'
                          : 'Submit Crop Insurance'}
                      </button>
                    </div>
                  )}

                  {/* Crop Insurance Status Message */}
                  {optionalDocStatuses.cropInsurance === 'pending' && (
                    <div
                      style={{
                        background: '#fff3e0',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        border: '2px solid #ff9800',
                        marginBottom: '2rem',
                      }}
                    >
                      <p
                        style={{
                          color: '#e65100',
                          fontWeight: 'bold',
                          margin: 0,
                        }}
                      >
                        ⏳ Crop Insurance submitted - Pending verification
                      </p>
                    </div>
                  )}
                  {optionalDocStatuses.cropInsurance === 'verified' && (
                    <div
                      style={{
                        background: '#fce4ec',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        border: '2px solid #f06292',
                        marginBottom: '2rem',
                      }}
                    >
                      <p
                        style={{
                          color: '#c2185b',
                          fontWeight: 'bold',
                          margin: 0,
                        }}
                      >
                        ✅ Crop Insurance Verified
                      </p>
                    </div>
                  )}

                  {/* FPO Membership Upload - Optional (Only for Farmers) */}
                  {(optionalDocStatuses.fpoMembership === 'none' ||
                    optionalDocStatuses.fpoMembership === 'rejected') && (
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
                      {/* Rejection Warning */}
                      {optionalDocStatuses.fpoMembership === 'rejected' && (
                        <div
                          style={{
                            background: '#ffebee',
                            border: '2px solid #f44336',
                            borderRadius: '8px',
                            padding: '1rem',
                            marginBottom: '1rem',
                          }}
                        >
                          <p
                            style={{
                              color: '#c62828',
                              fontWeight: 'bold',
                              margin: 0,
                              fontSize: '0.95rem',
                            }}
                          >
                            ❌ Previous document was rejected. Please upload a
                            new document.
                          </p>
                        </div>
                      )}
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
                        Upload your Farmer Producer Organization (FPO)
                        membership certificate. This shows your association with
                        organized farming groups. Accepted formats: JPG, PNG,
                        PDF
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
                      <button
                        type='button'
                        onClick={() =>
                          handleOptionalDocSubmit(
                            'fpoMembership',
                            fpoMembershipFile
                          )
                        }
                        disabled={
                          uploadingOptionalDoc === 'fpoMembership' ||
                          !fpoMembershipFile
                        }
                        style={{
                          marginTop: '1rem',
                          background:
                            uploadingOptionalDoc === 'fpoMembership' ||
                            !fpoMembershipFile
                              ? '#cccccc'
                              : '#8e24aa',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.75rem 1.5rem',
                          cursor:
                            uploadingOptionalDoc === 'fpoMembership' ||
                            !fpoMembershipFile
                              ? 'not-allowed'
                              : 'pointer',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                        }}
                      >
                        {uploadingOptionalDoc === 'fpoMembership'
                          ? 'Submitting...'
                          : 'Submit FPO Certificate'}
                      </button>
                    </div>
                  )}

                  {/* FPO Membership Status Message */}
                  {optionalDocStatuses.fpoMembership === 'pending' && (
                    <div
                      style={{
                        background: '#fff3e0',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        border: '2px solid #ff9800',
                        marginBottom: '2rem',
                      }}
                    >
                      <p
                        style={{
                          color: '#e65100',
                          fontWeight: 'bold',
                          margin: 0,
                        }}
                      >
                        ⏳ FPO Membership Certificate submitted - Pending
                        verification
                      </p>
                    </div>
                  )}
                  {optionalDocStatuses.fpoMembership === 'verified' && (
                    <div
                      style={{
                        background: '#f3e5f5',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        border: '2px solid #ba68c8',
                        marginBottom: '2rem',
                      }}
                    >
                      <p
                        style={{
                          color: '#7b1fa2',
                          fontWeight: 'bold',
                          margin: 0,
                        }}
                      >
                        ✅ FPO Membership Certificate Verified
                      </p>
                    </div>
                  )}

                  {/* Soil Health Card Upload - Optional (Only for Farmers) */}
                  {(optionalDocStatuses.soilHealthCard === 'none' ||
                    optionalDocStatuses.soilHealthCard === 'rejected') && (
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
                      {/* Rejection Warning */}
                      {optionalDocStatuses.soilHealthCard === 'rejected' && (
                        <div
                          style={{
                            background: '#ffebee',
                            border: '2px solid #f44336',
                            borderRadius: '8px',
                            padding: '1rem',
                            marginBottom: '1rem',
                          }}
                        >
                          <p
                            style={{
                              color: '#c62828',
                              fontWeight: 'bold',
                              margin: 0,
                              fontSize: '0.95rem',
                            }}
                          >
                            ❌ Previous document was rejected. Please upload a
                            new document.
                          </p>
                        </div>
                      )}
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
                        Upload your Soil Health Card issued by the government.
                        This demonstrates your knowledge of soil nutrients and
                        farming practices. Accepted formats: JPG, PNG, PDF
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
                      <button
                        type='button'
                        onClick={() =>
                          handleOptionalDocSubmit(
                            'soilHealthCard',
                            soilHealthCardFile
                          )
                        }
                        disabled={
                          uploadingOptionalDoc === 'soilHealthCard' ||
                          !soilHealthCardFile
                        }
                        style={{
                          marginTop: '1rem',
                          background:
                            uploadingOptionalDoc === 'soilHealthCard' ||
                            !soilHealthCardFile
                              ? '#cccccc'
                              : '#6d4c41',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.75rem 1.5rem',
                          cursor:
                            uploadingOptionalDoc === 'soilHealthCard' ||
                            !soilHealthCardFile
                              ? 'not-allowed'
                              : 'pointer',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                        }}
                      >
                        {uploadingOptionalDoc === 'soilHealthCard'
                          ? 'Submitting...'
                          : 'Submit Soil Health Card'}
                      </button>
                    </div>
                  )}

                  {/* Soil Health Card Status Message */}
                  {optionalDocStatuses.soilHealthCard === 'pending' && (
                    <div
                      style={{
                        background: '#fff3e0',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        border: '2px solid #ff9800',
                        marginBottom: '2rem',
                      }}
                    >
                      <p
                        style={{
                          color: '#e65100',
                          fontWeight: 'bold',
                          margin: 0,
                        }}
                      >
                        ⏳ Soil Health Card submitted - Pending verification
                      </p>
                    </div>
                  )}
                  {optionalDocStatuses.soilHealthCard === 'verified' && (
                    <div
                      style={{
                        background: '#efebe9',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        border: '2px solid #a1887f',
                        marginBottom: '2rem',
                      }}
                    >
                      <p
                        style={{
                          color: '#5d4037',
                          fontWeight: 'bold',
                          margin: 0,
                        }}
                      >
                        ✅ Soil Health Card Verified
                      </p>
                    </div>
                  )}

                  {/* Other Farming Document Upload - Optional (Only for Farmers) */}
                  {(optionalDocStatuses.otherFarmingDoc === 'none' ||
                    optionalDocStatuses.otherFarmingDoc === 'rejected') && (
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
                      {/* Rejection Warning */}
                      {optionalDocStatuses.otherFarmingDoc === 'rejected' && (
                        <div
                          style={{
                            background: '#ffebee',
                            border: '2px solid #f44336',
                            borderRadius: '8px',
                            padding: '1rem',
                            marginBottom: '1rem',
                          }}
                        >
                          <p
                            style={{
                              color: '#c62828',
                              fontWeight: 'bold',
                              margin: 0,
                              fontSize: '0.95rem',
                            }}
                          >
                            ❌ Previous document was rejected. Please upload a
                            new document.
                          </p>
                        </div>
                      )}
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
                        Upload any other relevant farming document that
                        validates your farming activities (e.g., Awards,
                        Training Certificates, etc.). Accepted formats: JPG,
                        PNG, PDF
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
                      <button
                        type='button'
                        onClick={() =>
                          handleOptionalDocSubmit(
                            'otherFarmingDoc',
                            otherFarmingDocFile
                          )
                        }
                        disabled={
                          uploadingOptionalDoc === 'otherFarmingDoc' ||
                          !otherFarmingDocFile
                        }
                        style={{
                          marginTop: '1rem',
                          background:
                            uploadingOptionalDoc === 'otherFarmingDoc' ||
                            !otherFarmingDocFile
                              ? '#cccccc'
                              : '#00897b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.75rem 1.5rem',
                          cursor:
                            uploadingOptionalDoc === 'otherFarmingDoc' ||
                            !otherFarmingDocFile
                              ? 'not-allowed'
                              : 'pointer',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                        }}
                      >
                        {uploadingOptionalDoc === 'otherFarmingDoc'
                          ? 'Submitting...'
                          : 'Submit Other Document'}
                      </button>
                    </div>
                  )}

                  {/* Other Farming Document Status Message */}
                  {optionalDocStatuses.otherFarmingDoc === 'pending' && (
                    <div
                      style={{
                        background: '#fff3e0',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        border: '2px solid #ff9800',
                        marginBottom: '2rem',
                      }}
                    >
                      <p
                        style={{
                          color: '#e65100',
                          fontWeight: 'bold',
                          margin: 0,
                        }}
                      >
                        ⏳ Other Farming Document submitted - Pending
                        verification
                      </p>
                    </div>
                  )}
                  {optionalDocStatuses.otherFarmingDoc === 'verified' && (
                    <div
                      style={{
                        background: '#e0f2f1',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        border: '2px solid #4db6ac',
                        marginBottom: '2rem',
                      }}
                    >
                      <p
                        style={{
                          color: '#00695c',
                          fontWeight: 'bold',
                          margin: 0,
                        }}
                      >
                        ✅ Other Farming Document Verified
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
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
