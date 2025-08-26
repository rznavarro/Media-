import React from 'react';
import Chat from './components/Chat';

function App() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20 animate-pulse"></div>
      
      {/* Abstract flowing curves */}
      <div className="absolute inset-0">
        <div className="flowing-curve curve-1"></div>
        <div className="flowing-curve curve-2"></div>
        <div className="flowing-curve curve-3"></div>
        <div className="flowing-curve curve-4"></div>
      </div>
      
      {/* 3D Abstract forms */}
      <div className="absolute inset-0">
        <div className="abstract-form form-1"></div>
        <div className="abstract-form form-2"></div>
        <div className="abstract-form form-3"></div>
      </div>
      
      {/* Neon light trails */}
      <div className="absolute inset-0">
        <div className="neon-trail trail-1"></div>
        <div className="neon-trail trail-2"></div>
        <div className="neon-trail trail-3"></div>
        <div className="neon-trail trail-4"></div>
      </div>
      
      {/* Glowing energy particles */}
      <div className="absolute inset-0">
        <div className="energy-particles"></div>
      </div>
      
      <Chat />
    </div>
  );
}

export default App;