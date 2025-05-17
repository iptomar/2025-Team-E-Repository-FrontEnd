const API_BASE = import.meta.env.VITE_WS_URL;

export const login = async (email, password) => {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({email, password}),
    });
    
    const data = await response.json();

    if(!response.ok) {
        throw new Error(data.message || 'Erro ao fazer o login');
    }

    return data;
};

