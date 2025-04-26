import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import CalendarTest from "./pages/calendar-test";
import Login from "./login";
import Blank from "./pages/blank";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Login />,
    },
    {
        path: "/pages/calendar-test",
        element: <CalendarTest />,
    },
    {
        path: "/pages/blank",
        element: <Blank />,
    },
]);

export default router;
