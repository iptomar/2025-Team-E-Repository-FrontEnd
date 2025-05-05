import axios from "axios";

const API_BASE = import.meta.env.VITE_WS_URL;

export const fetchCoursesWithProfessors = async () => {
    const response = await axios.get(`${API_BASE}/api/admin/subjects-professors`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    return response.data;
};
