'use client';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback } from 'react';
import FarmerFilter from '../../components/FarmerFilter';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

// Define types
interface Product {
  productId: string;
  title: string;
  type: string;
  category: string;
  price: string;
  description: string;
  images?: string[];
  videos?: string[];
  farmers?: Farmer[];
}

interface Farmer {
  contactPerson: string;
  companyName: string;
  phoneNumber: string;
  email: string;
  farmerId?: string; // Farmer ID from user collection
  address: string;
  mapLocation: { lat: number; lng: number };
  organicCertificate?: string;
  price: number;
  review: string;
  gstRegistered: boolean;
  isRegisteredCompany: boolean;
  readyForContract: boolean;
  availability: { today: boolean; expectedDate: string };
  totalAreaOfCultivation: string;
  totalYield: string;
  size: string;
  totalSuccessForDelivery: string;
  totalContractWithdrawal: string;
  relatedProduct?: { productId: string }[];
}

interface Filters {
  gstRegistered: string;
  isRegisteredCompany: string;
  availability: string;
  size: string;
  organicCertificate: string;
  readyForContract: string;
  priceRange: string;
  organic: string;
  averageReviews: string;
  area: string;
  yield: string;
  district: string;
  state: string;
}

// Helper function to generate consistent random images based on product name
const getProductImage = (productName: string, index: number = 0) => {
  // Create a consistent seed from product name and index
  const seedString = `${productName
    .toLowerCase()
    .replace(/\s+/g, '')}-${index}`;
  const seed = seedString.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  // Use Lorem Picsum with seed for consistent, high-quality images
  return `https://picsum.photos/seed/${Math.abs(seed)}/400/300`;
};

// Helper function for farmer profile images
const getFarmerImage = (farmerName: string) => {
  const seedString = farmerName.toLowerCase().replace(/\s+/g, '');
  const seed = seedString.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  // Use Lorem Picsum with seed for consistent profile images
  return `https://picsum.photos/seed/${Math.abs(seed)}/200/200`;
};

