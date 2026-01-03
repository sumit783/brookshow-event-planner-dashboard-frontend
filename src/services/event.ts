import { request } from './apiBase';
import { config } from '../config';
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

export const eventService = {
    // Events
    async listEvents(): Promise<Event[]> {
        const data = await request<any>(`/api/planner/events`, {
            method: 'GET',
        });
        return data.events || data; // Handle likely response format
    },

    async listEventsForBooking(): Promise<Event[]> {
        const data = await request<any>(`/api/planner/events-list`, {
            method: 'GET',
        });
        return data.events || [];
    },

    async getEvent(id: string): Promise<Event | null> {
        const data = await request<any>(`/api/planner/events/${id}`, {
            method: 'GET',
        });
        return data.event || data;
    },

    async createEvent(payload: Omit<Event, '_id' | 'createdAt' | 'updatedAt' | '__v'> | FormData): Promise<Event> {
        const data = await request<any>(`/api/planner/events`, {
            method: 'POST',
            body: payload instanceof FormData ? payload : JSON.stringify(payload),
        });
        return data.event || data;
    },

    async updateEvent(id: string, payload: Partial<Event> | FormData): Promise<Event> {
        const data = await request<any>(`/api/planner/events/${id}`, {
            method: 'PUT',
            body: payload instanceof FormData ? payload : JSON.stringify(payload),
        });
        return data.event || data;
    },

    async publishEvent(id: string, published: boolean): Promise<Event> {
        // Assuming backend handles partial updates via PUT or a specific patch endpoint
        // Using updateEvent for now
        return this.updateEvent(id, { published });
    },

    async deleteEvent(id: string): Promise<void> {
        return request<void>(`/api/planner/events/${id}`, {
            method: 'DELETE',
        });
    },

    // Ticket Types
    async listTicketTypes(eventId: string): Promise<TicketType[]> {
        const data = await request<any>(`/api/planner/events/${eventId}/ticket-types`, {
            method: 'GET',
        });
        return data.ticketTypes || data;
    },

    async createTicketType(payload: Omit<TicketType, 'id' | 'sold'>): Promise<TicketType> {
        const data = await request<any>(`/api/planner/tickets`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        return data.ticketType || data;
    },

    async updateTicketType(id: string, payload: Partial<TicketType>): Promise<TicketType> {
        const data = await request<any>(`/api/planner/tickets/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
        return data.ticketType || data; // Adjust based on actual response
    },

    // Ticket Purchase & Scanning (Keep mock or implement if backend exists? User said "remove all dummy data", implies backend exists)
    // I will assume backend endpoints exist.
    async purchaseTicket(
        eventId: string,
        ticketTypeId: string,
        buyer: { name: string; email: string; phone: string }
    ): Promise<Ticket> {
        const data = await request<any>(`/api/planner/tickets/purchase`, {
            method: 'POST',
            body: JSON.stringify({ eventId, ticketTypeId, ...buyer })
        });
        return data.ticket || data;
    },

    async scanTicket(qrPayload: string, scannerId: string): Promise<ScanLog> {
        const data = await request<any>(`/api/planner/tickets/scan`, {
            method: 'POST',
            body: JSON.stringify({ qrPayload, scannerId })
        });
        return data.scanLog || data;
    },

    async getDashboardMetrics(): Promise<any[]> {
        const data = await request<any>(`/api/planner/dashboard/metrics`, {
            method: 'GET',
        });
        return data.data || [];
    },

    async getDashboardRevenue(): Promise<any[]> {
        const data = await request<any>(`/api/planner/dashboard/revenue`, {
            method: 'GET',
        });
        return data.data || [];
    },

    async getDashboardTicketDistribution(): Promise<any[]> {
        const data = await request<any>(`/api/planner/dashboard/ticket-distribution`, {
            method: 'GET',
        });
        return data.data || [];
    },

    async getDashboardRecentEvents(): Promise<any[]> {
        const data = await request<any>(`/api/planner/dashboard/recent-events`, {
            method: 'GET',
        });
        return data.data || [];
    }
};
