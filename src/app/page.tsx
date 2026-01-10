'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from './components/Header';
import Footer from './components/Footer';

// Types
type Product = {
  _id: { $oid: string };
  title: string;
  type: string;
  category: string;
  images: string[];
  videos: string[];
  description: string;
  price: { $numberDouble: string };
  productId: string;
};

// Search Component
const Search = ({
  onSearch,
  onTypeChange,
  selectedType,
  availableTypes,
}: {
  onSearch: (query: string) => void;
  onTypeChange: (type: string) => void;
  selectedType: string;
  availableTypes: string[];
}) => {
  const [query, setQuery] = useState('');
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onSearch(e.target.value);
  };
  return (
    <section style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <select
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value)}
          style={{
            padding: '0.75rem',
            paddingRight: '2.5rem',
            minWidth: '200px',
            height: '48px',
            border: '2px solid #388e3c',
            borderRadius: '8px',
            background: '#fafff5',
            color: '#333',
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          <option value=''>All Types</option>
          {availableTypes.map((type) => (
            <option
              key={type}
              value={type}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
        <input
          type='text'
          placeholder='Search products...'
          value={query}
          onChange={handleChange}
          style={{
            padding: '0.75rem',
            flex: 1,
            height: '48px',
            border: '2px solid #388e3c',
            borderRadius: '8px',
            background: '#fafff5',
            color: '#333',
            fontSize: '1rem',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </section>
  );
};

// Search Results Component
const SearchResults = ({ results }: { results: Product[] }) => {
  const router = useRouter();
  return (
    <section>
      <h2 style={{ color: '#388e3c' }}>Search Results</h2>
      {results.length === 0 ? (
        <p style={{ color: '#d84315' }}>No products found.</p>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          {results.map((product) => (
            <li
              key={product.productId}
              style={{
                background: '#fffde7',
                border: '1px solid #c8e6c9',
                borderRadius: '8px',
                padding: '1rem',
                color: '#6d4c41',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                height: '100%',
              }}
            >
              {/* Product Image */}
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.title}
                  style={{
                    width: '100%',
                    height: '150px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '2px solid #c8e6c9',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '150px',
                    background: '#e8f5e9',
                    borderRadius: '8px',
                    border: '2px solid #c8e6c9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '3rem',
                  }}
                >
                  🌾
                </div>
              )}

              {/* Product Details */}
              <div style={{ flex: 1 }}>
                <strong
                  style={{
                    color: '#388e3c',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '1.1rem',
                    display: 'block',
                    marginBottom: '0.5rem',
                  }}
                  onClick={() => router.push(`/product/${product.productId}`)}
                  tabIndex={0}
                  role='button'
                  aria-label={`View details for ${product.title}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      router.push(`/product/${product.productId}`);
                    }
                  }}
                >
                  {product.title}
                </strong>
                <div style={{ color: '#666', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 'bold' }}>Type:</span>{' '}
                  {product.type}
                </div>
                <div style={{ color: '#666', fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 'bold' }}>Product ID:</span>{' '}
                  {product.productId}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

// Debounce function
function useDebouncedCallback(
  callback: (query: string) => void,
  delay: number
) {
  const timer = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (query: string) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        callback(query);
      }, delay);
    },
    [callback, delay]
  );
}

// Main Dashboard Page
const Dashboard = () => {
  const [results, setResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  // Fetch all products on initial load
  React.useEffect(() => {
    const fetchAll = async () => {
      const res = await fetch(`/api/products`);
      const products: Product[] = await res.json();
      // Filter to show only verified products
      const verifiedProducts = products.filter(
        (p: any) => p.verificationStatus === 'verified'
      );

      // Extract unique product types
      const types = Array.from(
        new Set(verifiedProducts.map((p) => p.type))
      ).sort();
      setAvailableTypes(types);

      setAllProducts(verifiedProducts);
      setResults(verifiedProducts); // Show all verified products by default
    };
    fetchAll();

    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    setIsLoggedIn(!!token);
  }, []);

  // Search handler: filter from allProducts by name and type
  const fetchResults = (query: string) => {
    let filtered = allProducts;

    // Filter by type if selected
    if (selectedType) {
      filtered = filtered.filter((p: Product) => p.type === selectedType);
    }

    // Filter by search query
    if (query) {
      filtered = filtered.filter((p: Product) =>
        p.title.toLowerCase().includes(query.toLowerCase())
      );
    }

    setResults(filtered);
  };

  // Type change handler
  const handleTypeChange = (type: string) => {
    setSelectedType(type);

    let filtered = allProducts;

    // Filter by type if selected
    if (type) {
      filtered = filtered.filter((p: Product) => p.type === type);
    }

    setResults(filtered);
  };

  const debouncedSearch = useDebouncedCallback(fetchResults, 400);

  const router = useRouter();

  return (
    <div style={{ background: '#f1f8e9', minHeight: '100vh' }}>
      <Header />
      <main style={{ padding: '2rem' }}>
        <Search
          onSearch={debouncedSearch}
          onTypeChange={handleTypeChange}
          selectedType={selectedType}
          availableTypes={availableTypes}
        />
        <SearchResults results={results} />

        {/* Add Product Section - Visible to everyone */}
        <div
          style={{
            marginTop: '3rem',
            padding: '2rem',
            background: '#e8f5e9',
            border: '2px solid #4caf50',
            borderRadius: '12px',
            textAlign: 'center',
          }}
        >
          <h3 style={{ color: '#2e7d32', marginBottom: '1rem' }}>
            🌱 Don't see your product?
          </h3>
          <p style={{ color: '#6d4c41', marginBottom: '1.5rem' }}>
            {isLoggedIn
              ? 'Help us expand our catalog by adding a new product'
              : 'Login to add a new product to our catalog'}
          </p>
          <button
            onClick={() => {
              if (isLoggedIn) {
                router.push('/add-a-product');
              } else {
                router.push('/login');
              }
            }}
            style={{
              background: '#388e3c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#2e7d32';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#388e3c';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {isLoggedIn ? '➕ Add a Product' : '🔐 Login to Add Product'}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
