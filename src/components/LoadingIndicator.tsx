
import React from "react";

interface LoadingIndicatorProps {
  message?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  message = "Loading..." 
}) => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gym-blue mx-auto"></div>
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  );
};

export default LoadingIndicator;
