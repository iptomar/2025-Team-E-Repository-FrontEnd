import React, { useState } from "react";
import "./login.css"; 

const Login = () => {
  let [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    email += '@ipt.pt';
    if (!email || !password) {
      setErrorMessage("Por favor, preencha todos os campos.");
    } else {
      setErrorMessage("");
      alert("Login bem-sucedido!");
    }
  };

  return (
    <div className="login-page">
        <img
          src="/iptLogin.png" 
          alt="Login"
          className="login-image"
        />
        <form onSubmit={handleSubmit} className="login-container">
          <h2>Entrar na plataforma de horários</h2>
          <div className="input-group">
            <div className="email-container">
              <input
                type="text"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu e-mail"
              />
              <p>@ipt.pt</p>
            </div>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
            />
          </div>
          {errorMessage && <div className="error-message">{errorMessage}</div>}
          <button type="submit" className="login-button">Entrar</button>
        </form>
      </div>
  );
};

export default Login;
