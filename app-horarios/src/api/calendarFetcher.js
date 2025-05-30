const API_BASE = import.meta.env.VITE_WS_URL;

// Fetch all events for the current user/semester
export const fetchEvents = async (token) => {
    const response = await fetch(`${API_BASE}/api/calendar/events`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar eventos');
    }
    return data; // Should be an array of events
};

// Create a new event
export const createEvent = async (scheduleId, token, event) => {
    const response = await fetch(`${API_BASE}/api/schedules/${scheduleId}/blocks`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
    });
    const data = await response.json();
    if (!response.ok) {
        console.error('Erro do servidor:', data);
        throw new Error(data.error || data.message || 'Erro ao criar evento');
    }
    return data;
};


// Update an existing event
export const updateEvent = async (token, eventId, updatedEvent) => {
    const response = await fetch(`${API_BASE}/api/calendar/events/${eventId}`, {
        method: 'PUT', // or 'PATCH' if partial updates
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEvent),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Erro ao atualizar evento');
    }
    return data;
};

// Delete an event
export const deleteEvent = async (token, eventId) => {
    const response = await fetch(`${API_BASE}/api/calendar/events/${eventId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao apagar evento');
    }
    return true;
};

// Create schedule
export const createSchedule = async ({ courseId, name, startDate, endDate, curricularYear, class: className }) => {
    const user = JSON.parse(localStorage.getItem('user'));

    const response = await fetch(`${API_BASE}/api/schedules`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            courseId,
            name,
            startDate,
            endDate,
            curricularYear,
            class: className,
            createdBy: user.id
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Erro ao criar calendário');
    }

    return response.json();
};


export const fetchUserSchedules = async (token) => {
    const response = await fetch(`${API_BASE}/api/schedules/user/me`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar calendários');
    }
    return data;
};

// Add this function to your existing calendarFetcher.js file
export const fetchScheduleById = async (scheduleId, token) => {
    const response = await fetch(`${API_BASE}/api/schedules/${scheduleId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar horário');
    }
    return data;
};
