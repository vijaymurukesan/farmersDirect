"use client";
import React, { useState } from 'react';

interface FilterOptions {
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

interface FarmerFilterProps {
  filters: FilterOptions;
  onFilterChange: (filterKey: keyof FilterOptions, value: string) => void;
  onClearFilters: () => void;
  isSticky?: boolean;
}

export default function FarmerFilter({ filters, onFilterChange, onClearFilters, isSticky = false }: FarmerFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  // Get active filters
  const activeFilters = Object.entries(filters).filter(([_, value]) => value !== '');
  const hasActiveFilters = activeFilters.length > 0;

  // Get filter labels
  const getFilterLabel = (key: string, value: string) => {
    const labels: { [key: string]: { [value: string]: string } } = {
      gstRegistered: { true: 'GST Registered', false: 'Not GST Registered' },
      isRegisteredCompany: { true: 'Registered Company', false: 'Individual Farmer' },
      availability: { today: 'Available Today', future: 'Available Later' },
      size: { small: 'Small', medium: 'Medium', large: 'Large' },
      organicCertificate: { has: 'Has Certificate', none: 'No Certificate' },
      readyForContract: { true: 'Ready for Contract', false: 'Not Ready' },
      priceRange: { '0-2': '₹0-2', '2-4': '₹2-4', '4-6': '₹4-6', '6+': '₹6+' },
      organic: { organic: 'Organic', conventional: 'Conventional' },
      averageReviews: { '5': '5 Stars', '4+': '4+ Stars', '3+': '3+ Stars', '2+': '2+ Stars', '1+': '1+ Stars' },
      area: { '0-5': '0-5 acres', '5-15': '5-15 acres', '15-50': '15-50 acres', '50+': '50+ acres' },
      yield: { '0-1000': '0-1000 kg/year', '1000-5000': '1000-5000 kg/year', '5000-15000': '5000-15000 kg/year', '15000+': '15000+ kg/year' },
      district: { [value]: value },
      state: { [value]: value }
    };
    return labels[key]?.[value] || value;
  };

  // Determine what to show based on sticky state and toggle
  const shouldShowCompactView = isSticky && !isExpanded;
  const shouldShowOnlySelected = showOnlySelected && !shouldShowCompactView;

  return (
    <div 
      id="farmer-filter"
      style={{
        background: '#f1f8e9',
        border: '1px solid #c8e6c9',
        borderRadius: '8px',
        padding: shouldShowCompactView ? '0.75rem 1.5rem' : '1.5rem',
        marginBottom: '0',
        boxShadow: isSticky ? '0 4px 12px rgba(200, 230, 201, 0.6)' : '0 4px 12px rgba(200, 230, 201, 0.4)',
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: shouldShowCompactView ? '0' : '1rem' 
      }}>
        <h3 style={{ 
          color: '#388e3c', 
          margin: 0, 
          fontSize: shouldShowCompactView ? '1.2rem' : '1.5rem',
          transition: 'font-size 0.3s ease'
        }}>
          Filter Farmers
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Toggle button for showing only selected filters */}
          {!shouldShowCompactView && hasActiveFilters && (
            <button
              onClick={() => setShowOnlySelected(!showOnlySelected)}
              style={{
                background: showOnlySelected ? '#388e3c' : '#757575',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              {showOnlySelected ? '📋 Selected Only' : '📋 Show Selected'}
            </button>
          )}
          
          {/* Expand/Collapse button for sticky mode */}
          {isSticky && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: '#388e3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              {isExpanded ? '▲' : '▼'}
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          )}
          
          {/* Clear All button */}
          <button
            onClick={onClearFilters}
            style={{
              background: '#d84315',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Compact Mode - Show only active filters as pills */}
      {shouldShowCompactView && hasActiveFilters && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {activeFilters.map(([key, value]) => (
            <div
              key={key}
              style={{
                background: '#388e3c',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '16px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>{getFilterLabel(key, value)}</span>
              <button
                onClick={() => onFilterChange(key as keyof FilterOptions, '')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  padding: '0',
                  margin: '0',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Full Filter Grid - Show when not in compact mode */}
      {!shouldShowCompactView && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {/* GST Registration */}
          {(!shouldShowOnlySelected || filters.gstRegistered) && (
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 'bold', 
                color: '#388e3c' 
              }}>
                GST Registration
              </label>
              <select
                value={filters.gstRegistered}
                onChange={(e) => onFilterChange('gstRegistered', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #c8e6c9',
                  borderRadius: '4px',
                  background: 'white'
                }}
              >
                <option value="">All</option>
                <option value="true">GST Registered</option>
                <option value="false">Not GST Registered</option>
              </select>
            </div>
          )}

          {/* Company Registration */}
          {(!shouldShowOnlySelected || filters.isRegisteredCompany) && (
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 'bold', 
                color: '#388e3c' 
              }}>
                Company Registration
              </label>
              <select
                value={filters.isRegisteredCompany}
                onChange={(e) => onFilterChange('isRegisteredCompany', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #c8e6c9',
                  borderRadius: '4px',
                  background: 'white'
                }}
              >
                <option value="">All</option>
                <option value="true">Registered Company</option>
                <option value="false">Individual Farmer</option>
              </select>
            </div>
          )}

          {/* Availability */}
          {(!shouldShowOnlySelected || filters.availability) && (
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 'bold', 
                color: '#388e3c' 
              }}>
                Availability
              </label>
              <select
                value={filters.availability}
                onChange={(e) => onFilterChange('availability', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #c8e6c9',
                  borderRadius: '4px',
                  background: 'white'
                }}
              >
                <option value="">All</option>
                <option value="today">Available Today</option>
                <option value="future">Available Later</option>
              </select>
            </div>
          )}

          {/* Size */}
          {(!shouldShowOnlySelected || filters.size) && (
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 'bold', 
                color: '#388e3c' 
              }}>
                Farm Size
              </label>
              <select
                value={filters.size}
                onChange={(e) => onFilterChange('size', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #c8e6c9',
                  borderRadius: '4px',
                  background: 'white'
                }}
              >
                <option value="">All</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          )}

          {/* Organic Certificate */}
          {(!shouldShowOnlySelected || filters.organicCertificate) && (
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 'bold', 
                color: '#388e3c' 
              }}>
                Organic Certificate
              </label>
              <select
                value={filters.organicCertificate}
                onChange={(e) => onFilterChange('organicCertificate', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #c8e6c9',
                  borderRadius: '4px',
                  background: 'white'
                }}
              >
                <option value="">All</option>
                <option value="has">Has Certificate</option>
                <option value="none">No Certificate</option>
              </select>
            </div>
          )}

