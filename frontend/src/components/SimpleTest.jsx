import React from 'react';

const SimpleTest = () => {
  console.log('SimpleTest component rendering...');
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f0f8ff', 
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        textAlign: 'center' 
      }}>
        <h1 style={{ 
          color: '#0066cc', 
          fontSize: '3rem',
          marginBottom: '1rem'
        }}>
          🎉 React is Working!
        </h1>
        
        <p style={{ 
          fontSize: '1.5rem', 
          color: '#333',
          marginBottom: '2rem'
        }}>
          If you can see this, React is rendering correctly!
        </p>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '2rem', 
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#333', marginBottom: '1rem' }}>
            Test Results:
          </h2>
          <ul style={{ textAlign: 'left', color: '#666' }}>
            <li>✅ React component rendering</li>
            <li>✅ JavaScript execution</li>
            <li>✅ DOM manipulation</li>
            <li>✅ Basic styling</li>
          </ul>
        </div>
        
        <button 
          style={{
            marginTop: '2rem',
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
          onClick={() => {
            alert('JavaScript is working perfectly!');
            console.log('Button clicked!');
          }}
        >
          Test JavaScript
        </button>
        
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '5px'
        }}>
          <p style={{ margin: 0, color: '#856404' }}>
            <strong>Debug Info:</strong> Check browser console for logs
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleTest;
