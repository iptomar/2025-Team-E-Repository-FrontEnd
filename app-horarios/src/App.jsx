import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Login';  // Correct import from the same directory
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />  {/* Login page at the root path */}
      </Routes>
    </Router>
  );
}

export default App;