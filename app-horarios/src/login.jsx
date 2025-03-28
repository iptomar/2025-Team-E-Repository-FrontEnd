import React, { useState } from 'react';
import './login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Lógica de autenticação
  };

  return (
    <div className="login-page">
    <div className="container-fluid d-flex">
      <img
        src="/iptLogin.png"
        alt="Login"
        className="login-image"
      />
      <div className="form-container">
        <form className="d-flex flex-column" onSubmit={handleSubmit}>
          <input
            type="email"
            className="form-control form-control-lg mb-3"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="form-control form-control-lg mb-3"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errorMessage && <div className="text-danger mb-3">{errorMessage}</div>}
          <button
            type="submit"
            className="btn btn-primary btn-lg mx-auto"
            style={{ width: '30%' }}
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  </div>
  );
};

export default Login;
