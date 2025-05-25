import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Login from "./pages/auth/login/login.jsx";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute.jsx";
import CalendarListing from "./pages/home/gestor/main-calendars-page.jsx";
import CalendarCreate from "./pages/calendar/create/Create.jsx";
import CalendarView from "./pages/calendar/view/View.jsx";
import {ROUTES} from "./routes.jsx";

const router = createBrowserRouter([
    { path: ROUTES.LOGIN, element: <Login /> },
    {
        path: "/",
        element: <App />,
        children: [
            {
                element: <ProtectedRoute />,
                children: [
                    { path: ROUTES.HOME, element: <CalendarListing />},
                    {
                        path: ROUTES.CALENDAR_ROOT,
                        children: [
                            {
                                children: [
                                    { path: ROUTES.CALENDAR_LISTING, element: <CalendarListing /> },
                                    { path: ROUTES.CALENDAR_CREATE, element: <CalendarCreate />},
                                    { path: ROUTES.CALENDAR_VIEW, element: <CalendarView />},
                                ],
                            },
                        ]},
                ],
            },
        ],
    },
]);

export default router;
