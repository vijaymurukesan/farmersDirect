"use client";
import React, { useState, useEffect } from 'react';
import ProductSelector from '../components/ProductSelector';
import Snackbar from '../components/Snackbar';

// Leaflet map integration
interface LeafletMap {
  setView: (latlng: [number, number], zoom: number) => void;
  on: (event: string, callback: (e: { latlng: { lat: number; lng: number } }) => void) => void;
  remove: () => void;
  _layers: Record<string, unknown>;
}

interface LeafletMarker {
  setLatLng: (latlng: [number, number]) => void;
  addTo: (map: LeafletMap) => LeafletMarker;
  bindPopup: (content: string) => LeafletMarker;
  openPopup: () => LeafletMarker;
}

declare global {
  interface Window {
    L: {
      map: (id: string, options?: unknown) => LeafletMap;
      tileLayer: (url: string, options?: unknown) => {
        addTo: (map: LeafletMap) => LeafletTileLayer;
      };
      marker: (latlng: [number, number]) => LeafletMarker;
    };
  }
}

interface LeafletTileLayer {
  addTo: (map: LeafletMap) => LeafletTileLayer;
}

interface FormData {
  contactPerson: string;
  companyName: string;
  phoneNumber: string;
  email: string;
  gstRegistered: boolean;
  isRegisteredCompany: boolean;
  totalAreaOfCultivation: string;
  totalYield: string;
  availability: {
    today: boolean;
    expectedDate: string;
  };
  organicCertificate: string;
  address: string;
  mapLocation: {
    lat: number;
    lng: number;
  };
  readyForContract: boolean;
  price: number;
  images: string[];
  videos: string[];
  selectedProducts: string[];
  productDetails: { [productId: string]: ProductDetails };
}

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

