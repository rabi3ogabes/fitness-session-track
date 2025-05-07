
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
    small: "h-8 w-8 border-t-2 border-b-2",
    medium: "h-12 w-12 border-t-2 border-b-2", 
    large: "h-16 w-16 border-t-3 border-b-3"
  };
  
  const containerClasses = {
    small: "h-auto py-2",
    medium: "h-screen",
    large: "h-screen"
  };
  
  return (
    <div className={`flex items-center justify-center ${containerClasses[size]}`}>
      <div className="text-center">
        <div className={`animate-spin rounded-full ${sizeClasses[size]} border-gym-blue mx-auto`}></div>
        {message && <p className="mt-2 text-gray-600 text-sm">{message}</p>}
      </div>
    </div>
  );
};

export default LoadingIndicator;
