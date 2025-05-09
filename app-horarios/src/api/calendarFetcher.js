﻿const API_BASE = import.meta.env.VITE_WS_URL;

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
export const createEvent = async (token, event) => {
    const response = await fetch(`${API_BASE}/api/calendar/events`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar evento');
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
