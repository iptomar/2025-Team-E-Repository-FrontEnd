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
import CalendarView from "./pages/calendar/view/View.jsx";
import { ROUTES } from "./routes.jsx";

const router = createBrowserRouter([
    { path: ROUTES.LOGIN, element: <Login /> },
    {
        path: "/",
        element: <App />,
        children: [
            {
                element: <ProtectedRoute />,
                children: [
                    { path: ROUTES.HOME, element: <CalendarsPage /> },
                    {
                        path: ROUTES.CALENDAR_ROOT,
                        children: [
                            {
                                children: [
                                    { path: ROUTES.CALENDAR_LISTING, element: <CalendarsPage /> },
                                    { path: ROUTES.CALENDAR_CREATE, element: <CalendarCreate /> },
                                    { path: ROUTES.CALENDAR_VIEW, element: <CalendarView /> },
                                ],
                            },
                        ],
                    },
                    {
                        path: ROUTES.BACKOFFICE_ROOT,
                        children: [
                            {
                                children: [
                                    { path: ROUTES.BACKOFFICE_DASHBOARD, element: <AdminDashboard /> },
                                    { path: ROUTES.BACKOFFICE_SCHOOLS, element: <AdminSchools /> },
                                    { path: ROUTES.BACKOFFICE_COURSES, element: <AdminCourses /> },
                                    { path: ROUTES.BACKOFFICE_SUBJECTS, element: <AdminSubjects /> },
                                    { path: ROUTES.BACKOFFICE_CLASSROOMS, element: <AdminClassrooms /> },
                                    { path: ROUTES.BACKOFFICE_PEOPLE, element: <AdminPeople /> },
                                    { path: ROUTES.BACKOFFICE_PROFSUBJ, element: <AdminProfSubj /> },
                                    { path: ROUTES.BACKOFFICE_COURSESUBJ, element: <AdminCourseSubj /> },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    },
]);

export default router;
