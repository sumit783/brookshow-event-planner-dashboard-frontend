

import { config } from '../config';
import { storage, db } from './storage';
import { addToSyncQueue } from './syncQueue';
import { getAuthToken } from './auth';
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

// Helper to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x_api_key': config.X_API_KEY,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

export const apiClient = {
  // Authentication
  async signup(data: {
    email: string;
    phone: string;
    displayName: string;
    countryCode: string;
    role: string;
  }): Promise<void> {
    return handleMockRequest('signup', async () => {
      // In a real implementation, this would call: POST /auth/signup
      // Store signup data temporarily (in production, this would be handled by backend)
      const signupData = {
        ...data,
        createdAt: Date.now(),
      };
      localStorage.setItem(`signup_${data.email}`, JSON.stringify(signupData));
      
      // Send OTP after signup
      await this.sendOtp(data.email);
      
      // In production, the backend would create the account and send OTP via email
      console.log(`[DEMO] Signup data for ${data.email}:`, signupData);
    });
  },

  async sendOtp(email: string): Promise<void> {
    try {
      const response = await fetch(`${config.API_BASE_URI}/api/auth/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x_api_key': config.X_API_KEY,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      return;
    } catch (error: any) {
      // Fallback to mock if API fails (for development)
      if (config.SIMULATE_OFFLINE || !navigator.onLine) {
        return handleMockRequest('sendOtp', async () => {
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          const otpData = {
            email,
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000,
          };
          localStorage.setItem(`otp_${email}`, JSON.stringify(otpData));
          console.log(`[DEMO] OTP for ${email}: ${otp}`);
        });
      }
      throw error;
    }
  },

  async verifyOtp(email: string, otp: string, isLogin: boolean = true): Promise<{
    jwtToken: string;
    expiresAt: number;
    user: {
      id: string;
      email: string;
      name?: string;
      role: string;
    };
  }> {
    try {
      const response = await fetch(`${config.API_BASE_URI}/api/auth/verify-email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x_api_key': config.X_API_KEY,
        },
        body: JSON.stringify({
          email,
          otp,
          isLogin,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to verify OTP');
      }

      // Ensure role is planner
      if (data.user?.role !== 'planner') {
        throw new Error('Invalid role. Only planners can access this dashboard.');
      }

      // Decode JWT to get expiration (basic parsing, in production use a JWT library)
      let expiresAt = Date.now() + 24 * 60 * 60 * 1000; // Default 24 hours
      try {
        const tokenParts = data.jwtToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          if (payload.exp) {
            expiresAt = payload.exp * 1000; // Convert to milliseconds
          }
        }
      } catch (e) {
        // If JWT parsing fails, use default expiration
        console.warn('Could not parse JWT expiration, using default');
      }

      return {
        jwtToken: data.jwtToken,
        expiresAt,
        user: {
          id: data.user._id || data.user.id,
          email: data.user.email,
          name: data.user.displayName || data.user.name,
          role: data.user.role,
        },
      };
    } catch (error: any) {
      // Fallback to mock if API fails (for development)
      if (config.SIMULATE_OFFLINE || !navigator.onLine) {
        return handleMockRequest('verifyOtp', async () => {
          const storedOtpData = localStorage.getItem(`otp_${email}`);
          
          if (!storedOtpData) {
            throw new Error('OTP not found. Please request a new code.');
          }

          const otpData = JSON.parse(storedOtpData);
          
          if (Date.now() > otpData.expiresAt) {
            localStorage.removeItem(`otp_${email}`);
            throw new Error('OTP has expired. Please request a new code.');
          }

          if (otpData.otp !== otp) {
            throw new Error('Invalid OTP. Please try again.');
          }

          localStorage.removeItem(`otp_${email}`);

          const signupDataStr = localStorage.getItem(`signup_${email}`);
          let displayName = email.split('@')[0];
          
          if (signupDataStr) {
            try {
              const signupData = JSON.parse(signupDataStr);
              displayName = signupData.displayName || displayName;
              localStorage.removeItem(`signup_${email}`);
            } catch (e) {
              // Ignore parsing errors
            }
          }

          const jwtToken = `mock_jwt_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

          return {
            jwtToken,
            expiresAt,
            user: {
              id: `user_${Date.now()}`,
              email,
              name: displayName,
              role: 'planner',
            },
          };
        });
      }
      throw error;
    }
  },

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