// Helper function to generate dynamic video URLs based on product name
const getProductVideo = (productName: string) => {
  // Create a hash from product name for consistency
  const seed = productName
    .toLowerCase()
    .replace(/\s+/g, '')
    .split('')
    .reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

  // Array of free sample video URLs (these are public domain videos)
  const videoUrls = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  ];

  // Use the seed to consistently select a video for each product
  const videoIndex = Math.abs(seed) % videoUrls.length;
  return videoUrls[videoIndex];
};

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.productId;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    gstRegistered: '',
    isRegisteredCompany: '',
    availability: '',
    size: '',
    organicCertificate: '',
    readyForContract: '',
    priceRange: '',
    organic: '',
    averageReviews: '',
    area: '',
    yield: '',
    district: '',
    state: '',
  });
  const [filteredFarmers, setFilteredFarmers] = useState<Farmer[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'video' | 'image'>('video');
  const [modalContent, setModalContent] = useState('');
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [currentModalImageIndex, setCurrentModalImageIndex] = useState(0);
  const [modalImageLoading, setModalImageLoading] = useState(false);
  const [isFilterSticky, setIsFilterSticky] = useState(false);

  // User authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [accessDeniedModal, setAccessDeniedModal] = useState(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState('');
  const [revealedContacts, setRevealedContacts] = useState<Set<number>>(
    new Set()
  );

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedProduct, setEditedProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Total images based on actual product images or default to 1 if none
  const totalImages =
    product?.images && product.images.length > 0 ? product.images.length : 1;

  // Check user authentication
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userDataStr = localStorage.getItem('userData');

    if (token && userDataStr) {
      try {
        const user = JSON.parse(userDataStr);
        setIsLoggedIn(true);
        setUserData(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setIsLoggedIn(false);
      }
    }
  }, []);

  // Initialize edited product when product loads
  useEffect(() => {
    if (product) {
      setEditedProduct(product);
    }
  }, [product]);

  // Handle edit button click
  const handleEditClick = () => {
    setIsEditMode(true);
    setEditedProduct(product);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedProduct(product);
  };

  // Handle save product
  const handleSaveProduct = async () => {
    if (!editedProduct) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/products`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: productId,
          title: editedProduct.title,
          type: editedProduct.type,
          price: editedProduct.price,
          description: editedProduct.description,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Update the product state with new data
        setProduct(editedProduct);
        setIsEditMode(false);
        alert('Product updated successfully!');
      } else {
        throw new Error(result.message || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert(
        `Error updating product: ${
          error instanceof Error ? error.message : 'Please try again.'
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle product field changes
  const handleProductFieldChange = (field: keyof Product, value: string) => {
    if (editedProduct) {
      setEditedProduct({
        ...editedProduct,
        [field]: value,
      });
    }
  };

  // Handle edit farmer - navigate to register-farmer with farmer data
  const handleEditFarmer = (farmer: Farmer) => {
    // Store farmer data in localStorage for the register-farmer page to load
    localStorage.setItem(
      'editingFarmerData',
      JSON.stringify({
        ...farmer,
        productId: productId,
        isEditing: true,
      })
    );
    // Navigate to register-farmer page
    router.push('/register-farmer');
  };

  // Check if user can edit a specific farmer tile
  const canEditFarmer = (farmer: Farmer): boolean => {
    if (!isLoggedIn || !userData) return false;

    // Admin and owner can edit any farmer
    if (userData.userType === 'admin' || userData.userType === 'owner') {
      return true;
    }

    // Farmer can edit their own tile - match by email OR farmerId
    if (userData.userType === 'farmer') {
      // Match by email
      if (userData.email === farmer.email) {
        return true;
      }

      // Match by farmerId (if both exist)
      if (
        userData.farmerId &&
        (farmer as any).farmerId &&
        userData.farmerId === (farmer as any).farmerId
      ) {
        return true;
      }
    }

    return false;
  };

  // Handle delete farmer
  const handleDeleteFarmer = async (farmer: Farmer) => {
    // Confirm deletion
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${farmer.contactPerson} from this product?\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch('/api/farmers', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: farmer.email,
          productId: productId,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('Farmer deleted successfully!');
        // Reload the page to reflect changes
        window.location.reload();
      } else {
        throw new Error(result.message || 'Failed to delete farmer');
      }
    } catch (error) {
      console.error('Error deleting farmer:', error);
      alert(
        `Error deleting farmer: ${
          error instanceof Error ? error.message : 'Please try again.'
        }`
      );
    }
  };

  const nextImage = () => {
    setImageLoading(true);
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  };

  const prevImage = () => {
    setImageLoading(true);
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  // Check if current user has already registered for this product
  const hasUserAlreadyRegistered = (): boolean => {
    if (!isLoggedIn || !userData || !product?.farmers) return false;

    // Check if any farmer in the product's farmers array matches current user
    return product.farmers.some((farmer: Farmer) => {
      // Match by email
      if (userData.email === farmer.email) {
        return true;
      }
      // Match by farmerId (if both exist)
      if (
        userData.farmerId &&
        farmer.farmerId &&
        userData.farmerId === farmer.farmerId
      ) {
        return true;
      }
      return false;
    });
  };

  // Handle Add Farmer button click with access control
  const handleAddFarmerClick = () => {
    // Check if user is logged in
    if (!isLoggedIn || !userData) {
      window.location.href = '/login';
      return;
    }

    // Check if user is a farmer
    if (userData.userType !== 'farmer') {
      setAccessDeniedMessage('only-farmers');
      setAccessDeniedModal(true);
      return;
    }

    // Check if user is verified
    if (!userData.userVerified) {
      setAccessDeniedMessage('not-verified');
      setAccessDeniedModal(true);
      return;
    }

    // All checks passed, proceed to registration
    window.location.href = '/register-farmer';
  };

  // Helper functions for masking contact information
  const maskEmail = (email: string) => {
    if (!email) return 'Not provided';
    const [username, domain] = email.split('@');
    if (!username || !domain) return email;
    const maskedUsername =
      username.charAt(0) + '***' + username.charAt(username.length - 1);
    return `${maskedUsername}@${domain}`;
  };

  const maskPhone = (phone: string) => {
    if (!phone) return 'Not provided';
    // Mask phone: show first 2 and last 2 digits
    if (phone.length <= 4) return phone;
    const masked = phone.slice(0, 2) + '******' + phone.slice(-2);
    return masked;
  };

  // Handle reveal contact details
  const handleRevealContact = (farmerIndex: number) => {
    // Check if user is logged in
    if (!isLoggedIn || !userData) {
      router.push('/login');
      return;
    }

    // Check if user is a buyer, admin, or owner
    if (
      userData.userType !== 'buyer' &&
      userData.userType !== 'admin' &&
      userData.userType !== 'owner'
    ) {
      setAccessDeniedMessage('only-buyers');
      setAccessDeniedModal(true);
      return;
    }

    // Check if buyer is verified (admin and owner bypass verification)
    if (
      userData.userType === 'buyer' &&
      (!userData.emailVerified || !userData.userVerified)
    ) {
      setAccessDeniedMessage('not-verified-buyer');
      setAccessDeniedModal(true);
      return;
    }

    // Reveal contact for this farmer
    setRevealedContacts((prev) => {
      const newSet = new Set(prev);
      newSet.add(farmerIndex);
      return newSet;
    });
  };

  // Handle map/certificate link clicks
  const handleProtectedLink = (
    e: React.MouseEvent<HTMLAnchorElement>,
    url: string,
    farmer: Farmer
  ) => {
    e.preventDefault();

    // Check if user is logged in
    if (!isLoggedIn || !userData) {
      router.push('/login');
      return;
    }

    // Allow access if user can edit this farmer (admin/owner/creator)
    if (canEditFarmer(farmer)) {
      window.open(url, '_blank');
      return;
    }

    // Check if user is a buyer, admin, or owner
    if (
      userData.userType !== 'buyer' &&
      userData.userType !== 'admin' &&
      userData.userType !== 'owner'
    ) {
      setAccessDeniedMessage('only-buyers');
      setAccessDeniedModal(true);
      return;
    }

    // Check if buyer is verified (admin and owner bypass verification)
    if (
      userData.userType === 'buyer' &&
      (!userData.emailVerified || !userData.userVerified)
    ) {
      setAccessDeniedMessage('not-verified-buyer');
      setAccessDeniedModal(true);
      return;
    }

    // Open link in new tab if user is authorized
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Handle Shortlist
  const handleShortlist = async (farmer: Farmer) => {
    if (!isLoggedIn || !userData) {
      router.push('/login');
      return;
    }

    // Find the matching product from farmer's relatedProduct array
    const matchedProduct = (farmer as any).relatedProduct?.find(
      (p: any) => p.productId === productId
    );

    const interactionData = {
      interactionType: 'shortlist',
      farmerId: farmer.farmerId || '',
      buyerId: userData.buyerId || userData.farmerId || '',

      // Farmer details
      farmerEmail: farmer.email,
      farmerContactPerson: farmer.contactPerson,
      farmerCompanyName: farmer.companyName,
      farmerPhoneNumber: farmer.phoneNumber,
      farmerAddress: farmer.address,
      farmerMapLocation: farmer.mapLocation,

      // Buyer details
      buyerEmail: userData.email,
      buyerFullName: userData.fullName || userData.contactPerson || '',
      buyerCompanyName: userData.companyName || '',
      buyerPhoneNumber: userData.phoneNumber || '',

      // Product details
      productId: productId,
      productName: product?.title || '',
      productType: product?.type || '',
      productCategory: product?.category || '',
      pricePerUnit: matchedProduct?.PricePerUnit || 0,

      buyerNotes: '',
    };

    try {
      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interactionData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('✅ Farmer shortlisted successfully!');
      } else {
        alert(result.message || 'Failed to shortlist farmer');
      }
    } catch (error) {
      console.error('Error shortlisting farmer:', error);
      alert('Error shortlisting farmer. Please try again.');
    }
  };

  // Handle Express Interest
  const handleExpressInterest = async (farmer: Farmer) => {
    if (!isLoggedIn || !userData) {
      router.push('/login');
      return;
    }

    // Prompt for buyer notes
    const buyerNotes = prompt(
      'Enter any additional notes or message for the farmer (optional):'
    );
    if (buyerNotes === null) return; // User cancelled

    // Find the matching product from farmer's relatedProduct array
    const matchedProduct = (farmer as any).relatedProduct?.find(
      (p: any) => p.productId === productId
    );

    const interactionData = {
      interactionType: 'express_interest',
      farmerId: farmer.farmerId || '',
      buyerId: userData.buyerId || userData.farmerId || '',

      // Farmer details
      farmerEmail: farmer.email,
      farmerContactPerson: farmer.contactPerson,
      farmerCompanyName: farmer.companyName,
      farmerPhoneNumber: farmer.phoneNumber,
      farmerAddress: farmer.address,
      farmerMapLocation: farmer.mapLocation,

      // Buyer details
      buyerEmail: userData.email,
      buyerFullName: userData.fullName || userData.contactPerson || '',
      buyerCompanyName: userData.companyName || '',
      buyerPhoneNumber: userData.phoneNumber || '',

      // Product details
      productId: productId,
      productName: product?.title || '',
      productType: product?.type || '',
      productCategory: product?.category || '',
      pricePerUnit: matchedProduct?.PricePerUnit || 0,

      buyerNotes: buyerNotes.trim(),
    };

    try {
      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interactionData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(
          '✅ Interest expressed successfully! The farmer will be notified.'
        );
      } else {
        alert(result.message || 'Failed to express interest');
      }
    } catch (error) {
      console.error('Error expressing interest:', error);
      alert('Error expressing interest. Please try again.');
    }
  };

  // Handle Request Sample
  const handleRequestSample = async (farmer: Farmer) => {
    if (!isLoggedIn || !userData) {
      router.push('/login');
      return;
    }

    // Prompt for sample details
    const quantity = prompt('Enter desired sample quantity:');
    if (!quantity) return;

    const deliveryAddress = prompt('Enter delivery address for the sample:');
    if (!deliveryAddress) return;

    const notes = prompt('Any special requirements or notes (optional):') || '';

    // Find the matching product from farmer's relatedProduct array
    const matchedProduct = (farmer as any).relatedProduct?.find(
      (p: any) => p.productId === productId
    );

    const interactionData = {
      interactionType: 'request_sample',
      farmerId: farmer.farmerId || '',
      buyerId: userData.buyerId || userData.farmerId || '',

      // Farmer details
      farmerEmail: farmer.email,
      farmerContactPerson: farmer.contactPerson,
      farmerCompanyName: farmer.companyName,
      farmerPhoneNumber: farmer.phoneNumber,
      farmerAddress: farmer.address,
      farmerMapLocation: farmer.mapLocation,

      // Buyer details
      buyerEmail: userData.email,
      buyerFullName: userData.fullName || userData.contactPerson || '',
      buyerCompanyName: userData.companyName || '',
      buyerPhoneNumber: userData.phoneNumber || '',

      // Product details
      productId: productId,
      productName: product?.title || '',
      productType: product?.type || '',
      productCategory: product?.category || '',
      pricePerUnit: matchedProduct?.PricePerUnit || 0,

      sampleDetails: {
        quantity: quantity.trim(),
        address: deliveryAddress.trim(),
        notes: notes.trim(),
      },
      buyerNotes: notes.trim(),
    };

    try {
      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interactionData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(
          '✅ Sample request sent successfully! The farmer will respond soon.'
        );
      } else {
        alert(result.message || 'Failed to request sample');
      }
    } catch (error) {
      console.error('Error requesting sample:', error);
      alert('Error requesting sample. Please try again.');
    }
  };

  // Filter logic
  const applyFilters = useCallback(
    (farmers: Farmer[]) => {
      return farmers.filter((farmer) => {
        // GST Registration filter
        if (
          filters.gstRegistered &&
          farmer.gstRegistered.toString() !== filters.gstRegistered
        ) {
          return false;
        }

        // Company Registration filter
        if (
          filters.isRegisteredCompany &&
          farmer.isRegisteredCompany.toString() !== filters.isRegisteredCompany
        ) {
          return false;
        }

        // Availability filter
        if (filters.availability) {
          if (filters.availability === 'today' && !farmer.availability.today) {
            return false;
          }
          if (filters.availability === 'future' && farmer.availability.today) {
            return false;
          }
        }

        // Size filter
        if (filters.size && farmer.size !== filters.size) {
          return false;
        }

        // Organic Certificate filter
        if (filters.organicCertificate) {
          if (
            filters.organicCertificate === 'has' &&
            (!farmer.organicCertificate || farmer.organicCertificate === '')
          ) {
            return false;
          }
          if (
            filters.organicCertificate === 'none' &&
            farmer.organicCertificate &&
            farmer.organicCertificate !== ''
          ) {
            return false;
          }
        }

        // Contract Readiness filter
        if (
          filters.readyForContract &&
          farmer.readyForContract.toString() !== filters.readyForContract
        ) {
          return false;
        }

        // Price Range filter
        if (filters.priceRange) {
          const price = farmer.price;
          switch (filters.priceRange) {
            case '0-2':
              if (price < 0 || price > 2) return false;
              break;
            case '2-4':
              if (price < 2 || price > 4) return false;
              break;
            case '4-6':
              if (price < 4 || price > 6) return false;
              break;
            case '6+':
              if (price < 6) return false;
              break;
          }
        }

        // Organic Type filter
        if (filters.organic) {
          const hasOrganic =
            farmer.organicCertificate && farmer.organicCertificate !== '';
          if (filters.organic === 'organic' && !hasOrganic) return false;
          if (filters.organic === 'conventional' && hasOrganic) return false;
        }

        // Average Reviews filter
        if (filters.averageReviews) {
          const review = parseFloat(farmer.review) || 0;
          switch (filters.averageReviews) {
            case '5':
              if (review !== 5) return false;
              break;
            case '4+':
              if (review < 4) return false;
              break;
            case '3+':
              if (review < 3) return false;
              break;
            case '2+':
              if (review < 2) return false;
              break;
            case '1+':
              if (review < 1) return false;
              break;
          }
        }

        // Area filter
        if (filters.area) {
          const areaText = farmer.totalAreaOfCultivation || '';
          const areaMatch = areaText.match(/(\d+(?:\.\d+)?)/);
          const area = areaMatch ? parseFloat(areaMatch[1]) : 0;

          switch (filters.area) {
            case '0-5':
              if (area < 0 || area > 5) return false;
              break;
            case '5-15':
              if (area < 5 || area > 15) return false;
              break;
            case '15-50':
              if (area < 15 || area > 50) return false;
              break;
            case '50+':
              if (area < 50) return false;
              break;
          }
        }

        // Yield filter
        if (filters.yield) {
          const yieldText = farmer.totalYield || '';
          const yieldMatch = yieldText.match(/(\d+(?:,\d+)*)/);
          const yieldAmount = yieldMatch
            ? parseFloat(yieldMatch[1].replace(/,/g, ''))
            : 0;

          switch (filters.yield) {
            case '0-1000':
              if (yieldAmount < 0 || yieldAmount > 1000) return false;
              break;
            case '1000-5000':
              if (yieldAmount < 1000 || yieldAmount > 5000) return false;
              break;
            case '5000-15000':
              if (yieldAmount < 5000 || yieldAmount > 15000) return false;
              break;
            case '15000+':
              if (yieldAmount < 15000) return false;
              break;
          }
        }

        // District filter
        if (filters.district) {
          const address = farmer.address || '';
          const districtMatch = address
            .toLowerCase()
            .includes(filters.district.toLowerCase());
          if (!districtMatch && filters.district !== 'Other') return false;
          if (filters.district === 'Other') {
            const commonDistricts = [
              'karnal',
              'gurgaon',
              'faridabad',
              'panipat',
              'rohtak',
              'hisar',
              'sonipat',
              'ambala',
            ];
            const hasCommonDistrict = commonDistricts.some((district) =>
              address.toLowerCase().includes(district)
            );
            if (hasCommonDistrict) return false;
          }
        }

        // State filter
        if (filters.state) {
          const address = farmer.address || '';
          const stateMatch = address
            .toLowerCase()
            .includes(filters.state.toLowerCase());
          if (!stateMatch && filters.state !== 'Other') return false;
          if (filters.state === 'Other') {
            const commonStates = [
              'haryana',
              'punjab',
              'delhi',
              'uttar pradesh',
              'rajasthan',
              'himachal pradesh',
              'uttarakhand',
            ];
            const hasCommonState = commonStates.some((state) =>
              address.toLowerCase().includes(state)
            );
            if (hasCommonState) return false;
          }
        }

        return true;
      });
    },
    [filters]
  );

  const handleFilterChange = (
    filterKey: keyof typeof filters,
    value: string
  ) => {
    const newFilters = { ...filters, [filterKey]: value };
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      gstRegistered: '',
      isRegisteredCompany: '',
      availability: '',
      size: '',
      organicCertificate: '',
      readyForContract: '',
      priceRange: '',
      organic: '',
      averageReviews: '',
      area: '',
      yield: '',
      district: '',
      state: '',
    };
    setFilters(clearedFilters);
  };

  // Modal functions
  const openVideoModal = (videoUrl: string) => {
    setModalType('video');
    setModalContent(videoUrl);
    setModalOpen(true);
  };

  const openImageModal = (images: string[], startIndex: number = 0) => {
    setModalType('image');
    setModalImages(images);
    setCurrentModalImageIndex(startIndex);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalContent('');
    setModalImages([]);
    setCurrentModalImageIndex(0);
  };

  const nextModalImage = () => {
    setModalImageLoading(true);
    setCurrentModalImageIndex((prev) => (prev + 1) % modalImages.length);
  };

  const prevModalImage = () => {
    setModalImageLoading(true);
    setCurrentModalImageIndex(
      (prev) => (prev - 1 + modalImages.length) % modalImages.length
    );
  };

  useEffect(() => {
    if (!productId) return;
    setLoading(true);

    // Fetch both products and farmers data
    Promise.all([
      fetch('/api/products').then((res) => res.json()),
      fetch('/api/farmers').then((res) => res.json()),
    ])
      .then(([productsData, farmersResponse]) => {
        // Find the specific product by productId
        const foundProduct = (productsData as Product[]).find(
          (p: Product) => p.productId === productId
        );

        if (!foundProduct) {
          setLoading(false);
          return;
        }

        // Extract farmers data from the response
        const farmersData = farmersResponse.data || [];

        // Find farmers that have this productId in their relatedProduct array
        const associatedFarmers = (farmersData as Farmer[]).filter(
          (farmer: Farmer) => {
            return (
              farmer.relatedProduct &&
              farmer.relatedProduct.some(
                (product: { productId: string }) =>
                  product.productId === productId
              )
            );
          }
        );

        // Create the combined product object with associated farmers
        const productWithFarmers = {
          ...foundProduct,
          farmers: associatedFarmers,
        };

        setProduct(productWithFarmers);
        setFilteredFarmers(associatedFarmers);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setLoading(false);
      });
  }, [productId]);

  // Apply filters when filters change or product changes
  useEffect(() => {
    if (product && product.farmers) {
      const filtered = applyFilters(product.farmers);
      setFilteredFarmers(filtered);
    }
  }, [filters, product]);

  // Sticky filter logic
  useEffect(() => {
    let originalFilterTop = 0;

    const handleScroll = () => {
      const filterElement = document.getElementById('filter-section');
      if (filterElement) {
        // Store the original position when not sticky
        if (!isFilterSticky && originalFilterTop === 0) {
          const rect = filterElement.getBoundingClientRect();
          originalFilterTop = rect.top + window.scrollY;
        }

        const currentScrollY = window.scrollY;

        // Check if we should be sticky (scrolled past original position)
        const shouldBeSticky = currentScrollY > originalFilterTop;

        // Reset to non-sticky if scrolled back above original position or at top
        const shouldResetSticky =
          currentScrollY <= originalFilterTop || currentScrollY <= 10;

        if (shouldResetSticky && isFilterSticky) {
          setIsFilterSticky(false);
          originalFilterTop = 0; // Reset for next calculation
        } else if (shouldBeSticky && !isFilterSticky) {
          setIsFilterSticky(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isFilterSticky]);

  if (loading) {
    return <div style={{ padding: '2rem', color: '#388e3c' }}>Loading...</div>;
  }

  if (!product) {
    return (
      <div style={{ padding: '2rem', color: '#d84315' }}>
        Product not found.
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#f1f8e9',
        minHeight: '100vh',
        fontFamily: 'Arial, Georgia, serif',
      }}
    >
      <Header />
      <div style={{ padding: '2rem' }}>
        <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
          background: white;
          border-radius: 12px;
          padding: 1rem;
        }
        .modal-image-container {
          width: 75vw;
          max-height: 80vh;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .modal-close {
          position: absolute;
          top: -10px;
          right: -10px;
          background: #d84315;
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          cursor: pointer;
          font-size: 20px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1001;
        }
        .filter-sticky {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 999;
          background: #e8f5e9;
          border-bottom: 2px solid #c8e6c9;
          box-shadow: 0 4px 12px rgba(200, 230, 201, 0.5);
          padding: 1rem 2rem;
        }
        .filter-placeholder {
          height: 120px;
        }
        @media (max-width: 1024px) {
          .farmer-header-grid {
            grid-template-columns: auto 1fr auto !important;
            gap: 1rem !important;
          }
          .farmer-sections {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .farmer-info-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.75rem !important;
          }
        }
        @media (max-width: 768px) {
          .farmer-header-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
            text-align: center;
          }
          .farmer-contact-box {
            max-width: 400px;
            margin: 0 auto;
          }
          .farmer-info-grid {
            grid-template-columns: 1fr !important;
            gap: 0.5rem !important;
          }
        }
      `}</style>
        <div
          style={{
            background: '#fffde7',
            borderRadius: '12px',
            boxShadow: '0 2px 8px #c8e6c9',
            padding: '2rem',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto auto',
              gap: '2rem',
              alignItems: 'flex-start',
            }}
          >
            {/* Column 1 - Product Information */}
            <div>
              {/* Edit/Save/Cancel Buttons - Only for admin/owner */}
              {userData &&
                (userData.userType === 'admin' ||
                  userData.userType === 'owner') && (
                  <div
                    style={{
                      marginBottom: '1rem',
                      display: 'flex',
                      gap: '0.5rem',
                    }}
                  >
                    {!isEditMode ? (
                      <button
                        onClick={handleEditClick}
                        style={{
                          background: '#2196f3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.5rem 1rem',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        ✏️ EDIT
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleSaveProduct}
                          disabled={isSaving}
                          style={{
                            background: isSaving ? '#cccccc' : '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.5rem 1rem',
                            cursor: isSaving ? 'not-allowed' : 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          {isSaving ? '⏳ Saving...' : '💾 SAVE'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          style={{
                            background: '#757575',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.5rem 1rem',
                            cursor: isSaving ? 'not-allowed' : 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                          }}
                        >
                          ✕ CANCEL
                        </button>
                      </>
                    )}
                  </div>
                )}

              {/* Product Title */}
              {!isEditMode ? (
                <h1
                  style={{
                    color: '#388e3c',
                    fontSize: '2.5rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  {product.title}
                </h1>
              ) : (
                <input
                  type='text'
                  value={editedProduct?.title || ''}
                  onChange={(e) =>
                    handleProductFieldChange('title', e.target.value)
                  }
                  style={{
                    color: '#388e3c',
                    fontSize: '2.5rem',
                    marginBottom: '0.5rem',
                    border: '2px solid #388e3c',
                    borderRadius: '6px',
                    padding: '0.25rem 0.5rem',
                    width: '100%',
                    fontWeight: 'bold',
                  }}
                />
              )}

              {/* Product Type */}
              {!isEditMode ? (
                <span
                  style={{
                    display: 'inline-block',
                    background: '#e8f5e9',
                    color: '#388e3c',
                    borderRadius: '6px',
                    padding: '0.25rem 0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  {product.type}
                </span>
              ) : (
                <select
                  value={editedProduct?.type || ''}
                  onChange={(e) =>
                    handleProductFieldChange('type', e.target.value)
                  }
                  style={{
                    background: '#e8f5e9',
                    color: '#388e3c',
                    borderRadius: '6px',
                    padding: '0.25rem 0.75rem',
                    fontWeight: 'bold',
                    border: '2px solid #388e3c',
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value='grain'>grain</option>
                  <option value='vegetable'>vegetable</option>
                  <option value='fruit'>fruit</option>
                  <option value='spice'>spice</option>
                  <option value='pulse'>pulse</option>
                  <option value='dry fruit'>dry fruit</option>
                  <option value='oil seed'>oil seed</option>
                  <option value='dairy'>dairy</option>
                  <option value='other'>other</option>
                </select>
              )}

              {/* Product Price */}
              <div style={{ margin: '1rem 0' }}>
                {!isEditMode ? (
                  <strong style={{ color: '#388e3c', fontSize: '1.25rem' }}>
                    Price: ₹{product.price}
                  </strong>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <strong style={{ color: '#388e3c', fontSize: '1.25rem' }}>
                      Price: ₹
                    </strong>
                    <input
                      type='text'
                      value={editedProduct?.price || ''}
                      onChange={(e) =>
                        handleProductFieldChange('price', e.target.value)
                      }
                      style={{
                        color: '#388e3c',
                        fontSize: '1.25rem',
                        border: '2px solid #388e3c',
                        borderRadius: '6px',
                        padding: '0.25rem 0.5rem',
                        width: '150px',
                        fontWeight: 'bold',
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Product Description */}
              {!isEditMode ? (
                <div style={{ marginBottom: '1rem', color: '#6d4c41' }}>
                  {product.description}
                </div>
              ) : (
                <textarea
                  value={editedProduct?.description || ''}
                  onChange={(e) =>
                    handleProductFieldChange('description', e.target.value)
                  }
                  style={{
                    marginBottom: '1rem',
                    color: '#6d4c41',
                    border: '2px solid #388e3c',
                    borderRadius: '6px',
                    padding: '0.5rem',
                    width: '100%',
                    minHeight: '100px',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              )}

              {/* ADD Farmer Button - hide if user already registered */}
              {!hasUserAlreadyRegistered() && (
                <button
                  style={{
                    background: 'linear-gradient(45deg, #388e3c, #2e7d32)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '1rem 2rem',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(56, 142, 60, 0.3)',
                    transition: 'all 0.3s ease',
                    marginTop: '1.5rem',
                    minWidth: '200px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow =
                      '0 6px 16px rgba(56, 142, 60, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow =
                      '0 4px 12px rgba(56, 142, 60, 0.3)';
                  }}
                  onClick={handleAddFarmerClick}
                >
                  👨‍🌾 ADD Farmer
                </button>
              )}
            </div>

            {/* Column 2 - Product Images Carousel */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {/* Main Image Display */}
              <div
                style={{
                  position: 'relative',
                  width: '320px',
                  height: '240px',
                }}
              >
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[currentImageIndex]}
                    alt={`${product.title} ${currentImageIndex + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #c8e6c9',
                      opacity: imageLoading ? 0.3 : 1,
                      transition: 'opacity 0.3s ease',
                    }}
                    onLoad={() => setImageLoading(false)}
                    onError={(e) => {
                      e.currentTarget.src = '/images/fallback-image.png';
                      setImageLoading(false);
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: '#e8f5e9',
                      borderRadius: '8px',
                      border: '1px solid #c8e6c9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '4rem',
                    }}
                  >
                    🌾
                  </div>
                )}

                {/* Loading Spinner */}
                {imageLoading && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 5,
                    }}
                  >
                    <div
                      className='spinner'
                      style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #c8e6c9',
                        borderTop: '4px solid #388e3c',
                        borderRadius: '50%',
                      }}
                    ></div>
                  </div>
                )}

                {/* Navigation Arrows - Only show if more than one image */}
                {product.images && product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      style={{
                        position: 'absolute',
                        left: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: 'white',
                        border: '2px solid white',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.2s ease',
                        zIndex: 10,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)';
                        e.currentTarget.style.transform =
                          'translateY(-50%) scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
                        e.currentTarget.style.transform =
                          'translateY(-50%) scale(1)';
                      }}
                    >
                      ◀
                    </button>

                    <button
                      onClick={nextImage}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: 'white',
                        border: '2px solid white',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.2s ease',
                        zIndex: 10,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)';
                        e.currentTarget.style.transform =
                          'translateY(-50%) scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
                        e.currentTarget.style.transform =
                          'translateY(-50%) scale(1)';
                      }}
                    >
                      ▶
                    </button>
                  </>
                )}
              </div>

              {/* Image Indicators - Only show if more than one image */}
              {product.images && product.images.length > 1 && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  {Array.from({ length: totalImages }, (_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        border: 'none',
                        background:
                          idx === currentImageIndex ? '#388e3c' : '#c8e6c9',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Column 3 - Product Video (only show if videos exist) */}
            {product.videos && product.videos.length > 0 && (
              <div>
                <video
                  width='320'
                  height='240'
                  controls
                  style={{ borderRadius: '8px', border: '1px solid #c8e6c9' }}
                >
                  <source
                    src={product.videos[0]}
                    type='video/mp4'
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            background: '#e8f5e9',
            borderRadius: '12px',
            boxShadow: '0 2px 8px #c8e6c9',
            padding: '2rem',
          }}
        >
          <h2
            style={{ color: '#388e3c', fontSize: '2rem', marginBottom: '1rem' }}
          >
            Associated Farmers
          </h2>

          {/* Filter Section with Sticky Behavior */}
          <div
            id='filter-section'
            className={isFilterSticky ? 'filter-sticky' : ''}
          >
            <FarmerFilter
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              isSticky={isFilterSticky}
            />
          </div>

          {/* Placeholder to maintain layout when filter becomes sticky */}
          {isFilterSticky && <div className='filter-placeholder'></div>}

          {/* Results Summary */}
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              background: '#f1f8e9',
              borderRadius: '4px',
              border: '1px solid #c8e6c9',
            }}
          >
            <span style={{ color: '#388e3c', fontWeight: 'bold' }}>
              Showing {filteredFarmers.length} of{' '}
              {product?.farmers?.length ?? 0} farmers
            </span>
          </div>

          {filteredFarmers && filteredFarmers.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {filteredFarmers.map((farmer: Farmer, idx: number) => (
                <li
                  key={idx}
                  style={{
                    background: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    padding: '1.5rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {/* Header Section - Single Row Layout */}
                  <div
                    className='farmer-header-grid'
                    style={{
                      display: 'grid',
                      gridTemplateColumns: (() => {
                        const isBuyerAdminOwner =
                          isLoggedIn &&
                          userData &&
                          (userData.userType === 'buyer' ||
                            userData.userType === 'admin' ||
                            userData.userType === 'owner');
                        const canEdit = canEditFarmer(farmer);

                        // Base columns: farmer info, price, contact, location, video, photos
                        // + Edit & Delete if canEdit (2 columns)
                        // + Shortlist, Express Interest, Request Sample if buyer/admin/owner (3 columns)
                        if (canEdit && isBuyerAdminOwner) {
                          return 'auto 1fr auto auto auto auto auto auto auto auto auto';
                        } else if (canEdit) {
                          return 'auto 1fr auto auto auto auto auto auto';
                        } else if (isBuyerAdminOwner) {
                          return 'auto 1fr auto auto auto auto auto auto auto';
                        } else {
                          return 'auto 1fr auto auto auto auto';
                        }
                      })(),
                      gap: '1.5rem',
                      alignItems: 'center',
                      marginBottom: '2rem',
                      paddingBottom: '1.5rem',
                      borderBottom: '1px solid #e0e0e0',
                    }}
                  >
                    {/* 1. Farmer Information */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        minWidth: '140px',
                      }}
                    >
                      <img
                        src={getFarmerImage(farmer.contactPerson || 'farmer')}
                        alt={farmer.contactPerson}
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '50%',
                          border: '3px solid #388e3c',
                        }}
                        onError={(e) => {
                          e.currentTarget.src = '/images/fallback-image.png';
                        }}
                      />
                      <div style={{ textAlign: 'center' }}>
                        <div
                          style={{
                            color: '#333',
                            fontSize: '1rem',
                            fontWeight: '600',
                            marginBottom: '0.25rem',
                          }}
                        >
                          {farmer.contactPerson}
                        </div>
                        <div
                          style={{
                            color: '#666',
                            fontSize: '0.8rem',
                            marginBottom: '0.25rem',
                          }}
                        >
                          {farmer.companyName}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.25rem',
                            fontSize: '0.8rem',
                            color: '#666',
                          }}
                        >
                          <span>⭐</span>
                          <span>{farmer.review}</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Price */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          background: '#388e3c',
                          color: 'white',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '8px',
                          fontSize: '1.2rem',
                          fontWeight: '700',
                          textAlign: 'center',
                          boxShadow: '0 2px 8px rgba(56, 142, 60, 0.3)',
                        }}
                      >
                        ₹
                        {(() => {
                          // Find the matching product in relatedProduct array
                          const relatedProduct = farmer.relatedProduct?.find(
                            (p: any) => p.productId === productId
                          );
                          // Return PricePerUnit if found, otherwise fallback to farmer.price
                          return (
                            relatedProduct?.PricePerUnit ?? farmer.price ?? 0
                          );
                        })()}
                        /kg
                      </div>
                    </div>

                    {/* 3. Contact Information */}
                    <div
                      style={{
                        background: '#f8f9fa',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef',
                        minWidth: '220px',
                      }}
                    >
                      {revealedContacts.has(idx) || canEditFarmer(farmer) ? (
                        // Show full contact details (for buyers who revealed, admins/owners, or the farmer who created it)
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                            }}
                          >
                            <span style={{ fontSize: '1rem' }}>📞</span>
                            <a
                              href={`tel:${farmer.phoneNumber || 'N/A'}`}
                              style={{
                                color: '#007bff',
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                              }}
                            >
                              {farmer.phoneNumber || 'Not provided'}
                            </a>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                            }}
                          >
                            <span style={{ fontSize: '1rem' }}>✉️</span>
                            <a
                              href={`mailto:${farmer.email || ''}`}
                              style={{
                                color: '#007bff',
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                                wordBreak: 'break-word',
                              }}
                            >
                              {farmer.email || 'Not provided'}
                            </a>
                          </div>
                        </div>
                      ) : (
                        // Show masked contact details with reveal button
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.5rem',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                              }}
                            >
                              <span style={{ fontSize: '1rem' }}>📞</span>
                              <span
                                style={{
                                  color: '#666',
                                  fontSize: '0.9rem',
                                }}
                              >
                                {maskPhone(farmer.phoneNumber || '')}
                              </span>
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                              }}
                            >
                              <span style={{ fontSize: '1rem' }}>✉️</span>
                              <span
                                style={{
                                  color: '#666',
                                  fontSize: '0.9rem',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {maskEmail(farmer.email || '')}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRevealContact(idx)}
                            style={{
                              background: '#388e3c',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '0.5rem 0.75rem',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              transition: 'all 0.3s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#2e7d32';
                              e.currentTarget.style.transform =
                                'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#388e3c';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            🔓 View Complete Details
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 4. Address */}
                    <div
                      style={{
                        background: '#f8f9fa',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef',
                        textAlign: 'center',
                        minWidth: '180px',
                      }}
                    >
                      <div
                        style={{
                          marginBottom: '0.5rem',
                          fontSize: '0.9rem',
                          color: '#333',
                        }}
                      >
                        📍{' '}
                        {farmer.address?.split(',')[0] ||
                          'Location not provided'}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          justifyContent: 'center',
                        }}
                      >
                        <a
                          href={`https://www.google.com/maps?q=${
                            farmer.mapLocation?.lat || 0
                          },${farmer.mapLocation?.lng || 0}`}
                          onClick={(e) =>
                            handleProtectedLink(
                              e,
                              `https://www.google.com/maps?q=${
                                farmer.mapLocation?.lat || 0
                              },${farmer.mapLocation?.lng || 0}`
                            )
                          }
                          target='_blank'
                          rel='noopener noreferrer'
                          style={{
                            color: '#007bff',
                            textDecoration: 'none',
                            fontSize: '0.8rem',
                            padding: '0.25rem 0.5rem',
                            background: 'white',
                            borderRadius: '4px',
                            border: '1px solid #e0e0e0',
                            cursor: 'pointer',
                          }}
                        >
                          🗺️ Map
                        </a>
                        {farmer.organicCertificate && (
                          <a
                            href={farmer.organicCertificate}
                            onClick={(e) =>
                              handleProtectedLink(
                                e,
                                farmer.organicCertificate || ''
                              )
                            }
                            target='_blank'
                            rel='noopener noreferrer'
                            style={{
                              color: '#388e3c',
                              textDecoration: 'none',
                              fontSize: '0.8rem',
                              padding: '0.25rem 0.5rem',
                              background: '#f1f8e9',
                              borderRadius: '4px',
                              border: '1px solid #c8e6c9',
                              cursor: 'pointer',
                            }}
                          >
                            🌱 Cert
                          </a>
                        )}
                      </div>
                    </div>

                    {/* 5. Video */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                      }}
                    >
                      <button
                        onClick={() =>
                          openVideoModal(
                            getProductVideo(farmer.contactPerson || 'farmer')
                          )
                        }
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.75rem 1rem',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          boxShadow: '0 2px 8px rgba(220, 53, 69, 0.3)',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow =
                            '0 4px 12px rgba(220, 53, 69, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow =
                            '0 2px 8px rgba(220, 53, 69, 0.3)';
                        }}
                      >
                        🎥 Video
                      </button>
                    </div>

                    {/* 6. Photos */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                      }}
                    >
                      <button
                        onClick={() => {
                          const images = Array.from({ length: 3 }, (_, i) =>
                            getFarmerImage(farmer.contactPerson + i)
                          );
                          openImageModal(images, 0);
                        }}
                        style={{
                          background: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.75rem 1rem',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          boxShadow: '0 2px 8px rgba(0, 123, 255, 0.3)',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow =
                            '0 4px 12px rgba(0, 123, 255, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow =
                            '0 2px 8px rgba(0, 123, 255, 0.3)';
                        }}
                      >
                        📸 Photos
                      </button>
                    </div>

                    {/* 7. Edit Button - Only for admin, owner, or the farmer who created this */}
                    {canEditFarmer(farmer) && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                        }}
                      >
                        <button
                          onClick={() => handleEditFarmer(farmer)}
                          style={{
                            background: '#ff9800',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform =
                              'translateY(-2px)';
                            e.currentTarget.style.boxShadow =
                              '0 4px 12px rgba(255, 152, 0, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow =
                              '0 2px 8px rgba(255, 152, 0, 0.3)';
                          }}
                        >
                          ✏️ EDIT
                        </button>
                      </div>
                    )}

                    {/* 8. Delete Button - Only for admin, owner, or the farmer who created this */}
                    {canEditFarmer(farmer) && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                        }}
                      >
                        <button
                          onClick={() => handleDeleteFarmer(farmer)}
                          style={{
                            background: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            boxShadow: '0 2px 8px rgba(244, 67, 54, 0.3)',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform =
                              'translateY(-2px)';
                            e.currentTarget.style.boxShadow =
                              '0 4px 12px rgba(244, 67, 54, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow =
                              '0 2px 8px rgba(244, 67, 54, 0.3)';
                          }}
                        >
                          🗑️ DELETE
                        </button>
                      </div>
                    )}

                    {/* 9. Shortlist Button - Only for buyer, admin, owner */}
                    {isLoggedIn &&
                      userData &&
                      (userData.userType === 'buyer' ||
                        userData.userType === 'admin' ||
                        userData.userType === 'owner') && (
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                          }}
                        >
                          <button
                            onClick={() => handleShortlist(farmer)}
                            style={{
                              background: '#9c27b0',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '0.75rem 1rem',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              boxShadow: '0 2px 8px rgba(156, 39, 176, 0.3)',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform =
                                'translateY(-2px)';
                              e.currentTarget.style.boxShadow =
                                '0 4px 12px rgba(156, 39, 176, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow =
                                '0 2px 8px rgba(156, 39, 176, 0.3)';
                            }}
                          >
                            ⭐ Shortlist
                          </button>
                        </div>
                      )}

                    {/* 10. Express Interest Button - Only for buyer, admin, owner */}
                    {isLoggedIn &&
                      userData &&
                      (userData.userType === 'buyer' ||
                        userData.userType === 'admin' ||
                        userData.userType === 'owner') && (
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                          }}
                        >
                          <button
                            onClick={() => handleExpressInterest(farmer)}
                            style={{
                              background: '#00bcd4',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '0.75rem 1rem',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              boxShadow: '0 2px 8px rgba(0, 188, 212, 0.3)',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform =
                                'translateY(-2px)';
                              e.currentTarget.style.boxShadow =
                                '0 4px 12px rgba(0, 188, 212, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow =
                                '0 2px 8px rgba(0, 188, 212, 0.3)';
                            }}
                          >
                            💼 Express Interest
                          </button>
                        </div>
                      )}

                    {/* 11. Request Sample Button - Only for buyer, admin, owner */}
                    {isLoggedIn &&
                      userData &&
                      (userData.userType === 'buyer' ||
                        userData.userType === 'admin' ||
                        userData.userType === 'owner') && (
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                          }}
                        >
                          <button
                            onClick={() => handleRequestSample(farmer)}
                            style={{
                              background: '#ff5722',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '0.75rem 1rem',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              boxShadow: '0 2px 8px rgba(255, 87, 34, 0.3)',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform =
                                'translateY(-2px)';
                              e.currentTarget.style.boxShadow =
                                '0 4px 12px rgba(255, 87, 34, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow =
                                '0 2px 8px rgba(255, 87, 34, 0.3)';
                            }}
                          >
                            📦 Request Sample
                          </button>
                        </div>
                      )}
                  </div>

                  {/* Information Grid - Single Row Layout */}
                  <div
                    className='farmer-info-grid'
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '1rem',
                      marginTop: '1rem',
                    }}
                  >
                    {/* Farm Details */}
                    <div
                      style={{
                        background: '#f8f9fa',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      }}
                    >
                      <h4
                        style={{
                          color: '#495057',
                          margin: '0 0 0.75rem 0',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          borderBottom: '1px solid #e9ecef',
                          paddingBottom: '0.5rem',
                          textAlign: 'center',
                        }}
                      >
                        🚜 Farm Details
                      </h4>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{ fontSize: '0.8rem', color: '#6c757d' }}
                          >
                            Area:
                          </span>
                          <span
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              color: '#495057',
                            }}
                          >
                            {farmer.totalAreaOfCultivation}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{ fontSize: '0.8rem', color: '#6c757d' }}
                          >
                            Yield:
                          </span>
                          <span
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              color: '#495057',
                            }}
                          >
                            {farmer.totalYield}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{ fontSize: '0.8rem', color: '#6c757d' }}
                          >
                            Size:
                          </span>
                          <span
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              color: '#495057',
                              padding: '0.2rem 0.4rem',
                              background: '#e8f5e9',
                              borderRadius: '3px',
                              border: '1px solid #c8e6c9',
                            }}
                          >
                            {farmer.size}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Compliance */}
                    <div
                      style={{
                        background: '#f8f9fa',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      }}
                    >
                      <h4
                        style={{
                          color: '#495057',
                          margin: '0 0 0.75rem 0',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          borderBottom: '1px solid #e9ecef',
                          paddingBottom: '0.5rem',
                          textAlign: 'center',
                        }}
                      >
                        📋 Compliance
                      </h4>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{ fontSize: '0.8rem', color: '#6c757d' }}
                          >
                            GST:
                          </span>
                          <span style={{ fontSize: '1rem' }}>
                            {farmer.gstRegistered ? '✅' : '❌'}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{ fontSize: '0.8rem', color: '#6c757d' }}
                          >
                            Company:
                          </span>
                          <span style={{ fontSize: '1rem' }}>
                            {farmer.isRegisteredCompany ? '✅' : '❌'}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{ fontSize: '0.8rem', color: '#6c757d' }}
                          >
                            Contract:
                          </span>
                          <span style={{ fontSize: '1rem' }}>
                            {farmer.readyForContract ? '✅' : '❌'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Availability */}
                    <div
                      style={{
                        background: '#f8f9fa',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      }}
                    >
                      <h4
                        style={{
                          color: '#495057',
                          margin: '0 0 0.75rem 0',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          borderBottom: '1px solid #e9ecef',
                          paddingBottom: '0.5rem',
                          textAlign: 'center',
                        }}
                      >
                        📅 Availability
                      </h4>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{ fontSize: '0.8rem', color: '#6c757d' }}
                          >
                            Today:
                          </span>
                          <span style={{ fontSize: '1rem' }}>
                            {farmer.availability.today ? '✅' : '❌'}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <span
                            style={{ fontSize: '0.8rem', color: '#6c757d' }}
                          >
                            Expected:
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              color: '#495057',
                              padding: '0.2rem 0.4rem',
                              background: '#fff3cd',
                              borderRadius: '3px',
                              border: '1px solid #ffeaa7',
                              textAlign: 'center',
                            }}
                          >
                            {farmer.availability.expectedDate
                              ? new Date(
                                  farmer.availability.expectedDate
                                ).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'Not specified'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Performance */}
                    <div
                      style={{
                        background: '#f8f9fa',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      }}
                    >
                      <h4
                        style={{
                          color: '#495057',
                          margin: '0 0 0.75rem 0',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          borderBottom: '1px solid #e9ecef',
                          paddingBottom: '0.5rem',
                          textAlign: 'center',
                        }}
                      >
                        📊 Performance
                      </h4>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{ fontSize: '0.8rem', color: '#6c757d' }}
                          >
                            Deliveries:
                          </span>
                          <span
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              color: '#28a745',
                              padding: '0.2rem 0.4rem',
                              background: '#d4edda',
                              borderRadius: '3px',
                              border: '1px solid #c3e6cb',
                            }}
                          >
                            {farmer.totalSuccessForDelivery}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{ fontSize: '0.8rem', color: '#6c757d' }}
                          >
                            Withdrawals:
                          </span>
                          <span
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              color: '#dc3545',
                              padding: '0.2rem 0.4rem',
                              background: '#f8d7da',
                              borderRadius: '3px',
                              border: '1px solid #f5c6cb',
                            }}
                          >
                            {farmer.totalContractWithdrawal}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '2rem',
                background: '#fff3e0',
                borderRadius: '8px',
                border: '1px solid #ffcc80',
              }}
            >
              <p style={{ color: '#d84315', fontSize: '1.1rem', margin: 0 }}>
                {(product?.farmers?.length ?? 0) > 0
                  ? 'No farmers match the selected filters. Try adjusting your criteria.'
                  : 'No farmers associated with this product.'}
              </p>
            </div>
          )}
        </div>

        {/* Modal Component */}
        {modalOpen && (
          <div
            className='modal-overlay'
            onClick={closeModal}
          >
            <div
              className='modal-content'
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className='modal-close'
                onClick={closeModal}
              >
                ×
              </button>

              {modalType === 'video' && (
                <video
                  width='800'
                  height='450'
                  controls
                  autoPlay
                  style={{
                    maxWidth: '100%',
                    maxHeight: '80vh',
                    borderRadius: '8px',
                  }}
                >
                  <source
                    src={modalContent}
                    type='video/mp4'
                  />
                  Your browser does not support the video tag.
                </video>
              )}

              {modalType === 'image' && modalImages.length > 0 && (
                <div className='modal-image-container'>
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    <img
                      src={modalImages[currentModalImageIndex]}
                      alt={`Image ${currentModalImageIndex + 1}`}
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '75vh',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        opacity: modalImageLoading ? 0.3 : 1,
                        transition: 'opacity 0.3s ease',
                      }}
                      onLoad={() => setModalImageLoading(false)}
                      onError={(e) => {
                        e.currentTarget.src = '/images/fallback-image.png';
                        setModalImageLoading(false);
                      }}
                    />

                    {/* Image Loading Spinner */}
                    {modalImageLoading && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          zIndex: 5,
                        }}
                      >
                        <div
                          className='spinner'
                          style={{
                            width: '60px',
                            height: '60px',
                            border: '6px solid #c8e6c9',
                            borderTop: '6px solid #388e3c',
                            borderRadius: '50%',
                          }}
                        ></div>
                      </div>
                    )}

                    {/* Image Navigation */}
                    {modalImages.length > 1 && (
                      <>
                        <button
                          onClick={prevModalImage}
                          style={{
                            position: 'absolute',
                            left: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0, 0, 0, 0.8)',
                            color: 'white',
                            border: '2px solid white',
                            borderRadius: '50%',
                            width: '50px',
                            height: '50px',
                            cursor: 'pointer',
                            fontSize: '20px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10,
                          }}
                        >
                          ◀
                        </button>

                        <button
                          onClick={nextModalImage}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0, 0, 0, 0.8)',
                            color: 'white',
                            border: '2px solid white',
                            borderRadius: '50%',
                            width: '50px',
                            height: '50px',
                            cursor: 'pointer',
                            fontSize: '20px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10,
                          }}
                        >
                          ▶
                        </button>
                      </>
                    )}

                    {/* Image Indicators */}
                    {modalImages.length > 1 && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '20px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          gap: '8px',
                        }}
                      >
                        {modalImages.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setModalImageLoading(true);
                              setCurrentModalImageIndex(idx);
                            }}
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              border: '2px solid white',
                              background:
                                idx === currentModalImageIndex
                                  ? 'white'
                                  : 'transparent',
                              cursor: 'pointer',
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Image Counter */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.9rem',
                      }}
                    >
                      {currentModalImageIndex + 1} / {modalImages.length}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Access Denied Modal */}
        {accessDeniedModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 10000,
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => setAccessDeniedModal(false)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2.5rem',
                maxWidth: '500px',
                width: '90%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                animation: 'modalSlideIn 0.3s ease-out',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <style>{`
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
              `}</style>

              {/* Icon and Title */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
                <h2
                  style={{
                    color: '#d32f2f',
                    fontSize: '1.8rem',
                    margin: 0,
                    fontWeight: 'bold',
                  }}
                >
                  Access Denied
                </h2>
              </div>

              {/* Message Content */}
              <div
                style={{
                  background: '#ffebee',
                  border: '2px solid #ffcdd2',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                }}
              >
                {accessDeniedMessage === 'only-farmers' ? (
                  <>
                    <p
                      style={{
                        color: '#6d4c41',
                        fontSize: '1rem',
                        margin: '0 0 1rem 0',
                        lineHeight: '1.6',
                      }}
                    >
                      This feature is only available for{' '}
                      <strong>farmers</strong>.
                      {userData?.userType && (
                        <>
                          {' '}
                          You are currently registered as a{' '}
                          <strong>{userData.userType}</strong>.
                        </>
                      )}
                    </p>
                    <p
                      style={{
                        color: '#6d4c41',
                        fontSize: '1rem',
                        margin: 0,
                        lineHeight: '1.6',
                      }}
                    >
                      Please register as a farmer to add your products and
                      connect with buyers.
                    </p>
                  </>
                ) : accessDeniedMessage === 'only-buyers' ? (
                  <>
                    <p
                      style={{
                        color: '#6d4c41',
                        fontSize: '1rem',
                        margin: '0 0 1rem 0',
                        lineHeight: '1.6',
                      }}
                    >
                      Viewing complete contact details is only available for{' '}
                      <strong>buyers</strong>.
                      {userData?.userType && (
                        <>
                          {' '}
                          You are currently registered as a{' '}
                          <strong>{userData.userType}</strong>.
                        </>
                      )}
                    </p>
                    <p
                      style={{
                        color: '#6d4c41',
                        fontSize: '1rem',
                        margin: 0,
                        lineHeight: '1.6',
                      }}
                    >
                      Please register as a buyer to view full contact
                      information and connect with farmers.
                    </p>
                  </>
                ) : accessDeniedMessage === 'not-verified-buyer' ? (
                  <>
                    <p
                      style={{
                        color: '#6d4c41',
                        fontSize: '1rem',
                        margin: '0 0 1rem 0',
                        lineHeight: '1.6',
                      }}
                    >
                      Your account verification is <strong>pending</strong> or{' '}
                      <strong>incomplete</strong>.
                    </p>
                    <p
                      style={{
                        color: '#6d4c41',
                        fontSize: '1rem',
                        margin: 0,
                        lineHeight: '1.6',
                      }}
                    >
                      To view farmer contact details, you must complete both{' '}
                      <strong>email verification</strong> and{' '}
                      <strong>document verification</strong>.
                    </p>
                  </>
                ) : (
                  <>
                    <p
                      style={{
                        color: '#6d4c41',
                        fontSize: '1rem',
                        margin: '0 0 1rem 0',
                        lineHeight: '1.6',
                      }}
                    >
                      Your account verification is <strong>pending</strong> or{' '}
                      <strong>incomplete</strong>.
                    </p>
                    <p
                      style={{
                        color: '#6d4c41',
                        fontSize: '1rem',
                        margin: 0,
                        lineHeight: '1.6',
                      }}
                    >
                      Please complete your document verification to access this
                      feature.
                    </p>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                {accessDeniedMessage === 'only-farmers' ? (
                  <>
                    <button
                      onClick={() => {
                        window.location.href = '/register';
                      }}
                      style={{
                        background: 'linear-gradient(45deg, #388e3c, #2e7d32)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '1rem 1.5rem',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow =
                          '0 6px 16px rgba(56, 142, 60, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      👨‍🌾 Register as Farmer
                    </button>
                  </>
                ) : accessDeniedMessage === 'not-verified-buyer' ? (
                  <>
                    <button
                      onClick={() => {
                        router.push('/verification');
                      }}
                      style={{
                        background: 'linear-gradient(45deg, #ff9800, #f57c00)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '1rem 1.5rem',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow =
                          '0 6px 16px rgba(255, 152, 0, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      ✅ Complete Verification
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        window.location.href = '/verification';
                      }}
                      style={{
                        background: 'linear-gradient(45deg, #388e3c, #2e7d32)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '1rem 1.5rem',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow =
                          '0 6px 16px rgba(56, 142, 60, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      📋 Verify Documents
                    </button>
                  </>
                )}

                <button
                  onClick={() => setAccessDeniedModal(false)}
                  style={{
                    background: '#f5f5f5',
                    color: '#757575',
                    border: '2px solid #e0e0e0',
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
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
