/**
 * API Client - Mock Adapter
 * 
 * This is a pluggable adapter that simulates backend API calls.
 * To integrate with a real backend:
 * 1. Replace mock implementations with actual fetch() calls to your API endpoints
 * 2. Update API_BASE_URL in config.ts
 * 3. Add authentication headers as needed
 * 4. Handle proper error responses
 * 
 * For QR signature validation:
 * - Replace the placeholder signature check with HMAC verification
 * - Use a shared secret key between frontend and backend
 * - Validate signature server-side before marking tickets as scanned
 */

import { config } from '../config';
import { storage, db } from './storage';
import { addToSyncQueue } from './syncQueue';
import type {
  Planner,
  Event,
  TicketType,
  Ticket,
  Artist,
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

export const apiClient = {
  // Planner
  async getPlanner(): Promise<Planner | null> {
    return handleMockRequest('getPlanner', async () => {
      return storage.get<Planner>(db.planner, 'current');
    });
  },

  // Events
  async listEvents(): Promise<Event[]> {
    return handleMockRequest('listEvents', async () => {
      return storage.getAll<Event>(db.events);
    });
  },

  async getEvent(id: string): Promise<Event | null> {
    return handleMockRequest('getEvent', async () => {
      return storage.get<Event>(db.events, id);
    });
  },

  async createEvent(payload: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    const event: Event = {
      ...payload,
      id: `event-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await storage.set(db.events, event.id, event);
    await addToSyncQueue('createEvent', event);

    return event;
  },

  async updateEvent(id: string, payload: Partial<Event>): Promise<Event> {
    const existing = await storage.get<Event>(db.events, id);
    if (!existing) throw new Error('Event not found');

    const updated: Event = {
      ...existing,
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    await storage.set(db.events, id, updated);
    await addToSyncQueue('updateEvent', updated);

    return updated;
  },

  async publishEvent(id: string, published: boolean): Promise<Event> {
    return this.updateEvent(id, { published });
  },

  async deleteEvent(id: string): Promise<void> {
    await storage.remove(db.events, id);
    await addToSyncQueue('deleteEvent', { id });
  },

  // Ticket Types
  async listTicketTypes(eventId: string): Promise<TicketType[]> {
    return handleMockRequest('listTicketTypes', async () => {
      const all = await storage.getAll<TicketType>(db.ticketTypes);
      return all.filter(tt => tt.eventId === eventId);
    });
  },

  async createTicketType(payload: Omit<TicketType, 'id' | 'sold'>): Promise<TicketType> {
    const ticketType: TicketType = {
      ...payload,
      id: `ticket-type-${Date.now()}`,
      sold: 0,
    };

    await storage.set(db.ticketTypes, ticketType.id, ticketType);
    await addToSyncQueue('createTicketType', ticketType);

    return ticketType;
  },

  async updateTicketType(id: string, payload: Partial<TicketType>): Promise<TicketType> {
    const existing = await storage.get<TicketType>(db.ticketTypes, id);
    if (!existing) throw new Error('Ticket type not found');

    const updated: TicketType = {
      ...existing,
      ...payload,
    };

    await storage.set(db.ticketTypes, id, updated);
    await addToSyncQueue('updateTicketType', updated);

    return updated;
  },

  // Ticket Purchase
  async purchaseTicket(
    eventId: string,
    ticketTypeId: string,
    buyer: { name: string; email: string; phone: string }
  ): Promise<Ticket> {
    // Get ticket type and validate inventory
    const ticketType = await storage.get<TicketType>(db.ticketTypes, ticketTypeId);
    if (!ticketType) throw new Error('Ticket type not found');
    if (ticketType.sold >= ticketType.quantity) throw new Error('Sold out');

    // Generate QR payload
    const ticketId = `ticket-${Date.now()}`;
    const qrPayload: QRPayload = {
      eventId,
      ticketId,
      buyerName: buyer.name,
      issuedAt: new Date().toISOString(),
      signature: 'mock-signature-' + ticketId, // TODO: Replace with HMAC in production
    };

    // Note: QR data URL will be generated separately using qrcode library
    const ticket: Ticket = {
      id: ticketId,
      eventId,
      ticketTypeId,
      buyerName: buyer.name,
      buyerEmail: buyer.email,
      buyerPhone: buyer.phone,
      buyerPhoneMasked: buyer.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'),
      qrDataUrl: '', // Will be set by caller after QR generation
      qrPayload: JSON.stringify(qrPayload),
      issuedAt: qrPayload.issuedAt,
      scanned: false,
    };

    // Update inventory
    await this.updateTicketType(ticketTypeId, {
      sold: ticketType.sold + 1,
    });

    // Save ticket
    await storage.set(db.tickets, ticket.id, ticket);
    await addToSyncQueue('purchaseTicket', ticket);

    return ticket;
  },

  // Ticket Scanning
  async scanTicket(qrPayload: string, scannerId: string): Promise<ScanLog> {
    return handleMockRequest('scanTicket', async () => {
      try {
        const payload: QRPayload = JSON.parse(qrPayload);
        const ticket = await storage.get<Ticket>(db.tickets, payload.ticketId);

        let result: 'valid' | 'invalid' | 'duplicate' | 'error' = 'invalid';
        let errorMessage: string | undefined;

        if (!ticket) {
          result = 'invalid';
          errorMessage = 'Ticket not found';
        } else if (ticket.scanned) {
          result = 'duplicate';
          errorMessage = `Already scanned at ${ticket.scannedAt}`;
        } else if (payload.signature !== 'mock-signature-' + payload.ticketId) {
          // TODO: Replace with HMAC validation in production
          result = 'invalid';
          errorMessage = 'Invalid signature';
        } else {
          result = 'valid';
          
          // Mark ticket as scanned
          const updated = {
            ...ticket,
            scanned: true,
            scannedAt: new Date().toISOString(),
            scannerId,
          };
          await storage.set(db.tickets, ticket.id, updated);
        }

        const scanLog: ScanLog = {
          id: `scan-${Date.now()}`,
          ticketId: payload.ticketId,
          scannerId,
          timestamp: new Date().toISOString(),
          result,
          deviceInfo: navigator.userAgent,
          errorMessage,
          synced: false,
        };

        await storage.set(db.scanLogs, scanLog.id, scanLog);
        await addToSyncQueue('scanTicket', scanLog);

        return scanLog;
      } catch (error: any) {
        const scanLog: ScanLog = {
          id: `scan-${Date.now()}`,
          scannerId,
          timestamp: new Date().toISOString(),
          result: 'error',
          deviceInfo: navigator.userAgent,
          errorMessage: error.message || 'Invalid QR code',
          synced: false,
        };

        await storage.set(db.scanLogs, scanLog.id, scanLog);
        return scanLog;
      }
    });
  },

  // Artists
  async searchArtists(filters: {
    category?: string;
    city?: string;
    query?: string;
  }): Promise<Artist[]> {
    return handleMockRequest('searchArtists', async () => {
      let artists = await storage.getAll<Artist>(db.artists);

      if (filters.category) {
        artists = artists.filter(a =>
          a.category.toLowerCase().includes(filters.category!.toLowerCase())
        );
      }

      if (filters.city) {
        artists = artists.filter(a =>
          a.city.toLowerCase().includes(filters.city!.toLowerCase())
        );
      }

      if (filters.query) {
        const q = filters.query.toLowerCase();
        artists = artists.filter(a =>
          a.name.toLowerCase().includes(q) || a.bio.toLowerCase().includes(q)
        );
      }

      return artists;
    });
  },

  // Bookings
  async createBooking(payload: Omit<BookingRequest, 'id' | 'status' | 'createdAt'>): Promise<BookingRequest> {
    const booking: BookingRequest = {
      ...payload,
      id: `booking-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await storage.set(db.bookings, booking.id, booking);
    await addToSyncQueue('createBooking', booking);

    return booking;
  },

  async listBookings(eventId?: string): Promise<BookingRequest[]> {
    return handleMockRequest('listBookings', async () => {
      const all = await storage.getAll<BookingRequest>(db.bookings);
      return eventId ? all.filter(b => b.eventId === eventId) : all;
    });
  },

  // Sync Queue
  async syncQueue(): Promise<void> {
    // This would flush the sync queue to the server
    // For now, it's a placeholder
    console.log('Sync queue flushed (mock)');
  },
};
