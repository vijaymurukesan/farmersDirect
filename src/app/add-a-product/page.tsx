'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Snackbar from '../components/Snackbar';

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [userType, setUserType] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    description: '',
    adminNotes: '',
    basePrice: 0,
    images: [] as string[],
    videos: [] as string[],
  });

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

  // Check if user is logged in and get user type
  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      showSnackbar('Please login to add products', 'error');
      setTimeout(() => router.push('/login'), 2000);
      return;
    }

    // Get user type from localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserType(user.userType || '');
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === 'basePrice' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showSnackbar('Please select an image file', 'error');
      return;
    }

    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showSnackbar('Image size must be less than 5MB', 'error');
      return;
    }

    setUploadingImage(true);
    try {
      const token = localStorage.getItem('authToken');
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('productTitle', formData.title || 'product');

      const response = await fetch('/api/upload-product-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, result.data.url],
        }));
        showSnackbar('Image uploaded successfully!', 'success');
        e.target.value = ''; // Reset file input
      } else {
        throw new Error(result.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showSnackbar(
        `Error uploading image: ${
          error instanceof Error ? error.message : 'Please try again'
        }`,
        'error'
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      showSnackbar('Please enter product title', 'error');
      return;
    }

    if (!formData.type.trim()) {
      showSnackbar('Please enter product type', 'error');
      return;
    }

    if (!formData.description.trim()) {
      showSnackbar('Please enter product description', 'error');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          type: formData.type.trim(),
          description: formData.description.trim(),
          price:
            userType === 'admin' || userType === 'owner'
              ? formData.basePrice
              : 0,
          adminNotes: formData.adminNotes.trim(),
          images: formData.images,
          videos: formData.videos,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showSnackbar(
          `✅ Product "${formData.title}" submitted successfully! Your product is now pending verification by our admin team. You will be notified once it's approved.`,
          'success'
        );
        setTimeout(() => {
          router.push('/');
        }, 4000);
      } else {
        throw new Error(result.message || 'Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      showSnackbar(
        `Error: ${
          error instanceof Error ? error.message : 'Failed to add product'
        }`,
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
          minHeight: '100vh',
          padding: '2rem',
          fontFamily: 'Arial, Georgia, serif',
        }}
      >
        <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .form-section {
          background: #fffde7;
          border-radius: 12px;
          box-shadow: 0 2px 8px #c8e6c9;
          padding: 2rem;
          margin-bottom: 2rem;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }
        .form-label {
          color: #388e3c;
          font-weight: bold;
          font-size: 0.9rem;
        }
        .form-input {
          padding: 0.75rem;
          border: 2px solid #c8e6c9;
          border-radius: 8px;
          font-size: 1rem;
          color: #000000;
          transition: border-color 0.3s ease;
        }
        .form-input:focus {
          outline: none;
          border-color: #388e3c;
        }
        .form-textarea {
          padding: 0.75rem;
          border: 2px solid #c8e6c9;
          border-radius: 8px;
          font-size: 1rem;
          color: #000000;
          resize: vertical;
          min-height: 100px;
          transition: border-color 0.3s ease;
        }
        .form-textarea:focus {
          outline: none;
          border-color: #388e3c;
        }
        .form-select {
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
        .array-input-group {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .array-input {
          flex: 1;
        }
        .array-button {
          padding: 0.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        .add-button {
          background: #388e3c;
          color: white;
        }
        .remove-button {
          background: #d32f2f;
          color: white;
        }
      `}</style>

        {/* Header */}
        <div className='form-section'>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h1 style={{ color: '#388e3c', fontSize: '2.5rem', margin: 0 }}>
              Add New Product
            </h1>
            <button
              onClick={() => router.back()}
              style={{
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
              ← Back
            </button>
          </div>
          <p style={{ color: '#6d4c41', fontSize: '1.1rem', margin: 0 }}>
            Add a new product to our catalog to help farmers connect with
            buyers.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className='form-section'>
            <h2
              style={{
                color: '#388e3c',
                fontSize: '1.8rem',
                marginBottom: '1.5rem',
                borderBottom: '2px solid #c8e6c9',
                paddingBottom: '0.5rem',
              }}
            >
              📝 Product Information
            </h2>

            <div className='form-field'>
              <label className='form-label'>Product Title *</label>
              <input
                type='text'
                className='form-input'
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                placeholder='e.g., Fresh Tomatoes, Organic Rice'
              />
            </div>

            <div className='form-field'>
              <label className='form-label'>Product Type *</label>
              <select
                className='form-select'
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                required
              >
                <option value=''>Select product type</option>
                <option value='vegetable'>Vegetable</option>
                <option value='fruit'>Fruit</option>
                <option value='grain'>Grain</option>
                <option value='pulses'>Pulses</option>
                <option value='spices'>Spices</option>
                <option value='dairy'>Dairy</option>
                <option value='nuts'>Nuts</option>
                <option value='dry fruits'>Dry Fruits</option>
                <option value='herbs'>Herbs</option>
                <option value='other'>Other</option>
              </select>
            </div>

            <div className='form-field'>
              <label className='form-label'>Description *</label>
              <textarea
                className='form-textarea'
                value={formData.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                required
                placeholder='Enter a detailed description of the product...'
              />
            </div>

            {/* Base Price field - Only for Admin/Owner */}
            {(userType === 'admin' || userType === 'owner') && (
              <div className='form-field'>
                <label className='form-label'>Base Price (₹/kg) *</label>
                <input
                  type='number'
                  step='0.01'
                  min='0'
                  className='form-input'
                  value={formData.basePrice || ''}
                  onChange={(e) =>
                    handleInputChange('basePrice', e.target.value)
                  }
                  placeholder='Enter base price per kg'
                />
                <p
                  style={{
                    color: '#6d4c41',
                    fontSize: '0.85rem',
                    margin: '0.25rem 0 0 0',
                  }}
                >
                  💡 This field is only visible to admin and owner users
                </p>
              </div>
            )}

            <div className='form-field'>
              <label className='form-label'>Additional Notes to Admin</label>
              <textarea
                className='form-textarea'
                value={formData.adminNotes}
                onChange={(e) =>
                  handleInputChange('adminNotes', e.target.value)
                }
                placeholder='Add any special notes or instructions for the admin...'
              />
            </div>
          </div>

          {/* Media Information */}
          <div className='form-section'>
            <h2
              style={{
                color: '#388e3c',
                fontSize: '1.8rem',
                marginBottom: '1.5rem',
                borderBottom: '2px solid #c8e6c9',
                paddingBottom: '0.5rem',
              }}
            >
              📷 Product Media
            </h2>

            {/* Product Images */}
            <div className='form-field'>
              <label className='form-label'>Product Images</label>
              <p
                style={{
                  color: '#6d4c41',
                  fontSize: '0.9rem',
                  marginBottom: '1rem',
                }}
              >
                Upload product images (JPG, PNG, WEBP - Max 5MB each)
              </p>

              <input
                type='file'
                id='image-upload'
                accept='image/*'
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                disabled={uploadingImage}
              />

              <label
                htmlFor='image-upload'
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 1.5rem',
                  background: uploadingImage ? '#cccccc' : '#388e3c',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: uploadingImage ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem',
                }}
              >
                {uploadingImage ? '⏳ Uploading...' : '📤 Upload Image'}
              </label>

              {/* Display uploaded images */}
              {formData.images.length > 0 && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '1rem',
                    marginTop: '1rem',
                  }}
                >
                  {formData.images.map((imageUrl, index) => (
                    <div
                      key={index}
                      style={{
                        position: 'relative',
                        border: '2px solid #c8e6c9',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#f9f9f9',
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt={`Product ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '150px',
                          objectFit: 'cover',
                        }}
                      />
                      <button
                        type='button'
                        onClick={() => removeImage(index)}
                        style={{
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          background: '#d32f2f',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '30px',
                          height: '30px',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title='Remove image'
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {formData.images.length === 0 && (
                <p
                  style={{
                    color: '#999',
                    fontSize: '0.9rem',
                    fontStyle: 'italic',
                  }}
                >
                  No images uploaded yet
                </p>
              )}
            </div>

            {/* Product Videos - Keep as URL for now */}
            <div
              className='form-field'
              style={{ marginTop: '2rem' }}
            >
              <label className='form-label'>Product Video URL (Optional)</label>
              <p
                style={{
                  color: '#6d4c41',
                  fontSize: '0.9rem',
                  marginBottom: '0.5rem',
                }}
              >
                Add a video URL (YouTube, Vimeo, or direct video link)
              </p>
              <input
                type='url'
                className='form-input'
                value={formData.videos[0] || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    videos: e.target.value ? [e.target.value] : [],
                  }))
                }
                placeholder='https://example.com/video.mp4'
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className='form-section'>
            <div
              style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}
            >
              <button
                type='button'
                onClick={() => router.back()}
                style={{
                  background: '#757575',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '1rem 2rem',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                }}
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={loading}
                style={{
                  background: loading
                    ? '#cccccc'
                    : 'linear-gradient(45deg, #388e3c, #2e7d32)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '1rem 2rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  minWidth: '200px',
                  justifyContent: 'center',
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
                    Adding...
                  </>
                ) : (
                  <>➕ Add Product</>
                )}
              </button>
            </div>
          </div>
        </form>

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
