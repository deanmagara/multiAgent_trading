import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ children, className = '' }) => (
  <div className={`p-4 border rounded-lg ${className}`}>
    {children}
  </div>
);

export const AlertDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-sm">
    {children}
  </div>
); 