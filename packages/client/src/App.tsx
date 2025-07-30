import React from 'react';

const App = () => {
  return (
    <div style={{
      backgroundColor: '#101818',
      minHeight: '100vh',
      color: 'white',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column'
    }}>
      <img src="/assets/logo.png" alt="MaxEvo Logo" style={{ width: '200px', marginBottom: '20px' }} />
      <h1>Welcome to MaxEvo</h1>
      <p>This is your custom LibreChat rebrand</p>
    </div>
  );
};

export default App;
