import React from 'react';

const SimpleTest = () => {
  return (
    <div className="min-h-screen bg-blue-100 p-8">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-4xl font-bold text-blue-800 mb-4">
          🎉 It's Working!
        </h1>
        <p className="text-lg text-blue-600 mb-6">
          If you can see this, the React app is rendering correctly!
        </p>
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Test Features
          </h2>
          <ul className="text-left text-gray-600 space-y-2">
            <li>✅ React rendering</li>
            <li>✅ Tailwind CSS</li>
            <li>✅ Component structure</li>
            <li>✅ Basic functionality</li>
          </ul>
        </div>
        <button 
          className="mt-6 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          onClick={() => alert('JavaScript is working!')}
        >
          Test JavaScript
        </button>
      </div>
    </div>
  );
};

export default SimpleTest;
