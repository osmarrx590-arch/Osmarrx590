// Configuração central da URL da API
// Em desenvolvimento: http://127.0.0.1:8000
// Em produção: usa VITE_API_URL (configurado no Render)
export const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// Funções auxiliares para chamadas à API
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
    const url = `${API_URL}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });
    
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }
    
    return response;
}