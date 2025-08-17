import React, { useState, useEffect } from 'react';

const GroceryNotes = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Grocery Notes...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <p className="text-gray-600 mb-4">Something went wrong</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Grocery Notes
          </h1>
          <p className="text-gray-600 text-sm">Voice-powered shopping lists</p>
        </div>

        {/* Simple Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Welcome!</h3>
          <p className="text-gray-600">
            This is a simplified test version. If you can see this, React is working!
          </p>
          <button 
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => alert('JavaScript is working!')}
          >
            Test Button
          </button>
        </div>

        {/* Debug Info */}
        <div className="bg-yellow-50/80 rounded-3xl p-4 text-xs">
          <p><strong>Debug Info:</strong></p>
          <p>Component rendered successfully</p>
          <p>React version: {React.version}</p>
          <p>Environment: {process.env.NODE_ENV}</p>
        </div>
      </div>
    </div>
  );
};

export default GroceryNotes;