// Routes used for router
export const ROUTES = {
    LOGIN: "/",
    HOME: "home",
    CALENDAR_ROOT: "calendar/",
        CALENDAR_LISTING: "",
        CALENDAR_CREATE: "create",
        CALENDAR_VIEW: ":scheduleId/view",
};

// Full route paths for navigation
export const FULL_ROUTES = {
    LOGIN: ROUTES.LOGIN,
    HOME: ROUTES.HOME,
    CALENDAR_HOME: ROUTES.CALENDAR_ROOT,
    CALENDAR_LISTING: `${ROUTES.CALENDAR_ROOT}${ROUTES.CALENDAR_LISTING}`,
    CALENDAR_CREATE: `${ROUTES.CALENDAR_ROOT}${ROUTES.CALENDAR_CREATE}`,
    CALENDAR_VIEW: `${ROUTES.CALENDAR_ROOT}${ROUTES.CALENDAR_VIEW}`,
};
