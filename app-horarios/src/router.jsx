import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import CalendarTest from "./pages/calendar-test";
import Login from "./login";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Login />,
    },
    {
        path: "/pages/calendar-test",
        element: <CalendarTest />,
    },
]);

export default router;
