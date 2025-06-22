const API_BASE = import.meta.env.VITE_WS_URL;


// Fetch all the courses that a user has
export const fetchUserCourses = async (token) => {
  const response = await fetch(`${API_BASE}/api/schedules/user/courses`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Erro ao buscar cursos");
  }
  // data = [{ id, name }]
  return data;
};


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


// Update an event
export const updateEvent = async (token, eventId, updateEvent) => {
    const response = await fetch(`${API_BASE}/api/schedules/blocks/${eventId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateEvent),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Erro ao atualizar bloco');
    }
    return data;
};


// Delete an event
// Delete a block (updated to match your backend route)
export const deleteEvent = async (token, eventId) => {
    const response = await fetch(`${API_BASE}/api/schedules/blocks/${eventId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao apagar bloco');
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


export const fetchUserSchedules = async (
  token,
  page = 1,
  limit = 5,
  search = "",
  turma = "",
  ano = "",
  courseId = ""         
) => {
  const url = new URL(`${API_BASE}/api/schedules/user/me`);
  url.searchParams.append("page", page);
  url.searchParams.append("limit", limit);
  if (search) url.searchParams.append("search", search);
  if (turma)  url.searchParams.append("class", turma);
  if (ano)    url.searchParams.append("curricularYear", ano);
  if (courseId) url.searchParams.append("course", courseId); // <— aqui

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Erro ao buscar calendários");
  }

  return {
    schedules: data.items,
    total: data.totalCount,
  };
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
