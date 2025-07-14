function AppMinimal() {
  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#2C2B2E', // Dark DuetRight color
      color: '#FFFDFA', // Light contrast
      minHeight: '100vh'
    }}>
      <h1>DuetRight Dashboard V3 - Minimal Test</h1>
      <p>If you can see this, React 19 is working correctly!</p>
      <button 
        onClick={() => console.log('Button clicked!')}
        style={{
          padding: '10px 20px',
          backgroundColor: '#FFBB2F', // DuetRight primary
          color: '#2C2B2E', // Dark text
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Test Button
      </button>
      <div style={{ marginTop: '20px' }}>
        <p>✅ React 19: Working</p>
        <p>✅ TypeScript: Working</p>
        <p>✅ Vite: Working</p>
        <p>⏳ Material-UI: Testing next...</p>
      </div>
    </div>
  );
}

export default AppMinimal;