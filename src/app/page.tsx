"use client";

import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

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

// Header Component
const Header = () => (
  <header style={{ padding: '1rem', background: '#e8f5e9', color: '#388e3c', display: 'flex', alignItems: 'center' }}>
    <span style={{ fontSize: '2.5rem', marginRight: '0.75rem' }} aria-label="Farm Icon" role="img">
      🌱
    </span>
    <h1 style={{
      fontFamily: 'Arial, Georgia, serif',
      letterSpacing: '2px',
      fontWeight: 'bold',
      fontSize: '2rem',
      margin: 0
    }}>
      Farmers Direct
    </h1>
  </header>
);

// Footer Component
const Footer = () => (
  <footer style={{ padding: '1rem', background: '#e8f5e9', color: '#388e3c', marginTop: '2rem' }}>
    <p>&copy; 2025 Farmers Direct</p>
  </footer>
);

// Search Component
const Search = ({ onSearch }: { onSearch: (query: string) => void }) => {
  const [query, setQuery] = useState('');
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onSearch(e.target.value);
  };
  return (
    <section style={{ marginBottom: '1rem' }}>
      <input
        type="text"
        placeholder="Search products..."
        value={query}
        onChange={handleChange}
        style={{
          padding: '0.5rem',
          width: '60%',
          border: '2px solid #388e3c',
          borderRadius: '8px',
          background: '#f1f8e9',
          color: '#388e3c',
          fontSize: '1rem'
        }}
      />
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
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {results.map(product => (
            <li
              key={product.productId}
              style={{
                background: '#fffde7',
                border: '1px solid #c8e6c9',
                borderRadius: '8px',
                marginBottom: '1rem',
                padding: '1rem',
                color: '#6d4c41'
              }}
            >
              <strong
                style={{ color: '#388e3c', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => router.push(`/product/${product.productId}`)}
                tabIndex={0}
                role="button"
                aria-label={`View details for ${product.title}`}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    router.push(`/product/${product.productId}`);
                  }
                }}
              >
                {product.title}
              </strong>
              {' '}<span style={{ color: '#000' }}>- {product.type}</span>
              {' '}<span style={product.category === "organic" ? { color: '#ff7043' } : { color: '#000' }}>({product.category})</span>
              <br />
              <span style={{ color: '#388e3c', fontWeight: 'bold' }}>
                Price: {product.price.toString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

// Debounce function
function useDebouncedCallback(callback: (query: string) => void, delay: number) {
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

  // Fetch all products on initial load
  React.useEffect(() => {
    const fetchAll = async () => {
      const res = await fetch(`/api/products`);
      const products: Product[] = await res.json();
      setAllProducts(products);
      setResults(products); // Show all by default
    };
    fetchAll();
  }, []);

  // Search handler: filter from allProducts
  const fetchResults = (query: string) => {
    if (!query) {
      setResults(allProducts); // Show all if query is empty
    } else {
      const filtered = allProducts.filter((p: Product) =>
        p.title.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    }
  };

  const debouncedSearch = useDebouncedCallback(fetchResults, 400);

  return (
    <div style={{ background: '#f1f8e9', minHeight: '100vh' }}>
      <Header />
      <main style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div style={{ flex: 1 }}>
            <Search onSearch={debouncedSearch} />
          </div>
          <div style={{ flex: 2 }}>
            <SearchResults results={results} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;