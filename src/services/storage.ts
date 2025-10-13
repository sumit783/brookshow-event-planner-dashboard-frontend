import localforage from 'localforage';

// Configure localforage instances
export const db = {
  planner: localforage.createInstance({ name: 'brookshow', storeName: 'planner' }),
  events: localforage.createInstance({ name: 'brookshow', storeName: 'events' }),
  ticketTypes: localforage.createInstance({ name: 'brookshow', storeName: 'ticketTypes' }),
  tickets: localforage.createInstance({ name: 'brookshow', storeName: 'tickets' }),
  artists: localforage.createInstance({ name: 'brookshow', storeName: 'artists' }),
  bookings: localforage.createInstance({ name: 'brookshow', storeName: 'bookings' }),
  scanLogs: localforage.createInstance({ name: 'brookshow', storeName: 'scanLogs' }),
  syncQueue: localforage.createInstance({ name: 'brookshow', storeName: 'syncQueue' }),
  settings: localforage.createInstance({ name: 'brookshow', storeName: 'settings' }),
};

// Generic storage helpers
export const storage = {
  async get<T>(store: LocalForage, key: string): Promise<T | null> {
    return store.getItem<T>(key);
  },

  async set<T>(store: LocalForage, key: string, value: T): Promise<T> {
    return store.setItem(key, value);
  },

  async getAll<T>(store: LocalForage): Promise<T[]> {
    const items: T[] = [];
    await store.iterate<T, void>((value) => {
      items.push(value);
    });
    return items;
  },

  async remove(store: LocalForage, key: string): Promise<void> {
    return store.removeItem(key);
  },

  async clear(store: LocalForage): Promise<void> {
    return store.clear();
  },

  async getAllKeys(store: LocalForage): Promise<string[]> {
    return store.keys();
  },
};

// Initialize default data
export async function initializeDefaultData() {
  const existingPlanner = await storage.get(db.planner, 'current');
  
  if (!existingPlanner) {
    // Create default planner
    await storage.set(db.planner, 'current', {
      id: 'planner-1',
      name: 'Demo Planner',
      organization: 'BrookShow Events',
      verified: true,
    });

    // Create sample events
    const sampleEvents = [
      {
        id: 'event-1',
        plannerId: 'planner-1',
        title: 'Summer Music Festival 2025',
        venue: 'City Park Amphitheater',
        start: '2025-07-15T18:00:00',
        end: '2025-07-15T23:00:00',
        description: 'Join us for an unforgettable evening of live music featuring top local and international artists.',
        images: [],
        published: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'event-2',
        plannerId: 'planner-1',
        title: 'Tech Conference 2025',
        venue: 'Downtown Convention Center',
        start: '2025-08-20T09:00:00',
        end: '2025-08-22T17:00:00',
        description: 'Three days of innovation, networking, and learning from industry leaders.',
        images: [],
        published: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const event of sampleEvents) {
      await storage.set(db.events, event.id, event);
    }

    // Create sample ticket types
    const sampleTicketTypes = [
      {
        id: 'ticket-type-1',
        eventId: 'event-1',
        title: 'General Admission',
        price: 50,
        quantity: 500,
        sold: 234,
      },
      {
        id: 'ticket-type-2',
        eventId: 'event-1',
        title: 'VIP Pass',
        price: 150,
        quantity: 100,
        sold: 87,
      },
      {
        id: 'ticket-type-3',
        eventId: 'event-2',
        title: 'Early Bird',
        price: 299,
        quantity: 200,
        sold: 45,
      },
    ];

    for (const ticketType of sampleTicketTypes) {
      await storage.set(db.ticketTypes, ticketType.id, ticketType);
    }

    // Create sample artists
    const sampleArtists = [
      {
        id: 'artist-1',
        name: 'The Electric Waves',
        category: 'Rock Band',
        city: 'New York',
        bio: 'High-energy rock band with chart-topping hits.',
        imageUrl: '',
        price_for_event_planner: 5000,
        price_for_artists: 3000,
        verified: true,
      },
      {
        id: 'artist-2',
        name: 'DJ Midnight',
        category: 'Electronic/DJ',
        city: 'Los Angeles',
        bio: 'World-renowned DJ spinning the hottest tracks.',
        imageUrl: '',
        price_for_event_planner: 8000,
        price_for_artists: 5000,
        verified: true,
      },
      {
        id: 'artist-3',
        name: 'Jazz Ensemble',
        category: 'Jazz',
        city: 'Chicago',
        bio: 'Smooth jazz ensemble perfect for upscale events.',
        imageUrl: '',
        price_for_event_planner: 3000,
        price_for_artists: 2000,
        verified: true,
      },
    ];

    for (const artist of sampleArtists) {
      await storage.set(db.artists, artist.id, artist);
    }

    // Initialize settings
    await storage.set(db.settings, 'scanner', {
      scannerId: 'scanner-1',
      deviceName: 'Scanner 1',
    });
  }
}