export default function RegisterFarmerPage() {
  const [formData, setFormData] = useState<FormData>({
    contactPerson: '',
    companyName: '',
    phoneNumber: '',
    email: '',
    gstRegistered: false,
    isRegisteredCompany: false,
    totalAreaOfCultivation: '',
    totalYield: '',
    availability: {
      today: false,
      expectedDate: ''
    },
    organicCertificate: '',
    address: '',
    mapLocation: {
      lat: 0,
      lng: 0
    },
    readyForContract: false,
    price: 0,
    images: [''],
    videos: [''],
    selectedProducts: [],
    productDetails: {}
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempLocation, setTempLocation] = useState({ lat: 0, lng: 0 });
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    isOpen: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info'
  });

  // Snackbar helper functions
  const showSnackbar = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setSnackbar({
      isOpen: true,
      message,
      type
    });
  };

  const closeSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        } else {
          console.error('Failed to fetch products');
          // Fallback to mock data if API fails
          const mockProducts: Product[] = [
            { id: '1', productId: '1', title: 'Rice', type: 'Grain', category: 'organic' },
            { id: '2', productId: '2', title: 'Wheat', type: 'Grain', category: 'conventional' },
            { id: '3', productId: '3', title: 'Tomatoes', type: 'Vegetable', category: 'organic' },
            { id: '4', productId: '4', title: 'Onions', type: 'Vegetable', category: 'conventional' },
            { id: '5', productId: '5', title: 'Apples', type: 'Fruit', category: 'organic' },
            { id: '6', productId: '6', title: 'Potatoes', type: 'Vegetable', category: 'conventional' },
            { id: '7', productId: '7', title: 'Corn', type: 'Grain', category: 'organic' },
            { id: '8', productId: '8', title: 'Carrots', type: 'Vegetable', category: 'organic' }
          ];
          setProducts(mockProducts);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        // Fallback to mock data if API fails
        const mockProducts: Product[] = [
          { id: '1', productId: '1', title: 'Rice', type: 'Grain', category: 'organic' },
          { id: '2', productId: '2', title: 'Wheat', type: 'Grain', category: 'conventional' },
          { id: '3', productId: '3', title: 'Tomatoes', type: 'Vegetable', category: 'organic' },
          { id: '4', productId: '4', title: 'Onions', type: 'Vegetable', category: 'conventional' },
          { id: '5', productId: '5', title: 'Apples', type: 'Fruit', category: 'organic' },
          { id: '6', productId: '6', title: 'Potatoes', type: 'Vegetable', category: 'conventional' },
          { id: '7', productId: '7', title: 'Corn', type: 'Grain', category: 'organic' },
          { id: '8', productId: '8', title: 'Carrots', type: 'Vegetable', category: 'organic' }
        ];
        setProducts(mockProducts);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleInputChange = (field: string, value: string | boolean | number) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => {
        if (parent === 'availability') {
          return {
            ...prev,
            availability: {
              ...prev.availability,
              [child]: value
            }
          };
        } else if (parent === 'mapLocation') {
          return {
            ...prev,
            mapLocation: {
              ...prev.mapLocation,
              [child]: value
            }
          };
        }
        return prev;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleArrayChange = (field: 'images' | 'videos', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: 'images' | 'videos') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'images' | 'videos', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleProductToggle = (productId: string, details?: ProductDetails) => {
    console.log('Toggling product:', productId, details);
    console.log('Current selected products:', formData.selectedProducts);
    
    setFormData(prev => {
      const isCurrentlySelected = prev.selectedProducts.includes(productId);
      
      if (isCurrentlySelected && !details) {
        // Remove product only if no details provided (delete operation)
        const newSelectedProducts = prev.selectedProducts.filter(id => id !== productId);
        const newProductDetails = { ...prev.productDetails };
        delete newProductDetails[productId];
        
        console.log('Removing product. New selection:', newSelectedProducts);
        
        return {
          ...prev,
          selectedProducts: newSelectedProducts,
          productDetails: newProductDetails
        };
      } else if (isCurrentlySelected && details) {
        // Update existing product details (edit operation)
        const newProductDetails = { ...prev.productDetails };
        newProductDetails[productId] = details;
        
        console.log('Updating product details for:', productId);
        
        return {
          ...prev,
          productDetails: newProductDetails
        };
      } else {
        // Add new product with details
        const newSelectedProducts = [...prev.selectedProducts, productId];
        const newProductDetails = { ...prev.productDetails };
        
        if (details) {
          newProductDetails[productId] = details;
        }
        
        console.log('Adding product. New selection:', newSelectedProducts);
        
        return {
          ...prev,
          selectedProducts: newSelectedProducts,
          productDetails: newProductDetails
        };
      }
    });
  };

  const confirmLocationSelection = () => {
    setFormData(prev => ({
      ...prev,
      mapLocation: tempLocation
    }));
    setShowMapModal(false);
  };

  const openMapModal = () => {
    setTempLocation(formData.mapLocation.lat !== 0 ? formData.mapLocation : { lat: 28.6139, lng: 77.2090 }); // Default to Delhi
    setShowMapModal(true);
    loadLeafletMap();
  };

  const loadLeafletMap = () => {
    if (typeof window !== 'undefined' && !window.L) {
      // Load Leaflet CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // Load Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        setMapLoaded(true);
        setTimeout(initializeMap, 100); // Small delay to ensure modal is rendered
      };
      document.head.appendChild(script);
    } else if (window.L) {
      setMapLoaded(true);
      setTimeout(initializeMap, 100);
    }
  };

  const initializeMap = () => {
    if (!window.L) return;

    const mapContainer = document.getElementById('leaflet-map');
    if (!mapContainer || mapInstance) return;

    const startLat = tempLocation.lat !== 0 ? tempLocation.lat : 28.6139;
    const startLng = tempLocation.lng !== 0 ? tempLocation.lng : 77.2090;

    const map = window.L.map('leaflet-map');
    map.setView([startLat, startLng], 10);

    // Add OpenStreetMap tiles
    const tileLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    });
    tileLayer.addTo(map);

    const marker = window.L.marker([startLat, startLng]);
    marker.addTo(map);

    // Handle map clicks
    map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      setTempLocation({ lat, lng });
      
      // Update marker position
      marker.setLatLng([lat, lng]);
    });

    setMapInstance(map);
  };

  // Cleanup map when modal closes
  useEffect(() => {
    if (!showMapModal && mapInstance) {
      mapInstance.remove();
      setMapInstance(null);
    }
  }, [showMapModal, mapInstance]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setTempLocation({ lat, lng });
          
          // Update map view and marker if map is loaded
          if (mapInstance) {
            mapInstance.setView([lat, lng], 15);
            const markers = mapInstance._layers;
            Object.values(markers).forEach((layer: unknown) => {
              const markerLayer = layer as { setLatLng?: (latlng: [number, number]) => void };
              if (markerLayer.setLatLng) {
                markerLayer.setLatLng([lat, lng]);
              }
            });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          showSnackbar('Unable to get current location. Please select manually on the map.', 'warning');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      showSnackbar('Geolocation is not supported by this browser.', 'warning');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Create the JSON object with the exact structure requested
      const submissionData = {
        contactPerson: formData.contactPerson,
        companyName: formData.companyName,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        gstRegistered: formData.gstRegistered,
        isRegisteredCompany: formData.isRegisteredCompany,
        totalAreaOfCultivation: formData.totalAreaOfCultivation,
        totalYield: formData.totalYield,
        availability: {
          today: formData.availability.today,
          expectedDate: formData.availability.expectedDate
        },
        size: "large", // Default value as per your JSON structure
        organicCertificate: formData.organicCertificate,
        address: formData.address,
        mapLocation: {
          lat: formData.mapLocation.lat,
          lng: formData.mapLocation.lng
        },
        review: "4", // Default value as per your JSON structure
        totalSuccessForDelivery: 98, // Default value as per your JSON structure
        readyForContract: formData.readyForContract,
        totalContractWithdrawal: 2, // Default value as per your JSON structure
        price: formData.price,
        images: formData.images.filter(img => img.trim() !== ''), // Remove empty strings
        videos: formData.videos.filter(vid => vid.trim() !== ''), // Remove empty strings
        relatedProduct: formData.selectedProducts.map(productId => {
          const product = products.find(p => p.productId === productId);
          const details = formData.productDetails[productId];
          
          return {
            productId: productId,
            productName: product?.title || "",
            type: product?.type || "",
            category: product?.category || "",
            cultivationArea: details?.cultivationArea || "",
            expectedYield: details?.expectedYield || "",
            HarvestDate: details?.expectedHarvestDate || "",
            PricePerUnit: details?.preBookPrice || 0,
            photos: details?.photoUrls || [],
            videos: details?.videoUrls || []
          };
        })
      };

      // Console log the created object
      console.log('Farmer Registration Data:', JSON.stringify(submissionData, null, 2));
      
      // Send data to the API
      const response = await fetch('/api/farmers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        showSnackbar(`Farmer registered successfully! 🎉 Farmer ID: ${result.farmerId}`, 'success');
        
        // Redirect back to previous page or dashboard after a short delay
        setTimeout(() => {
          window.history.back();
        }, 3000);
      } else {
        throw new Error(result.message || 'Failed to register farmer');
      }
    } catch (error) {
      console.error('Error registering farmer:', error);
      showSnackbar(`Error registering farmer: ${error instanceof Error ? error.message : 'Please try again.'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: '#f1f8e9',
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: 'Arial, Georgia, serif'
    }}>
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
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
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
        .modal-input {
          padding: 0.75rem;
          border: 2px solid #c8e6c9;
          border-radius: 8px;
          font-size: 1rem;
          color: #000000;
          background: white;
          transition: border-color 0.3s ease;
          width: 100%;
        }
        .modal-input:focus {
          outline: none;
          border-color: #388e3c;
        }
        .modal-textarea {
          padding: 0.75rem;
          border: 2px solid #c8e6c9;
          border-radius: 8px;
          font-size: 1rem;
          color: #000000;
          background: white;
          resize: vertical;
          min-height: 80px;
          transition: border-color 0.3s ease;
          width: 100%;
        }
        .modal-textarea:focus {
          outline: none;
          border-color: #388e3c;
        }
        .form-select:focus {
          outline: none;
          border-color: #388e3c;
        }
        .checkbox-field {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .checkbox-input {
          width: 18px;
          height: 18px;
          accent-color: #388e3c;
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
        .array-input-group {
          display: flex;
          gap: 0.5rem;
          align-items: center;
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
        .map-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .map-modal-content {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          width: 90%;
          max-width: 800px;
          max-height: 90%;
          position: relative;
        }
        .map-container {
          width: 100%;
          height: 400px;
          border: 2px solid #c8e6c9;
          border-radius: 8px;
          background: #f1f8e9;
          position: relative;
          overflow: hidden;
        }
        .map-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          height: 100%;
          color: #388e3c;
          font-size: 1.1rem;
        }
        #leaflet-map {
          width: 100%;
          height: 100%;
          border-radius: 6px;
        }
        .coordinates-display {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(255, 255, 255, 0.95);
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 0.9rem;
          z-index: 1000;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border: 1px solid #c8e6c9;
        }
      `}</style>

      {/* Header */}
      <div className="form-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 style={{ color: '#388e3c', fontSize: '2.5rem', margin: 0 }}>Register as Farmer</h1>
          <button
            onClick={() => window.history.back()}
            style={{
              background: '#757575',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            ← Back
          </button>
        </div>
        <p style={{ color: '#6d4c41', fontSize: '1.1rem', margin: 0 }}>
          Join our platform and start selling your agricultural products directly to customers.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Section 1: Personal Information */}
        <div className="form-section">
          <h2 style={{ color: '#388e3c', fontSize: '1.8rem', marginBottom: '1.5rem', borderBottom: '2px solid #c8e6c9', paddingBottom: '0.5rem' }}>
            👤 Personal Information
          </h2>
          
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Contact Person Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.contactPerson}
                onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                required
                placeholder="Enter full name"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Company/Farm Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                required
                placeholder="Enter company or farm name"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                className="form-input"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                required
                placeholder="Enter phone number (e.g., +91 9876543210)"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                placeholder="Enter email address"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Complete Address *</label>
              <textarea
                className="form-textarea"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
                placeholder="Enter complete address including village, district, state"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Location Coordinates</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={formData.mapLocation.lat}
                    onChange={(e) => handleInputChange('mapLocation.lat', parseFloat(e.target.value) || 0)}
                    placeholder="Latitude"
                    readOnly
                  />
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={formData.mapLocation.lng}
                    onChange={(e) => handleInputChange('mapLocation.lng', parseFloat(e.target.value) || 0)}
                    placeholder="Longitude"
                    readOnly
                  />
                </div>
                <button
                  type="button"
                  onClick={openMapModal}
                  style={{
                    background: '#388e3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  📍 Select Location on Map
                </button>
                {formData.mapLocation.lat !== 0 && formData.mapLocation.lng !== 0 && (
                  <p style={{ color: '#388e3c', fontSize: '0.9rem', margin: 0 }}>
                    ✓ Location selected: {formData.mapLocation.lat.toFixed(6)}, {formData.mapLocation.lng.toFixed(6)}
                  </p>
                )}
              </div>
            </div>

            <div className="checkbox-field">
              <input
                type="checkbox"
                className="checkbox-input"
                checked={formData.gstRegistered}
                onChange={(e) => handleInputChange('gstRegistered', e.target.checked)}
              />
              <label className="form-label">GST Registered</label>
            </div>

            <div className="checkbox-field">
              <input
                type="checkbox"
                className="checkbox-input"
                checked={formData.isRegisteredCompany}
                onChange={(e) => handleInputChange('isRegisteredCompany', e.target.checked)}
              />
              <label className="form-label">Registered Company</label>
            </div>
          </div>
        </div>

        {/* Section 2: Product Offering Information */}
        <div className="form-section">
          <h2 style={{ color: '#388e3c', fontSize: '1.8rem', marginBottom: '1.5rem', borderBottom: '2px solid #c8e6c9', paddingBottom: '0.5rem' }}>
            🌱 Product Offering Information
          </h2>
          
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Total Area of Cultivation *</label>
              <input
                type="text"
                className="form-input"
                value={formData.totalAreaOfCultivation}
                onChange={(e) => handleInputChange('totalAreaOfCultivation', e.target.value)}
                required
                placeholder="e.g., 15 acres"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Total Yield *</label>
              <input
                type="text"
                className="form-input"
                value={formData.totalYield}
                onChange={(e) => handleInputChange('totalYield', e.target.value)}
                required
                placeholder="e.g., 12000 kg/year"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Price per kg (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                required
                placeholder="Enter price per kg"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Organic Certificate URL</label>
              <input
                type="url"
                className="form-input"
                value={formData.organicCertificate}
                onChange={(e) => handleInputChange('organicCertificate', e.target.value)}
                placeholder="https://example.com/certificate.pdf"
              />
            </div>

            <div className="checkbox-field">
              <input
                type="checkbox"
                className="checkbox-input"
                checked={formData.availability.today}
                onChange={(e) => handleInputChange('availability.today', e.target.checked)}
              />
              <label className="form-label">Available Today</label>
            </div>

            <div className="form-field">
              <label className="form-label">Expected Availability Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.availability.expectedDate}
                onChange={(e) => handleInputChange('availability.expectedDate', e.target.value)}
              />
            </div>

            <div className="checkbox-field">
              <input
                type="checkbox"
                className="checkbox-input"
                checked={formData.readyForContract}
                onChange={(e) => handleInputChange('readyForContract', e.target.checked)}
              />
              <label className="form-label">Ready for Contract Farming</label>
            </div>
          </div>

          {/* Product Images */}
          <div style={{ marginTop: '2rem' }}>
            <label className="form-label" style={{ marginBottom: '1rem', display: 'block' }}>Product Images</label>
            {formData.images.map((image, index) => (
              <div key={index} className="array-input-group" style={{ marginBottom: '0.5rem' }}>
                <input
                  type="url"
                  className="form-input array-input"
                  value={image}
                  onChange={(e) => handleArrayChange('images', index, e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                {formData.images.length > 1 && (
                  <button
                    type="button"
                    className="array-button remove-button"
                    onClick={() => removeArrayItem('images', index)}
                  >
                    ✕
                  </button>
                )}
                {index === formData.images.length - 1 && (
                  <button
                    type="button"
                    className="array-button add-button"
                    onClick={() => addArrayItem('images')}
                  >
                    +
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Product Videos */}
          <div style={{ marginTop: '2rem' }}>
            <label className="form-label" style={{ marginBottom: '1rem', display: 'block' }}>Product Videos</label>
            {formData.videos.map((video, index) => (
              <div key={index} className="array-input-group" style={{ marginBottom: '0.5rem' }}>
                <input
                  type="url"
                  className="form-input array-input"
                  value={video}
                  onChange={(e) => handleArrayChange('videos', index, e.target.value)}
                  placeholder="https://example.com/video.mp4"
                />
                {formData.videos.length > 1 && (
                  <button
                    type="button"
                    className="array-button remove-button"
                    onClick={() => removeArrayItem('videos', index)}
                  >
                    ✕
                  </button>
                )}
                {index === formData.videos.length - 1 && (
                  <button
                    type="button"
                    className="array-button add-button"
                    onClick={() => addArrayItem('videos')}
                  >
                    +
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Product Selection */}
        <div className="form-section">
          <h2 style={{ color: '#388e3c', fontSize: '1.8rem', marginBottom: '1.5rem', borderBottom: '2px solid #c8e6c9', paddingBottom: '0.5rem' }}>
            🛒 Product Selection
          </h2>
          
          <ProductSelector
            products={products}
            selectedProducts={formData.selectedProducts}
            productsLoading={productsLoading}
            onProductToggle={handleProductToggle}
            productDetails={formData.productDetails}
          />
        </div>

        {/* Submit Button */}
        <div className="form-section">
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => window.history.back()}
              style={{
                background: '#757575',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '1rem 2rem',
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || formData.selectedProducts.length === 0 || productsLoading}
              style={{
                background: loading || formData.selectedProducts.length === 0 || productsLoading ? '#cccccc' : 'linear-gradient(45deg, #388e3c, #2e7d32)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '1rem 2rem',
                cursor: loading || formData.selectedProducts.length === 0 || productsLoading ? 'not-allowed' : 'pointer',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minWidth: '200px',
                justifyContent: 'center'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Registering...
                </>
              ) : (
                <>👨‍🌾 Register as Farmer</>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Map Modal */}
      {showMapModal && (
        <div className="map-modal">
          <div className="map-modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#388e3c', margin: 0, fontSize: '1.5rem' }}>📍 Select Farm Location</h3>
              <button
                onClick={() => setShowMapModal(false)}
                style={{
                  background: '#757575',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            </div>
            
            <p style={{ color: '#6d4c41', marginBottom: '1rem' }}>
              Click anywhere on the interactive map below to select your farm&apos;s location coordinates. The map shows real satellite imagery and street data.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <button
                onClick={getCurrentLocation}
                style={{
                  background: '#2e7d32',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                🎯 Use My Current Location
              </button>
            </div>

            <div className="map-container">
              <div className="coordinates-display">
                <strong>📍 Selected Location:</strong><br />
                <span style={{ color: '#388e3c', fontWeight: 'bold' }}>
                  {tempLocation.lat.toFixed(6)}, {tempLocation.lng.toFixed(6)}
                </span>
              </div>
              
              {!mapLoaded ? (
                <div className="map-loading">
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #c8e6c9',
                    borderTop: '4px solid #388e3c',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '1rem'
                  }}></div>
                  <div>Loading interactive map...</div>
                  <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.7 }}>
                    Powered by OpenStreetMap
                  </div>
                </div>
              ) : (
                <div id="leaflet-map"></div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#6d4c41' }}>
                <strong>Current Selection:</strong> {tempLocation.lat.toFixed(6)}, {tempLocation.lng.toFixed(6)}
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setShowMapModal(false)}
                  style={{
                    background: '#757575',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLocationSelection}
                  disabled={tempLocation.lat === 0 && tempLocation.lng === 0}
                  style={{
                    background: tempLocation.lat === 0 && tempLocation.lng === 0 ? '#cccccc' : '#388e3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    cursor: tempLocation.lat === 0 && tempLocation.lng === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}
                >
                  ✓ Confirm Location
                </button>
              </div>
            </div>
          </div>
          </div>
        )}
      
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