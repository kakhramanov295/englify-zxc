import React from 'react';
import './Button.css';

export function Button({ children, onClick, variant = 'primary', type = 'button', disabled = false, className = '' }) {
  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${className}`}
    >
      {children}
    </button>
  );
}
