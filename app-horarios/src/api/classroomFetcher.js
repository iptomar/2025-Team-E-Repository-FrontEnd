const API_BASE = import.meta.env.VITE_WS_URL;

//Fetch all classrooms
export const fetchClassrooms = async () => {
    const response = await fetch(`${API_BASE}/api/admin/classrooms`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
        },
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar eventos');
    }
    return data;
};