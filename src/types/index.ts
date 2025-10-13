export interface Planner {
  id: string;
  name: string;
  organization: string;
  verified: boolean;
}

export interface Event {
  id: string;
  plannerId: string;
  title: string;
  venue: string;
  start: string; // ISO date string
  end: string;
  description: string;
  images: string[]; // data URLs or URLs
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TicketType {
  id: string;
  eventId: string;
  title: string;
  price: number;
  quantity: number;
  sold: number;
  salesStart?: string;
  salesEnd?: string;
  perUserLimit?: number;
}

export interface Ticket {
  id: string;
  eventId: string;
  ticketTypeId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerPhoneMasked: string;
  qrDataUrl: string;
  qrPayload: string;
  issuedAt: string;
  scanned: boolean;
  scannedAt?: string;
  scannerId?: string;
}

export interface Artist {
  id: string;
  name: string;
  category: string;
  city: string;
  bio: string;
  imageUrl: string;
  price_for_event_planner: number;
  price_for_artists: number;
  verified: boolean;
}

export interface BookingRequest {
  id: string;
  eventId: string;
  artistId: string;
  proposedDate: string;
  proposedTime: string;
  price: number;
  status: 'pending' | 'confirmed' | 'rejected';
  createdAt: string;
}

export interface ScanLog {
  id: string;
  ticketId?: string;
  scannerId: string;
  timestamp: string;
  result: 'valid' | 'invalid' | 'duplicate' | 'error';
  deviceInfo: string;
  errorMessage?: string;
  synced: boolean;
}

export interface SyncQueueItem {
  id: string;
  action: string;
  payload: any;
  createdAt: string;
  retries: number;
  status: 'pending' | 'synced' | 'failed';
  errorMessage?: string;
}

export interface QRPayload {
  eventId: string;
  ticketId: string;
  buyerName: string;
  issuedAt: string;
  signature: string; // Placeholder for HMAC in production
}

export interface DashboardMetrics {
  upcomingEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  pendingScans: number;
  syncQueueLength: number;
}
