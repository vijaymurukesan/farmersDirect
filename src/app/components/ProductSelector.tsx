"use client";
import React, { useState, useMemo } from 'react';

interface Product {
  _id?: string; // MongoDB ObjectId (internal use only)
  id?: string;  // Fallback for mock data (internal use only)
  productId: string; // Primary product identifier from API
  title: string;
  type: string;
  category: string;
}

interface ProductDetails {
  cultivationArea: string;
  expectedYield: string;
  expectedHarvestDate: string;
  preBookPrice: number;
  photoUrls: string[];
  videoUrls: string[];
}

interface ProductSelectorProps {
  products: Product[];
  selectedProducts: string[];
  productsLoading: boolean;
  onProductToggle: (productId: string, details?: ProductDetails) => void;
  productDetails: { [productId: string]: ProductDetails };
}

export default function ProductSelector({ 
  products, 
  selectedProducts, 
  productsLoading, 
  onProductToggle,
  productDetails 
}: ProductSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState('');
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  
  // Cache to remember product details even when deselected
  const [productDetailsCache, setProductDetailsCache] = useState<Record<string, ProductDetails>>({});
  
  const [currentProductDetails, setCurrentProductDetails] = useState<ProductDetails>({
    cultivationArea: '',
    expectedYield: '',
    expectedHarvestDate: '',
    preBookPrice: 0,
    photoUrls: [],
    videoUrls: []
  });

  // Functions for managing photo and video URLs
  const addPhotoUrl = () => {
    if (currentPhotoUrl.trim()) {
      setCurrentProductDetails(prev => ({
        ...prev,
        photoUrls: [...prev.photoUrls, currentPhotoUrl.trim()]
      }));
      setCurrentPhotoUrl('');
    }
  };

  const addVideoUrl = () => {
    if (currentVideoUrl.trim()) {
      setCurrentProductDetails(prev => ({
        ...prev,
        videoUrls: [...prev.videoUrls, currentVideoUrl.trim()]
      }));
      setCurrentVideoUrl('');
    }
  };

  const removePhotoUrl = (index: number) => {
    setCurrentProductDetails(prev => ({
      ...prev,
      photoUrls: prev.photoUrls.filter((_, i) => i !== index)
    }));
  };

  const removeVideoUrl = (index: number) => {
    setCurrentProductDetails(prev => ({
      ...prev,
      videoUrls: prev.videoUrls.filter((_, i) => i !== index)
    }));
  };

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return products.filter(product => 
      product.title.toLowerCase().includes(query) ||
      product.type.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const handleProductClick = (product: Product, productId: string) => {
    const isSelected = selectedProducts.includes(productId);
    
    if (isSelected) {
      // If already selected, deselect it
      onProductToggle(productId);
    } else {
      // If not selected, open modal for details
      setSelectedProductForModal(product);
      setIsEditMode(false);
      setEditingProductId(null);
      
      // Check if we have cached details for this product
      const cachedDetails = productDetailsCache[productId];
      if (cachedDetails) {
        // Load from cache
        setCurrentProductDetails(cachedDetails);
      } else {
        // Start with empty form
        setCurrentProductDetails({
          cultivationArea: '',
          expectedYield: '',
          expectedHarvestDate: '',
          preBookPrice: 0,
          photoUrls: [],
          videoUrls: []
        });
      }
      
      setModalOpen(true);
    }
  };

  const handleEditProduct = (product: Product, productId: string) => {
    setSelectedProductForModal(product);
    setIsEditMode(true);
    setEditingProductId(productId);
    // Load existing details
    const existingDetails = productDetails[productId] || {
      cultivationArea: '',
      expectedYield: '',
      expectedHarvestDate: '',
      preBookPrice: 0,
      photoUrls: [],
      videoUrls: []
    };
    setCurrentProductDetails(existingDetails);
    setModalOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Are you sure you want to remove this product?')) {
      // Remove from cache when deleting
      setProductDetailsCache(prev => {
        const newCache = { ...prev };
        delete newCache[productId];
        return newCache;
      });
      onProductToggle(productId);
    }
  };

  const handleModalSubmit = () => {
    if (selectedProductForModal) {
      const productId = isEditMode ? editingProductId! : selectedProductForModal.productId;
      
      // Save to cache for future reference
      setProductDetailsCache(prev => ({
        ...prev,
        [productId]: { ...currentProductDetails }
      }));
      
      // Always pass details when submitting from modal
      // The parent component will handle whether it's an edit or add based on current selection state
      onProductToggle(productId, currentProductDetails);
      
      setModalOpen(false);
      setSelectedProductForModal(null);
      setIsEditMode(false);
      setEditingProductId(null);
    }
  };

  const handleModalClose = () => {
    // Save current details to cache if there's any data entered (don't save empty forms)
    if (selectedProductForModal && (
      currentProductDetails.cultivationArea.trim() ||
      currentProductDetails.expectedYield.trim() ||
      currentProductDetails.expectedHarvestDate ||
      currentProductDetails.preBookPrice > 0 ||
      currentProductDetails.photoUrls.length > 0 ||
      currentProductDetails.videoUrls.length > 0
    )) {
      const productId = isEditMode ? editingProductId! : selectedProductForModal.productId;
      setProductDetailsCache(prev => ({
        ...prev,
        [productId]: { ...currentProductDetails }
      }));
    }
    
    setModalOpen(false);
    setSelectedProductForModal(null);
    setIsEditMode(false);
    setEditingProductId(null);
    setCurrentPhotoUrl('');
    setCurrentVideoUrl('');
    setCurrentProductDetails({
      cultivationArea: '',
      expectedYield: '',
      expectedHarvestDate: '',
      preBookPrice: 0,
      photoUrls: [],
      videoUrls: []
    });
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }
        .product-card {
          background: #f1f8e9;
          border: 2px solid #c8e6c9;
          border-radius: 8px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .product-card.selected {
          border-color: #388e3c;
          background: #e8f5e9;
        }
        .product-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(56, 142, 60, 0.2);
        }
        .form-label {
          color: #388e3c;
          font-weight: bold;
          font-size: 0.9rem;
        }
        .search-container {
          position: relative;
          margin-bottom: 1.5rem;
        }
        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border: 2px solid #c8e6c9;
          border-radius: 8px;
          font-size: 1rem;
          color: #000000;
          transition: border-color 0.3s ease;
          background: white;
        }
        .search-input:focus {
          outline: none;
          border-color: #388e3c;
          box-shadow: 0 0 0 3px rgba(56, 142, 60, 0.1);
        }
        .search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #757575;
          font-size: 1.1rem;
        }
        .clear-search {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #757575;
          cursor: pointer;
          font-size: 1.2rem;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }
        .clear-search:hover {
          background: #f5f5f5;
          color: #d32f2f;
        }
        .search-results-info {
          font-size: 0.9rem;
          color: #6d4c41;
          margin-bottom: 1rem;
          padding: 0.5rem 0.75rem;
          background: #f1f8e9;
          border-radius: 4px;
        }
        .no-results {
          text-align: center;
          padding: 2rem;
          color: #757575;
          background: #f9f9f9;
          border-radius: 8px;
          border: 2px dashed #e0e0e0;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          animation: modalSlideIn 0.3s ease-out;
        }
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .modal-header {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e8f5e9;
        }
        .modal-title {
          color: #388e3c;
          font-size: 1.4rem;
          font-weight: bold;
          margin: 0 0 0.5rem 0;
        }
        .modal-subtitle {
          color: #6d4c41;
          font-size: 0.9rem;
          margin: 0;
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        .form-group label {
          display: block;
          color: #388e3c;
          font-weight: bold;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }
        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #c8e6c9;
          border-radius: 8px;
          font-size: 1rem;
          color: #000000;
          transition: border-color 0.3s ease;
        }
        .form-group input:focus {
          outline: none;
          border-color: #388e3c;
          box-shadow: 0 0 0 3px rgba(56, 142, 60, 0.1);
        }
        .modal-buttons {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #e0e0e0;
        }
        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }
        .btn-secondary {
          background: #f5f5f5;
          color: #757575;
        }
        .btn-secondary:hover {
          background: #e0e0e0;
        }
        .btn-primary {
          background: #388e3c;
          color: white;
        }
        .btn-primary:hover {
          background: #2e7d32;
          transform: translateY(-1px);
        }
        .btn-primary:disabled {
          background: #c8e6c9;
          cursor: not-allowed;
          transform: none;
        }
        .selected-products-table {
          margin-top: 2rem;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(56, 142, 60, 0.1);
          border: 2px solid #c8e6c9;
        }
        .table-header {
          background: #388e3c;
          color: white;
          padding: 1rem;
          font-weight: bold;
          font-size: 1.1rem;
        }
        .table-container {
          overflow-x: auto;
        }
        .products-table {
          width: 100%;
          border-collapse: collapse;
        }
        .products-table th {
          background: #e8f5e9;
          color: #388e3c;
          padding: 0.75rem;
          text-align: left;
          font-weight: bold;
          border-bottom: 2px solid #c8e6c9;
        }
        .products-table td {
          padding: 0.75rem;
          border-bottom: 1px solid #e0e0e0;
          vertical-align: middle;
          color: #000000;
        }
        .products-table tr:hover {
          background: #f1f8e9;
        }
        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }
        .action-btn {
          padding: 0.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: bold;
          transition: all 0.2s ease;
        }
        .edit-btn {
          background: #2196f3;
          color: white;
        }
        .edit-btn:hover {
          background: #1976d2;
          transform: translateY(-1px);
        }
        .delete-btn {
          background: #f44336;
          color: white;
        }
        .delete-btn:hover {
          background: #d32f2f;
          transform: translateY(-1px);
        }
        .url-input-section {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .url-input-section input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.9rem;
        }
        .url-input-section .btn {
          white-space: nowrap;
          min-width: auto;
          padding: 0.5rem 1rem;
        }
        .url-list {
          margin-top: 0.5rem;
          max-height: 150px;
          overflow-y: auto;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          background: #f9f9f9;
        }
        .url-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem;
          border-bottom: 1px solid #e0e0e0;
        }
        .url-item:last-child {
          border-bottom: none;
        }
        .url-text {
          flex: 1;
          word-break: break-all;
          font-size: 0.9rem;
          color: #666;
          margin-right: 0.5rem;
        }
        .btn-sm {
          padding: 0.25rem 0.5rem;
          font-size: 0.8rem;
          min-width: auto;
        }
        .btn-danger {
          background: #f44336;
          color: white;
          border: none;
        }
        .btn-danger:hover {
          background: #d32f2f;
        }
      `}</style>

      <label className="form-label" style={{ marginBottom: '1rem', display: 'block' }}>
        Select Products You Offer * (Choose multiple)
      </label>

      {/* Search Input */}
      {!productsLoading && products.length > 0 && (
        <div className="search-container">
          <div className="search-icon">🔍</div>
          <input
            type="text"
            className="search-input"
            placeholder="Search products by name, type, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="clear-search"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Search Results Info */}
      {!productsLoading && searchQuery && (
        <div className="search-results-info">
          {filteredProducts.length > 0 ? (
            <>
              Found <strong>{filteredProducts.length}</strong> product{filteredProducts.length !== 1 ? 's' : ''} 
              {searchQuery && ` matching &quot;${searchQuery}&quot;`}
            </>
          ) : (
            <>No products found matching &quot;<strong>{searchQuery}</strong>&quot;</>
          )}
        </div>
      )}
      
      {productsLoading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: '2rem',
          background: '#f1f8e9',
          borderRadius: '8px',
          border: '2px solid #c8e6c9'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #c8e6c9',
            borderTop: '4px solid #388e3c',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginRight: '1rem'
          }}></div>
          <span style={{ color: '#388e3c', fontWeight: 'bold' }}>Loading products...</span>
        </div>
      ) : filteredProducts.length === 0 && searchQuery ? (
        <div className="no-results">
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
          <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            No products found
          </div>
          <div style={{ fontSize: '0.9rem' }}>
            Try adjusting your search terms or{' '}
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none',
                border: 'none',
                color: '#388e3c',
                textDecoration: 'underline',
                cursor: 'pointer',
                font: 'inherit'
              }}
            >
              clear the search
            </button>{' '}
            to see all products.
          </div>
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((product) => {
            // Use productId from API response
            const productId = product.productId;
            const isSelected = selectedProducts.includes(productId);
            const hasCachedData = !!productDetailsCache[productId];
            
            return (
              <div
                key={product.productId}
                className={`product-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleProductClick(product, productId)}
                style={{
                  background: isSelected ? '#e8f5e9' : '#f1f8e9',
                  border: `2px solid ${isSelected ? '#388e3c' : '#c8e6c9'}`,
                  borderRadius: '8px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
              >
                {hasCachedData && !isSelected && (
                  <div 
                    title="Previously entered data available"
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: '#2196f3',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    💾
                  </div>
                )}
                <h4 style={{ 
                  color: '#388e3c', 
                  margin: '0 0 0.5rem 0',
                  fontSize: '1.1rem',
                  paddingRight: hasCachedData && !isSelected ? '30px' : '0'
                }}>
                  {searchQuery ? (
                    <span dangerouslySetInnerHTML={{
                      __html: product.title.replace(
                        new RegExp(`(${searchQuery})`, 'gi'),
                        '<mark style="background: #ffeb3b; padding: 0 2px; border-radius: 2px;">$1</mark>'
                      )
                    }} />
                  ) : (
                    product.title
                  )}
                </h4>
                <div style={{ fontSize: '0.9rem', color: '#6d4c41', marginBottom: '0.5rem' }}>
                  <div>Type: <strong>{product.type}</strong></div>
                  <div>Category: <strong>{product.category}</strong></div>
                  <div style={{ color: '#2196f3', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    ID: <code style={{ 
                      background: '#e3f2fd', 
                      padding: '2px 4px', 
                      borderRadius: '3px',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem'
                    }}>{productId}</code>
                  </div>
                </div>
                <div style={{ 
                  marginTop: '0.5rem', 
                  textAlign: 'center',
                  color: isSelected ? '#388e3c' : '#757575',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  fontSize: '0.9rem',
                  padding: '0.25rem 0',
                  borderRadius: '4px',
                  background: isSelected ? 'rgba(56, 142, 60, 0.1)' : 'rgba(117, 117, 117, 0.1)'
                }}>
                  {isSelected ? '✓ Selected' : 'Click to Select'}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {!productsLoading && selectedProducts.length === 0 && (
        <p style={{ 
          color: '#d32f2f', 
          fontSize: '0.9rem', 
          marginTop: '0.5rem',
          padding: '0.75rem',
          background: '#ffebee',
          border: '1px solid #ffcdd2',
          borderRadius: '4px'
        }}>
          ⚠️ Please select one product to continue
        </p>
      )}
      
      {selectedProducts.length > 0 && (
        <p style={{ 
          color: '#388e3c', 
          fontSize: '0.9rem', 
          marginTop: '0.5rem',
          padding: '0.75rem',
          background: '#e8f5e9',
          border: '1px solid #c8e6c9',
          borderRadius: '4px'
        }}>
          ✓ {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected successfully
        </p>
      )}

      {/* Selected Products Table */}
      {selectedProducts.length > 0 && (
        <div className="selected-products-table">
          <div className="table-header">
            📋 Selected Products Details
          </div>
          <div className="table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Cultivation Area</th>
                  <th>Expected Yield</th>
                  <th>Harvest Date</th>
                  <th>Price per Unit</th>
                  <th>Photos</th>
                  <th>Videos</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedProducts.map((productId) => {
                  const product = products.find(p => p.productId === productId);
                  const details = productDetails[productId];
                  
                  if (!product) return null;
                  
                  return (
                    <tr key={productId}>
                      <td style={{ fontWeight: 'bold', color: '#388e3c' }}>
                        {product.title}
                      </td>
                      <td>{product.type}</td>
                      <td>{product.category}</td>
                      <td>{details?.cultivationArea || 'N/A'}</td>
                      <td>{details?.expectedYield || 'N/A'}</td>
                      <td>{details?.expectedHarvestDate || 'N/A'}</td>
                      <td style={{ fontWeight: 'bold', color: '#2e7d32' }}>
                        ₹{details?.preBookPrice?.toFixed(2) || '0.00'}
                      </td>
                      <td>
                        {details?.photoUrls && details.photoUrls.length > 0 ? (
                          <span title={details.photoUrls.join('\n')}>
                            📷 {details.photoUrls.length} photo{details.photoUrls.length !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span style={{ color: '#999' }}>No photos</span>
                        )}
                      </td>
                      <td>
                        {details?.videoUrls && details.videoUrls.length > 0 ? (
                          <span title={details.videoUrls.join('\n')}>
                            🎥 {details.videoUrls.length} video{details.videoUrls.length !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span style={{ color: '#999' }}>No videos</span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handleEditProduct(product, productId)}
                            title="Edit product details"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteProduct(productId)}
                            title="Remove product"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Product Details */}
      {modalOpen && selectedProductForModal && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {isEditMode ? '✏️ Edit Product Details' : '➕ Add Product Details'} - {selectedProductForModal.title}
                {!isEditMode && productDetailsCache[selectedProductForModal._id ? String(selectedProductForModal._id) : 
                                                   selectedProductForModal.id ? String(selectedProductForModal.id) :
                                                   `product-${products.indexOf(selectedProductForModal)}`] && (
                  <span style={{ 
                    color: '#2196f3', 
                    fontSize: '0.8em', 
                    marginLeft: '8px',
                    fontWeight: 'normal'
                  }}>
                    💾 (Previously saved data loaded)
                  </span>
                )}
              </h3>
              <p className="modal-subtitle">
                {selectedProductForModal.type} • {selectedProductForModal.category}
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="cultivationArea">Cultivation Area *</label>
              <input
                id="cultivationArea"
                type="text"
                placeholder="e.g., 2 acres, 500 sq meters"
                value={currentProductDetails.cultivationArea}
                onChange={(e) => setCurrentProductDetails(prev => ({
                  ...prev,
                  cultivationArea: e.target.value
                }))}
              />
            </div>

            <div className="form-group">
              <label htmlFor="expectedYield">Expected Yield *</label>
              <input
                id="expectedYield"
                type="text"
                placeholder="e.g., 100 kg, 2 tons"
                value={currentProductDetails.expectedYield}
                onChange={(e) => setCurrentProductDetails(prev => ({
                  ...prev,
                  expectedYield: e.target.value
                }))}
              />
            </div>

            <div className="form-group">
              <label htmlFor="expectedHarvestDate">Expected Date of Harvest *</label>
              <input
                id="expectedHarvestDate"
                type="date"
                value={currentProductDetails.expectedHarvestDate}
                onChange={(e) => setCurrentProductDetails(prev => ({
                  ...prev,
                  expectedHarvestDate: e.target.value
                }))}
              />
            </div>

            <div className="form-group">
              <label htmlFor="preBookPrice">Pre-book Price (per unit) *</label>
              <input
                id="preBookPrice"
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={currentProductDetails.preBookPrice || ''}
                onChange={(e) => setCurrentProductDetails(prev => ({
                  ...prev,
                  preBookPrice: parseFloat(e.target.value) || 0
                }))}
              />
            </div>

            <div className="form-group">
              <label>Photo URLs</label>
              <div className="url-input-section">
                <input
                  type="url"
                  placeholder="Enter photo URL"
                  value={currentPhotoUrl}
                  onChange={(e) => setCurrentPhotoUrl(e.target.value)}
                />
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={addPhotoUrl}
                  disabled={!currentPhotoUrl.trim()}
                >
                  Add Photo
                </button>
              </div>
              {currentProductDetails.photoUrls.length > 0 && (
                <div className="url-list">
                  {currentProductDetails.photoUrls.map((url, index) => (
                    <div key={index} className="url-item">
                      <span className="url-text">{url}</span>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => removePhotoUrl(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Video URLs</label>
              <div className="url-input-section">
                <input
                  type="url"
                  placeholder="Enter video URL"
                  value={currentVideoUrl}
                  onChange={(e) => setCurrentVideoUrl(e.target.value)}
                />
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={addVideoUrl}
                  disabled={!currentVideoUrl.trim()}
                >
                  Add Video
                </button>
              </div>
              {currentProductDetails.videoUrls.length > 0 && (
                <div className="url-list">
                  {currentProductDetails.videoUrls.map((url, index) => (
                    <div key={index} className="url-item">
                      <span className="url-text">{url}</span>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => removeVideoUrl(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-buttons">
              <button 
                className="btn btn-secondary"
                onClick={handleModalClose}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleModalSubmit}
                disabled={
                  !currentProductDetails.cultivationArea.trim() ||
                  !currentProductDetails.expectedYield.trim() ||
                  !currentProductDetails.expectedHarvestDate ||
                  !currentProductDetails.preBookPrice
                }
              >
                {isEditMode ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
