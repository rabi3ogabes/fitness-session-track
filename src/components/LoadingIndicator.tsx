
import React from "react";

interface LoadingIndicatorProps {
  message?: string;
  size?: "small" | "medium" | "large";
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  message = "Loading...",
  size = "medium"
}) => {
  const sizeClasses = {
    small: "h-4 w-4 border-t-1 border-b-1",
    medium: "h-8 w-8 border-t-2 border-b-2", 
    large: "h-12 w-12 border-t-2 border-b-2"
  };
  
  const containerClasses = {
    small: "h-auto py-1",
    medium: "h-auto py-2",
    large: "h-auto py-4"
  };
  
  return (
    <div className={`flex items-center justify-center ${containerClasses[size]}`}>
      <div className="text-center">
        <div className={`animate-spin rounded-full ${sizeClasses[size]} border-gym-blue mx-auto`}></div>
        {message && <p className="mt-1 text-gray-600 text-xs">{message}</p>}
      </div>
    </div>
  );
};

export default LoadingIndicator;
