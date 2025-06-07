blocks fetcher

const API_BASE = import.meta.env.VITE_WS_URL;

export const fetchOverlappingBlocks = async ({start, end}) => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams({start, end });

  const res = await fetch(`${API_BASE}/api/schedules/overlapping-blocks?${params.toString()}`,{
    headers: {
      'Authorization': `Bearer ${token}`
  }
});
  if (!res.ok) throw new Error('Erro ao buscar blocos sobrepostos');
  return await res.json();
};