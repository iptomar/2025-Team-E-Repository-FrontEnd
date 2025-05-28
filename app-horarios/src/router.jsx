import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Login from "./pages/auth/login/login.jsx";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute.jsx";
import CalendarsPage from "./pages/home/gestor/main-calendars-page.jsx";
import AdminDashboard from "./pages/backoffice/AdminDashboard.jsx";
import AdminSchools from "./pages/backoffice/AdminSchools.jsx";
import AdminCourses from "./pages/backoffice/AdminCourses.jsx";
import AdminSubjects from "./pages/backoffice/AdminSubjects.jsx";
import AdminClassrooms from "./pages/backoffice/AdminClassrooms.jsx";
import AdminPeople from "./pages/backoffice/AdminPeople.jsx";
import AdminProfSubj from "./pages/backoffice/AdminProfSubj.jsx";
import AdminCourseSubj from "./pages/backoffice/AdminCourseSubj.jsx";
import CalendarCreate from "./pages/calendar/create/Create.jsx";
import { FULL_ROUTES, ROUTES } from "./routes.jsx";

const router = createBrowserRouter([
    { path: ROUTES.LOGIN, element: <Login /> },
    {
        path: "/",
        element: <App />,
        children: [
            {
                element: <ProtectedRoute />, 
                children: [
                    { path: FULL_ROUTES.CALENDAR_CREATE, element: <CalendarCreate /> },
                    { path: ROUTES.HOME, element: <CalendarsPage />},
                    { path: "backoffice", element: <AdminDashboard />},
                    { path: "backoffice/schools", element: <AdminSchools /> },
                    { path: "backoffice/courses", element: <AdminCourses /> },
                    { path: "backoffice/subjects", element: <AdminSubjects /> },
                    { path: "backoffice/classrooms", element: <AdminClassrooms /> },
                    { path: "backoffice/people", element: <AdminPeople /> },
                    { path: "backoffice/profsubj", element: <AdminProfSubj /> },
                    { path: "backoffice/coursesubj", element: <AdminCourseSubj /> }
                ],
            },
        ],
    },
]);

export default router;
