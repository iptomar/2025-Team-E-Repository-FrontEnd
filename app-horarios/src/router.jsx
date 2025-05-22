import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import CalendarTest from "./pages/calendar/calendar-test.jsx";
import Login from "./pages/auth/login/login.jsx";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute.jsx";
import CalendarsPage from "./pages/home/gestor/main-calendars-page.jsx";

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
                    { path: "home", element: <CalendarsPage />},
                ],
            },
        ],
    },
]);

export default router;
