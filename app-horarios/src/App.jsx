import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './login.jsx';  
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
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
