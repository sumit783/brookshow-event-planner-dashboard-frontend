export interface Planner {
  id: string;
  name: string;
  organization: string;
  verified: boolean;
}

export interface Event {
  id: string;
  _id: string;
  plannerProfileId: string; // "693d766778b2d82b299ae4e7"
  title: string;
  description: string;
  venue: string;
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  startAt: string; // "2025-12-31T18:30:00.000Z"
  endAt: string; // "2026-01-01T01:30:00.000Z"
  published: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  bannerUrl: string; // "/uploads/1765638393445-229183822.png"
  ticketData: TicketType[];
}

export interface TicketType {
  id: string;
  eventId: string;
  title: string;
  price: number;
  quantity: number;
  sold: number;
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
  rating: number;
  location: string;
  image: string;
  specialties: string[];
  price: number;
  price_for_event_planner: number;
}

export interface ArtistProfile {
  _id: string;
  userId: {
    _id: string;
    email: string;
    phone: string;
    displayName: string;
    role: string;
  };
  profileImage: string;
  bio: string;
  category: string[];
  location: {
    city: string;
    state: string;
    country: string;
  };
  verificationStatus: string;
  isVerified: boolean;
  media: {
    _id: string;
    type: 'image' | 'video';
    url: string;
    isCover: boolean;
  }[];
  price_for_event_planner?: number;
}

export interface Employee {
  _id: string;
  name: string; // Changed from displayName
  email: string;
  phone: string;
  countryCode?: string; // Not in response example, making optional
  role: string;
  isActive: boolean;
  createdAt?: string;
  plannerProfileId?: string; // Added from response
  employeeId?: string; // Added from response
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