          {/* Contract Readiness */}
          {(!shouldShowOnlySelected || filters.readyForContract) && (
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 'bold', 
                color: '#388e3c' 
              }}>
                Contract Readiness
              </label>
              <select
                value={filters.readyForContract}
                onChange={(e) => onFilterChange('readyForContract', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #c8e6c9',
                  borderRadius: '4px',
                  background: 'white'
                }}
              >
                <option value="">All</option>
                <option value="true">Ready for Contract</option>
                <option value="false">Not Ready</option>
              </select>
            </div>
          )}

          {/* Price Range */}
          {(!shouldShowOnlySelected || filters.priceRange) && (
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 'bold', 
                color: '#388e3c' 
              }}>
                Price Range (₹/kg)
              </label>
              <select
                value={filters.priceRange}
                onChange={(e) => onFilterChange('priceRange', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #c8e6c9',
                  borderRadius: '4px',
                  background: 'white'
                }}
              >
                <option value="">All</option>
                <option value="0-2">₹0-2</option>
                <option value="2-4">₹2-4</option>
                <option value="4-6">₹4-6</option>
                <option value="6+">₹6+</option>
              </select>
            </div>
          )}

          {/* Organic Type */}
          {(!shouldShowOnlySelected || filters.organic) && (
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 'bold', 
                color: '#388e3c' 
              }}>
                Farming Type
              </label>
              <select
                value={filters.organic}
                onChange={(e) => onFilterChange('organic', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #c8e6c9',
                  borderRadius: '4px',
                  background: 'white'
                }}
              >
                <option value="">All</option>
                <option value="organic">Organic</option>
                <option value="conventional">Conventional</option>
              </select>
            </div>
          )}

          {/* Average Reviews */}
          {(!shouldShowOnlySelected || filters.averageReviews) && (
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 'bold', 
                color: '#388e3c' 
              }}>
                Average Reviews
              </label>
              <select
                value={filters.averageReviews}
                onChange={(e) => onFilterChange('averageReviews', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #c8e6c9',
                  borderRadius: '4px',
                  background: 'white'
                }}
              >
                <option value="">All</option>
                <option value="5">5 Stars</option>
                <option value="4+">4+ Stars</option>
                <option value="3+">3+ Stars</option>
                <option value="2+">2+ Stars</option>
                <option value="1+">1+ Stars</option>
              </select>
            </div>
          )}

          {/* Area */}
          {(!shouldShowOnlySelected || filters.area) && (
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 'bold', 
                color: '#388e3c' 
              }}>
                Cultivation Area
              </label>
              <select
                value={filters.area}
                onChange={(e) => onFilterChange('area', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #c8e6c9',
                  borderRadius: '4px',
                  background: 'white'
                }}
              >
                <option value="">All</option>
                <option value="0-5">0-5 acres</option>
                <option value="5-15">5-15 acres</option>
                <option value="15-50">15-50 acres</option>
                <option value="50+">50+ acres</option>
              </select>
            </div>
          )}

          {/* Yield */}
          {(!shouldShowOnlySelected || filters.yield) && (
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 'bold', 
                color: '#388e3c' 
              }}>
                Total Yield
              </label>
              <select
                value={filters.yield}
                onChange={(e) => onFilterChange('yield', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #c8e6c9',
                  borderRadius: '4px',
                  background: 'white'
                }}
              >
                <option value="">All</option>
                <option value="0-1000">0-1000 kg/year</option>
                <option value="1000-5000">1000-5000 kg/year</option>
                <option value="5000-15000">5000-15000 kg/year</option>
                <option value="15000+">15000+ kg/year</option>
              </select>
            </div>
          )}

          {/* District */}
          {(!shouldShowOnlySelected || filters.district) && (
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 'bold', 
                color: '#388e3c' 
              }}>
                District
              </label>
              <select
                value={filters.district}
                onChange={(e) => onFilterChange('district', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #c8e6c9',
                  borderRadius: '4px',
                  background: 'white'
                }}
              >
                <option value="">All</option>
                <option value="Karnal">Karnal</option>
                <option value="Gurgaon">Gurgaon</option>
                <option value="Faridabad">Faridabad</option>
                <option value="Panipat">Panipat</option>
                <option value="Rohtak">Rohtak</option>
                <option value="Hisar">Hisar</option>
                <option value="Sonipat">Sonipat</option>
                <option value="Ambala">Ambala</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          {/* State */}
          {(!shouldShowOnlySelected || filters.state) && (
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 'bold', 
                color: '#388e3c' 
              }}>
                State
              </label>
              <select
                value={filters.state}
                onChange={(e) => onFilterChange('state', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #c8e6c9',
                  borderRadius: '4px',
                  background: 'white'
                }}
              >
                <option value="">All</option>
                <option value="Haryana">Haryana</option>
                <option value="Punjab">Punjab</option>
                <option value="Delhi">Delhi</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Himachal Pradesh">Himachal Pradesh</option>
                <option value="Uttarakhand">Uttarakhand</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Show message when no filters are active in "Selected Only" mode */}
      {shouldShowOnlySelected && !hasActiveFilters && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#757575',
          fontStyle: 'italic'
        }}>
          No filters selected. Apply some filters to see them here.
        </div>
      )}
    </div>
  );
}
