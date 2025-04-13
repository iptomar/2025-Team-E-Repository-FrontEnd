import React, { useState } from 'react';
import './styles/main.scss';
import {useNavigate} from 'react-router-dom'
import {login} from '../src/api/authFetcher';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = await login(email, password);
      localStorage.setItem('token', data.token); // guarda o token
      console.log(data);
      navigate('/pages/calendar-test');
    } catch (err) {
      console.log(err.message);
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="login-page">
      <div className="container-fluid p-0">
        <div className="row g-0 vh-100">
          <div className="col-md-4 d-flex align-items-center justify-content-center overflow-hidden bg-light">
            <img
              src="/iptLogin.png"
              alt="Login"
              className="login-image"
            />
          </div>
          
          <div className="col-md-8 d-flex align-items-center justify-content-center bg-white">
            <div className="form-container">
              <h1 className="mb-5">Entrar na plataforma de horários</h1>
              <form className="d-flex flex-column w-100" onSubmit={handleSubmit}>
                <div className="mb-4 col-md-6">
                  <input
                    type="email"
                    className="form-control form-control-lg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='Email'
                  />
                </div>
                <div className="mb-5 col-md-6">
                  <input
                    type="password"
                    className="form-control form-control-lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='Senha'
                  />
                </div>
                {errorMessage && <div className="text-danger mb-3">{errorMessage}</div>}
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                >
                  Entrar
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;