import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import {useAuth} from "../../contexts/AuthContext.jsx";
import Loading from "../Loading/Loading.jsx";

const ProtectedRoute = () => {
    const { isAuthenticated, authChecked } = useAuth();

    if (!authChecked) {
        // Show loading spinner or nothing while checking
        return <Loading />;
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;
