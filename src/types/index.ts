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
  salesStart: string;
  salesEnd: string;
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

export interface ArtistService {
  id: string;
  category: string;
  unit: string;
  price_for_user: number;
  price_for_planner: number;
  advance: number;
}

export interface ArtistServicesResponse {
  success: boolean;
  artistId: string;
  services: ArtistService[];
  count: number;
}

export interface ArtistAvailabilityRequest {
  artistId: string;
  serviceId: string;
  startAt: string; // ISO 8601 format
  endAt: string; // ISO 8601 format
}

export interface ArtistAvailabilityResponse {
  success: boolean;
  available: boolean;
  price: number;
  unit: string;
  basePrice: number;
  advance: number;
  duration?: {
    start: string;
    end: string;
    milliseconds: number;
  };
  message?: string;
  // Retaining some fields that might be useful for the UI or other parts of the app
  artist?: {
    id: string;
    name: string;
    category?: string[];
    location?: {
      city: string;
      state: string;
      country: string;
    };
  };
  service?: {
    id: string;
    category: string;
    unit: string;
    pricePerUnit?: number;
  };
  requestedTime?: {
    startDate: string;
    startTime: string;
    startAt: string;
    endDate: string;
    endTime: string;
    endAt: string;
  };
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

export interface ArtistBookingRequest {
  artistId: string;
  serviceId: string;
  eventId: string;
  startAt: string;
  endAt: string;
}

export interface ArtistBookingResponse {
  success: boolean;
  message: string;
  booking: {
    _id: string;
    clientId: string;
    artistId: {
      _id: string;
      userId: string;
      bio: string;
      category: string[];
      location: {
        city: string;
        state: string;
        country: string;
      };
    };
    serviceId: {
      _id: string;
      category: string;
      unit: string;
      price_for_planner: number;
    };
    eventId: {
      _id: string;
      title: string;
      startAt: string;
      endAt: string;
    };
    source: string;
    startAt: string;
    endAt: string;
    totalPrice: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
  };
  remainingBalance: number;
}

export interface PlannerProfileResponse {
  _id: string;
  userId: string;
  organization: string;
  logoUrl: string;
  verified: boolean;
  verificationNote: string;
  walletBalance: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
  bookedArtists: {
    _id: string;
    clientId: string;
    artistId: {
      _id: string;
      userId: {
        _id: string;
        email: string;
        phone: string;
        displayName: string;
      };
      profileImage: string;
      bio: string;
      category: string[];
      location: {
        city: string;
        state: string;
        country: string;
      };
    };
    serviceId: {
      _id: string;
      category: string;
      unit: string;
      price_for_planner: number;
    };
    eventId: {
      _id: string;
      title: string;
      venue: string;
      address: string;
      city: string;
      state: string;
      startAt: string;
      endAt: string;
    };
    source: string;
    startAt: string;
    endAt: string;
    totalPrice: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  }[];
}

export interface WalletData {
  success: boolean;
  walletBalance: number;
  totalIncome: number;
  totalExpense: number;
}

export interface Transaction {
  _id: string;
  ownerId: string;
  ownerType: string;
  type: 'credit' | 'debit';
  amount: number;
  source: string;
  referenceId: string | null;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface BankDetail {
  _id: string;
  userId: string;
  accountHolderName?: string;
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  upiId?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface BankDetailsResponse {
  success: boolean;
  bankDetails: BankDetail[];
}

export interface WithdrawalRequest {
  _id: string;
  userId: string;
  userType: string;
  amount: number;
  status: 'pending' | 'processed' | 'rejected';
  bankDetails: {
    upiId?: string;
    accountNumber?: string;
    bankName?: string;
    accountHolderName?: string;
  };
  transactionId: Transaction;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface WithdrawalRequestsResponse {
  success: boolean;
  count: number;
  requests: WithdrawalRequest[];
}

export interface BookedArtist {
  _id: string;
  artistId: {
    _id: string;
    userId: {
      _id: string;
      displayName: string;
    };
    profileImage: string;
    category: string[];
    location: {
      city: string;
      state: string;
      country: string;
    };
  };
  serviceId: {
    _id: string;
    category: string;
    unit: string;
  };
  eventId: {
    _id: string;
    title: string;
  };
  startAt: string;
  endAt: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export interface BookedArtistsResponse {
  success: boolean;
  count: number;
  bookings: BookedArtist[];
}

export interface BookingDetails {
  _id: string;
  clientId: string;
  artistId: {
    _id: string;
    userId: {
      _id: string;
      displayName: string;
      email?: string;
      phone?: string;
      countryCode?: string;
    };
    profileImage: string;
    bio?: string;
    category: string[];
    location: {
      city: string;
      state: string;
      country: string;
    };
  };
  serviceId: {
    _id: string;
    category: string;
    unit: string;
    price_for_planner?: number;
  };
  eventId: {
    _id: string;
    title: string;
    venue?: string;
    address?: string;
    city?: string;
    state?: string;
    startAt?: string;
    endAt?: string;
  };
  source: string;
  startAt: string;
  endAt: string;
  totalPrice: number;
  paidAmount: number;
  advanceAmount: number;
  status: string; // confirmed, cancelled, pending
  paymentStatus: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  createdAt: string;
  updatedAt: string;
}
