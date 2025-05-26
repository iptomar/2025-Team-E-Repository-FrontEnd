import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import CalendarTest from "./pages/calendar/calendar-test.jsx";
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
                    { path: "backoffice", element: <AdminDashboard />},
                    { path: "backoffice/schools", element: <AdminSchools /> },
                    { path: "backoffice/courses", element: <AdminCourses /> },
                    { path: "backoffice/subjects", element: <AdminSubjects /> },
                    { path: "backoffice/classrooms", element: <AdminClassrooms /> },
                    { path: "backoffice/people", element: <AdminPeople /> },
                    { path: "backoffice/profsubj", element: <AdminProfSubj /> }
                ],
            },
        ],
    },
]);

export default router;
