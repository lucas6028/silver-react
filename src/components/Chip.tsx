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
        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
    } ${className}`}
  >
    {label}
  </button>
);
