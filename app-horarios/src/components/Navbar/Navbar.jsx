import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import iptLogo from "../../assets/ipt-logo-full.png";
import "./Navbar.scss";
import { useAuth } from "../../contexts/AuthContext.jsx";
import {FULL_ROUTES} from "../../routes.jsx";

const Navbar = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const user = JSON.parse(localStorage.getItem("user")) || {};

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate(FULL_ROUTES.LOGIN); // Redirect to login
    };

    const getPageTitle = () => {
        if (location.pathname.includes("/calendario")) {
            return "Calendário";
        } else if (location.pathname.includes("/home")) {
            return "Meus horários";
        } else {
            return "Gestão de Horários";
        }
    };

    const goToBackoffice = () => {
        navigate(FULL_ROUTES.BACKOFFICE.HOME);
    };

    if (isAuthenticated) {
        return (
            <nav className="navbar">
                <div className="navbar-left">
                    <img src={iptLogo} alt="IPT Logo" className="navbar-logo" />
                    <span className="navbar-title">{getPageTitle()}</span>
                </div>
                <div className="navbar-center">
                    <ul className="navbar-links">
                        <li><a href="/home">Meus horários</a></li>
                    </ul>
                </div>
                <div className="navbar-right">
                    {user && user.email && (
                        <>
                            {user.role === "Admin" ? (
                                <span
                                    className="navbar-email navbar-email--link"
                                    onClick={goToBackoffice}
                                    style={{ cursor: "pointer", textDecoration: "underline" }}
                                >
                                    {user.email}
                                </span>
                            ) : (
                                <span className="navbar-email">{user.email}</span>
                            )}
                            <button className="navbar-logout" onClick={handleLogout}>Logout</button>
                        </>
                    )}
                </div>
            </nav>
        );
    }

    return null;
};

export default Navbar;
