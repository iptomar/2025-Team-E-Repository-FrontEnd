import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [authChecked, setAuthChecked] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Simulate async auth check (replace with real API/localStorage check)
        const token = localStorage.getItem("token");
        setIsAuthenticated(!!token);
        setAuthChecked(true);
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, authChecked }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
