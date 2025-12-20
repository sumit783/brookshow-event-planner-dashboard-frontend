import { config } from '../config';
import { storage, db } from './storage';
import { addToSyncQueue } from './syncQueue';
import { getAuthToken } from './auth';
import type {
    Event,
    TicketType,
    Ticket,
    BookingRequest,
    QRPayload,
    ScanLog,
} from '../types';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Check if we should simulate offline or failure
function shouldSimulateOffline(): boolean {
    return config.SIMULATE_OFFLINE;
}

function shouldSimulateFailure(): boolean {
    return Math.random() < config.SIMULATE_FAILURE_RATE;
}

async function handleMockRequest<T>(
    action: string,
    mockFn: () => Promise<T>,
    addToQueue: boolean = false
): Promise<T> {
    if (shouldSimulateOffline()) {
        throw new Error('Network offline (simulated)');
    }

    if (shouldSimulateFailure()) {
        throw new Error('Request failed (simulated)');
    }

    await delay(300 + Math.random() * 700); // 300-1000ms delay

    return mockFn();
}

// Helper to get auth headers
function getAuthHeaders(): HeadersInit {
    const token = getAuthToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'x-api-key': config.X_API_KEY,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

export const eventService = {
    // Events
    async listEvents(): Promise<Event[]> {
        const headers = getAuthHeaders();
        const response = await fetch(`${config.API_BASE_URI}/api/planner/events`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) throw new Error('Failed to fetch events');
        const data = await response.json();
        return data.events || data; // Handle likely response format
    },

    async listEventsForBooking(): Promise<Event[]> {
        const headers = getAuthHeaders();
        const response = await fetch(`${config.API_BASE_URI}/api/planner/events-list`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) throw new Error('Failed to fetch events list');
        const data = await response.json();
        return data.events || [];
    },

    async getEvent(id: string): Promise<Event | null> {
        const headers = getAuthHeaders();
        const response = await fetch(`${config.API_BASE_URI}/api/planner/events/${id}`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) throw new Error('Failed to fetch event');
        const data = await response.json();
        return data.event || data;
    },

    async createEvent(payload: Omit<Event, '_id' | 'createdAt' | 'updatedAt' | '__v'> | FormData): Promise<Event> {
        const token = getAuthToken();
        const headers: HeadersInit = {
            'x-api-key': config.X_API_KEY,
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };

        // If payload is not FormData, set Content-Type
        if (!(payload instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(`${config.API_BASE_URI}/api/planner/events`, {
            method: 'POST',
            headers,
            body: payload instanceof FormData ? payload : JSON.stringify(payload),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to create event');
        }
        const data = await response.json();
        return data.event || data;
    },

    async updateEvent(id: string, payload: Partial<Event> | FormData): Promise<Event> {
        const token = getAuthToken();
        const headers: HeadersInit = {
            'x-api-key': config.X_API_KEY,
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };

        if (!(payload instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(`${config.API_BASE_URI}/api/planner/events/${id}`, {
            method: 'PUT',
            headers,
            body: payload instanceof FormData ? payload : JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Failed to update event');
        const data = await response.json();
        return data.event || data;
    },

    async publishEvent(id: string, published: boolean): Promise<Event> {
        // Assuming backend handles partial updates via PUT or a specific patch endpoint
        // Using updateEvent for now
        return this.updateEvent(id, { published });
    },

    async deleteEvent(id: string): Promise<void> {
        const headers = getAuthHeaders();
        const response = await fetch(`${config.API_BASE_URI}/api/planner/events/${id}`, {
            method: 'DELETE',
            headers,
        });

        if (!response.ok) throw new Error('Failed to delete event');
    },

    // Ticket Types
    async listTicketTypes(eventId: string): Promise<TicketType[]> {
        const headers = getAuthHeaders();
        // Assuming endpoint: /api/planner/events/:eventId/ticket-types
        const response = await fetch(`${config.API_BASE_URI}/api/planner/events/${eventId}/ticket-types`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) throw new Error('Failed to fetch ticket types');
        const data = await response.json();
        return data.ticketTypes || data;
    },

    async createTicketType(payload: Omit<TicketType, 'id' | 'sold'>): Promise<TicketType> {
        const headers = getAuthHeaders();
        const response = await fetch(`${config.API_BASE_URI}/api/planner/ticket-types`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Failed to create ticket type');
        const data = await response.json();
        return data.ticketType || data;
    },

    async updateTicketType(id: string, payload: Partial<TicketType>): Promise<TicketType> {
        const headers = getAuthHeaders();
        const response = await fetch(`${config.API_BASE_URI}/api/planner/ticket-types/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Failed to update ticket type');
        const data = await response.json();
        return data.ticketType || data; // Adjust based on actual response
    },

    // Ticket Purchase & Scanning (Keep mock or implement if backend exists? User said "remove all dummy data", implies backend exists)
    // I will assume backend endpoints exist.
    async purchaseTicket(
        eventId: string,
        ticketTypeId: string,
        buyer: { name: string; email: string; phone: string }
    ): Promise<Ticket> {
        const headers = getAuthHeaders();
        const response = await fetch(`${config.API_BASE_URI}/api/planner/tickets/purchase`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ eventId, ticketTypeId, ...buyer })
        });

        if (!response.ok) throw new Error('Failed to purchase ticket');
        const data = await response.json();
        return data.ticket || data;
    },

    async scanTicket(qrPayload: string, scannerId: string): Promise<ScanLog> {
        const headers = getAuthHeaders();
        const response = await fetch(`${config.API_BASE_URI}/api/planner/tickets/scan`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ qrPayload, scannerId })
        });

        if (!response.ok) {
            // Even if 400 (invalid), we might want to return the error scan log from backend if it returns one
            // For now throw
            const err = await response.json();
            throw new Error(err.message || 'Scan failed');
        }
        const data = await response.json();
        return data.scanLog || data;
    }
};
