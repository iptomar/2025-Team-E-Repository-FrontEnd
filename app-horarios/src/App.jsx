import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './login.jsx';  
import usePreventZoom from "./lib/utils/utils.js";
import './App.css';

function App() {
  usePreventZoom();  

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
