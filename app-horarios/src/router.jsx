import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Login from "./pages/auth/login/login.jsx";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute.jsx";
import CalendarListing from "./pages/home/gestor/main-calendars-page.jsx";
import CalendarCreate from "./pages/calendar/create/Create.jsx";
import CalendarView from "./pages/calendar/view/View.jsx";



const router = createBrowserRouter([
    { path: "/", element: <Login /> },
    {
        path: "/",
        element: <App />,
        children: [
            {
                element: <ProtectedRoute />, // Protect all children below
                children: [
                    { path: "home", element: <CalendarListing />},
                    {
                        path: "calendar/",
                        children: [
                            {
                                children: [
                                    { path: "", element: <CalendarListing /> },
                                    { path: "create", element: <CalendarCreate />},
                                    { path: ":scheduleId/view", element: <CalendarView />},
                                ],
                            },
                        ]},
                ],
            },
        ],
    },
]);

export default router;
