import React from "react";
import {useNavigate, useLocation} from "react-router-dom";
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
        navigate(FULL_ROUTES.LOGIN);
    };

    const getPageTitle = () => {
        if (location.pathname.includes("/calendar")) {
            return "Gestão de Horários";
        } else if (location.pathname.includes("/home")) {
            return "Meus Horários";
        } else if (location.pathname.includes("/backoffice")) {
            return "Administração";
        } else {
            return "Gestão de Horários";
        }
    };

    const goToBackoffice = () => {
        navigate(FULL_ROUTES.BACKOFFICE.HOME);
    };

    const goToHome = () => {
        navigate(FULL_ROUTES.CALENDAR.LISTING);
    };

    if (isAuthenticated) {
        return (
            <nav className="navbar">
                <div className="navbar-left">
                    <img src={iptLogo} alt="IPT Logo" className="navbar-logo" />
                    <span
                        className="navbar-title navbar-title--clickable"
                        onClick={goToHome}
                    >
                        {getPageTitle()}
                    </span>
                </div>
                <div className="navbar-center">
                    <ul className="navbar-links">
                        {user.role === "Admin" && (
                            <li>
                                <button
                                    className="navbar-link-btn"
                                    onClick={goToBackoffice}
                                >
                                    Administração
                                </button>
                            </li>
                        )}
                    </ul>
                </div>
                <div className="navbar-right">
                    {user && user.email && (
                        <>
                            <span className="navbar-email">{user.email}</span>
                            <button className="navbar-logout" onClick={handleLogout}>
                                Logout
                            </button>
                        </>
                    )}
                </div>
            </nav>
        );
    }

    return null;
};

export default Navbar;
