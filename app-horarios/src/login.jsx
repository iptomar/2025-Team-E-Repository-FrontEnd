import React, { useState } from "react";
import "./Login.css";  // Importa o arquivo de estilo

const Login = () => {
  // Estado para armazenar os valores dos campos
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");  // Mensagem de erro
  const [loading, setLoading] = useState(false);  // Indicador de carregamento

  // Função de validação simples
  const validateForm = () => {
    if (!email || !password) {
      return "Por favor, preencha todos os campos.";  // Mensagem de erro se faltarem dados
    }
    return "";
  };

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const error = validateForm();
    if (error) {
      setErrorMessage(error);
      return;
    }

    setErrorMessage("");
    setLoading(true);

    // Aqui, você faria a chamada para a API para validar o login
    setTimeout(() => {
      setLoading(false);
      alert("Login bem-sucedido!");
      // Após o login bem-sucedido, redirecionar o usuário ou fazer algo mais
    }, 2000);
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} noValidate>
        {/* Campo de E-mail */}
        <div className="input-group">
          <label htmlFor="email">E-mail</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Digite seu e-mail"
            required
            aria-required="true"
            aria-describedby="email-error"
          />
        </div>

        {/* Campo de Senha */}
        <div className="input-group">
          <label htmlFor="password">Senha</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite sua senha"
            required
            aria-required="true"
            aria-describedby="password-error"
          />
        </div>

        {/* Exibição de mensagens de erro */}
        {errorMessage && <div className="error-message" id="form-error">{errorMessage}</div>}

        {/* Botão de Envio */}
        <button type="submit" className="login-button" disabled={loading}>
          {loading ? "Carregando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
};

export default Login;
