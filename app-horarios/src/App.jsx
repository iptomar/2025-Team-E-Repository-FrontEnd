import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './login.jsx';  
import usePreventZoom from "./lib/utils/utils.js";
import { useWebSocket } from './lib/websocket/hooks.jsx'; // Import the WebSocket hook
import './App.css';

function App() {
  usePreventZoom();
  const { isConnected } = useWebSocket(); // Get connection status from hook

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
