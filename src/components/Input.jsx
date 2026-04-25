import React from 'react';
import './Input.css';

export function Input({ label, type = 'text', value, onChange, placeholder, required = false, className = '' }) {
  return (
    <div className={`input-group ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="input-field"
      />
    </div>
  );
}
