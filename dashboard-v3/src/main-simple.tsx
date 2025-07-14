import { createRoot } from 'react-dom/client';

function App() {
  return (
    <div style={{
      backgroundColor: '#2C2B2E',
      color: '#FFFDFA', 
      padding: '40px',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{color: '#FFBB2F'}}>DuetRight Dashboard V3 - Dark Theme</h1>
      <p>✅ React 18 Working!</p>
      <p>✅ Dark DuetRight Colors Applied!</p>
      <button 
        onClick={() => alert('Button works!')}
        style={{
          backgroundColor: '#FFBB2F',
          color: '#2C2B2E',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Test Button
      </button>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);