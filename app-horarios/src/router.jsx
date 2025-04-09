import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import CalendarTest from "./pages/calendar-test";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
    },
    {
        path: "/pages/calendar-test",
        element: <CalendarTest />,
    },
]);

export default router;
