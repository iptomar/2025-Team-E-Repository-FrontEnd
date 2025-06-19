import React from "react";
import ReactDOM from "react-dom/client";
import {AuthProvider} from "./contexts/AuthContext.jsx";
import {RouterProvider} from "react-router-dom";
import router from "./router";
import './styles/main.scss';

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>
    </React.StrictMode>
);
