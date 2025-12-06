import React from 'react';

interface ProgressBarProps {
  progress: number;
  color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, color = 'bg-blue-500' }) => (
  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
    <div 
      className={`h-full ${color} transition-all duration-500 ease-out`} 
      style={{ width: `${progress}%` }}
    />
  </div>
);
