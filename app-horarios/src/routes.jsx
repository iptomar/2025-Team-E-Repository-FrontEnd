/**
 * Route configuration constants for React Router
 * These are the relative path segments used in router configuration
 */
export const ROUTES = {
    /** Root login path */
    LOGIN: "/",
    /** Home dashboard path */
    HOME: "/home",

    /** Calendar section root path */
    CALENDAR_ROOT: "/calendar/",
    /** Calendar listing page (empty string = index route) */
    CALENDAR_LISTING: "",
    /** Calendar creation page */
    CALENDAR_CREATE: "create",
    /** Calendar view page with dynamic schedule ID */
    CALENDAR_VIEW: ":scheduleId/view",

    /** Backoffice section root path */
    BACKOFFICE_ROOT: "backoffice/",
    /** Backoffice dashboard (empty string = index route) */
    BACKOFFICE_DASHBOARD: "",
    /** Schools management page */
    BACKOFFICE_SCHOOLS: "schools",
    /** Courses management page */
    BACKOFFICE_COURSES: "courses",
    /** Subjects management page */
    BACKOFFICE_SUBJECTS: "subjects",
    /** Classrooms management page */
    BACKOFFICE_CLASSROOMS: "classrooms",
    /** People management page */
    BACKOFFICE_PEOPLE: "people",
    /** Professor-Subject relationships page */
    BACKOFFICE_PROFSUBJ: "profsubj",
    /** Course-Subject relationships page */
    BACKOFFICE_COURSESUBJ: "coursesubj",
};

/**
 * Complete route paths for navigation
 * Use these for programmatic navigation with navigate() or Link components
 *
 * @example
 * // Navigate to calendar creation page
 * navigate(FULL_ROUTES.CALENDAR.CREATE);
 *
 * // Use in Link component
 * <Link to={FULL_ROUTES.BACKOFFICE.SCHOOLS}>Schools</Link>
 */
export const FULL_ROUTES = {
    /** Login page route */
    LOGIN: ROUTES.LOGIN,
    /** Home dashboard route */
    HOME: ROUTES.HOME,

    /** Calendar section routes */
    CALENDAR: {
        /** Calendar section home - /calendar/ */
        HOME: ROUTES.CALENDAR_ROOT,
        /** Calendar listing page - /calendar/ */
        LISTING: `${ROUTES.CALENDAR_ROOT}${ROUTES.CALENDAR_LISTING}`,
        /** Calendar creation page - /calendar/create */
        CREATE: `${ROUTES.CALENDAR_ROOT}${ROUTES.CALENDAR_CREATE}`,
        /** Calendar view page - /calendar/:scheduleId/view */
        VIEW: `${ROUTES.CALENDAR_ROOT}${ROUTES.CALENDAR_VIEW}`,
    },

    /** Backoffice administration routes */
    BACKOFFICE: {
        /** Backoffice section home - /backoffice/ */
        HOME: ROUTES.BACKOFFICE_ROOT,
        /** Main dashboard - /backoffice/ */
        DASHBOARD: `${ROUTES.BACKOFFICE_ROOT}${ROUTES.BACKOFFICE_DASHBOARD}`,
        /** Schools management - /backoffice/schools */
        SCHOOLS: `${ROUTES.BACKOFFICE_ROOT}${ROUTES.BACKOFFICE_SCHOOLS}`,
        /** Courses management - /backoffice/courses */
        COURSES: `${ROUTES.BACKOFFICE_ROOT}${ROUTES.BACKOFFICE_COURSES}`,
        /** Subjects management - /backoffice/subjects */
        SUBJECTS: `${ROUTES.BACKOFFICE_ROOT}${ROUTES.BACKOFFICE_SUBJECTS}`,
        /** Classrooms management - /backoffice/classrooms */
        CLASSROOMS: `${ROUTES.BACKOFFICE_ROOT}${ROUTES.BACKOFFICE_CLASSROOMS}`,
        /** People management - /backoffice/people */
        PEOPLE: `${ROUTES.BACKOFFICE_ROOT}${ROUTES.BACKOFFICE_PEOPLE}`,
        /** Professor-Subject relationships - /backoffice/profsubj */
        PROFSUBJ: `${ROUTES.BACKOFFICE_ROOT}${ROUTES.BACKOFFICE_PROFSUBJ}`,
        /** Course-Subject relationships - /backoffice/coursesubj */
        COURSESUBJ: `${ROUTES.BACKOFFICE_ROOT}${ROUTES.BACKOFFICE_COURSESUBJ}`,
    },
};
