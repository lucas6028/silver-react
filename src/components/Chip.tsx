import React from 'react';

interface ChipProps {
  label: string;
  className?: string;
  onClick?: () => void;
  active?: boolean;
}

export const Chip: React.FC<ChipProps> = ({ label, className = '', onClick, active }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
      active 
        ? 'bg-blue-600 text-white border-blue-600' 
        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
    } ${className}`}
  >
    {label}
  </button>
);
