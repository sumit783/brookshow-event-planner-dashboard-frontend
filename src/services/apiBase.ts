
import { config } from '../config';
import { getAuthToken, clearAuth } from './auth';

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getAuthToken();
    const headers = new Headers(options.headers);

    // Set default headers
    if (!headers.has('x-api-key')) {
        headers.set('x-api-key', config.X_API_KEY);
    }

    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // Set Content-Type for JSON objects if not already set and not FormData
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const url = endpoint.startsWith('http') ? endpoint : `${config.API_BASE_URI}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        clearAuth();
        // Use window.location.href to force a full reload and redirect to login
        // This is a simple way to handle unauthorized state globally
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return response.json();
}
