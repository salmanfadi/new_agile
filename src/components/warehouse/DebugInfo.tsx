
import React from 'react';

interface DebugInfoProps {
  label: string;
  data: any;
  show?: boolean;
}

export const DebugInfo: React.FC<DebugInfoProps> = ({ label, data, show = false }) => {
  if (!show && process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="mt-4 p-2 border rounded bg-gray-50">
      <h4 className="text-sm font-medium">Debug: {label}</h4>
      <pre className="text-xs overflow-auto max-h-40">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};
