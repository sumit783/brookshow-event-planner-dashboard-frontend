

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
  Employee,
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
          'x-api-key': config.X_API_KEY,
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
          'x-api-key': config.X_API_KEY,
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

  // Employees
  async listEmployees(): Promise<Employee[]> {
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'x-api-key': config.X_API_KEY,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const response = await fetch(`${config.API_BASE_URI}/api/planner/employees`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch employees: ${response.statusText}`);
      }

      const data = await response.json();
      const employees = data.employees || data;
      return (Array.isArray(employees) ? employees : []).map((emp: any) => ({
        ...emp,
        name: emp.displayName || emp.name, // Ensure frontend uses 'name'
      }));
    } catch (error) {
      console.error("Error fetching employees:", error);
      // Fallback for dev/demo if needed, but error preferred if API is real
      throw error;
    }
  },

  async createEmployee(payload: any): Promise<Employee> {
    const headers = getAuthHeaders();
    const response = await fetch(`${config.API_BASE_URI}/api/planner/employees`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to create employee');
    }

    return response.json();
  },

  async updateEmployee(id: string, payload: Partial<Employee>): Promise<Employee> {
    const headers = getAuthHeaders();
    const body = { ...payload };
    if (body.name) {
      (body as any).displayName = body.name;
      delete body.name;
    }

    const response = await fetch(`${config.API_BASE_URI}/api/planner/employees/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error('Failed to update employee');
    }

    return response.json();
  },

  async deleteEmployee(id: string): Promise<void> {
    const headers = getAuthHeaders();
    const response = await fetch(`${config.API_BASE_URI}/api/planner/employees/${id}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      throw new Error('Failed to deactivate employee');
    }
  },

  async getEmployee(id: string): Promise<Employee> {
    const headers = getAuthHeaders();
    const response = await fetch(`${config.API_BASE_URI}/api/planner/employees/${id}`, {
      headers
    });

    if (!response.ok) throw new Error('Failed to fetch employee');
    return response.json();
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
          a.location.toLowerCase().includes(filters.city!.toLowerCase())
        );
      }

      if (filters.query) {
        const q = filters.query.toLowerCase();
        artists = artists.filter(a =>
          a.name.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.location.toLowerCase().includes(q)
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
