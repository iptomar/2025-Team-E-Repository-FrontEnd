import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import CalendarTest from "./pages/calendar/calendar-test.jsx";
import Login from "./pages/auth/login/login.jsx";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute.jsx";

const router = createBrowserRouter([
    { path: "/", element: <Login /> },
    {
        path: "/",
        element: <App />,
        children: [
            {
                element: <ProtectedRoute />, // Protect all children below
                children: [
                    { path: "calendario", element: <CalendarTest /> },
                    // ...other protected routes
                ],
            },
        ],
    },
]);

export default router;
