"use client";
import React, { useEffect, useState } from 'react';

interface SnackbarProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  isOpen: boolean;
  onClose: () => void;
  duration?: number; // Auto close duration in milliseconds
}

const Snackbar: React.FC<SnackbarProps> = ({
  message,
  type,
  isOpen,
  onClose,
  duration = 5000
}) => {
  const [visible, setVisible] = useState(false);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation to complete
  };

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      
      // Auto close after duration
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, handleClose]);

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#4caf50',
          icon: '✅',
          color: 'white'
        };
      case 'error':
        return {
          backgroundColor: '#f44336',
          icon: '❌',
          color: 'white'
        };
      case 'warning':
        return {
          backgroundColor: '#ff9800',
          icon: '⚠️',
          color: 'white'
        };
      case 'info':
        return {
          backgroundColor: '#2196f3',
          icon: 'ℹ️',
          color: 'white'
        };
      default:
        return {
          backgroundColor: '#333',
          icon: 'ℹ️',
          color: 'white'
        };
    }
  };

  const config = getTypeConfig();

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes slideInUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOutDown {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(100%);
            opacity: 0;
          }
        }
        
        .snackbar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          pointer-events: none;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 1rem;
        }
        
        .snackbar {
          background: ${config.backgroundColor};
          color: ${config.color};
          padding: 1rem 1.5rem;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 300px;
          max-width: 500px;
          pointer-events: auto;
          animation: ${visible ? 'slideInUp' : 'slideOutDown'} 0.3s ease-out;
          font-family: Arial, sans-serif;
          font-size: 1rem;
          font-weight: 500;
        }
        
        .snackbar-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }
        
        .snackbar-message {
          flex: 1;
          word-break: break-word;
        }
        
        .snackbar-close {
          background: none;
          border: none;
          color: ${config.color};
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          font-size: 1.25rem;
          font-weight: bold;
          opacity: 0.8;
          transition: opacity 0.2s ease;
          flex-shrink: 0;
        }
        
        .snackbar-close:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
      
      <div className="snackbar-overlay">
        <div className="snackbar">
          <span className="snackbar-icon">{config.icon}</span>
          <span className="snackbar-message">{message}</span>
          <button 
            className="snackbar-close" 
            onClick={handleClose}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>
    </>
  );
};

export default Snackbar;
