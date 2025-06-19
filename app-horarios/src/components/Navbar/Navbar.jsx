import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container } from "react-bootstrap";
import { FiUser } from "react-icons/fi";
import { FiLogOut } from "react-icons/fi"; // logout
import { FaTools } from "react-icons/fa"; // admin/backoffice
import { HiOutlineMail } from "react-icons/hi"; // email
import iptLogo from "../../assets/ipt-logo-full.png";
import "./Navbar.scss";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { FULL_ROUTES } from "../../routes.jsx";

const Navbar = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate(FULL_ROUTES.LOGIN);
  };

  const goToBackoffice = () => navigate(FULL_ROUTES.BACKOFFICE.HOME);

  if (!isAuthenticated) return null;

  return (
    <nav className="navbar shadow-sm">
      <Container className="d-flex justify-content-between align-items-center py-2">
        {/* LOGO + LINK */}
        <div className="navbar-left d-flex align-items-center gap-4">
          <Link to={FULL_ROUTES.HOME}>
            <img
              src={iptLogo}
              alt="IPT Logo"
              className="navbar-logo"
              style={{ cursor: "pointer", height: "40px" }}
            />
          </Link>

          <Link
            to={FULL_ROUTES.HOME}
            className="navbar-link fw-semibold text-decoration-none text-primary"
          >
            Horários
          </Link>
        </div>

        {/* PERFIL / LOGOUT */}
        <div className="navbar-right d-flex align-items-center gap-3">
          {user?.email && (
            <>
              <span className="navbar-email d-flex align-items-center gap-2">
                <FiUser className="text-primary" />
                <span className="fw-semibold text-muted">Bem-vindo,</span>
                <span className="fw-bold text-dark">{user.email}</span>
              </span>

              {user.role === "Admin" && (
                <button
                  className="btn btn-outline-secondary d-flex align-items-center gap-1"
                  onClick={goToBackoffice}
                >
                  <FaTools /> Backoffice
                </button>
              )}

              <button
                className="btn btn-outline-danger d-flex align-items-center gap-1"
                onClick={handleLogout}
              >
                <FiLogOut /> Logout
              </button>
            </>
          )}
        </div>
      </Container>
    </nav>
  );
};

export default Navbar;
