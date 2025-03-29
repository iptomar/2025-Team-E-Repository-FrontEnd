import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './login.jsx';  
import './App.css';
import { useWebSocket } from './lib/websocket/hooks.jsx';

function App() {
  const{isConnected}=useWebSocket();
  console.log(isConnected);
  return (
    <Router>
      <Routes>
        {/* Define the path for the Login page */}
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
