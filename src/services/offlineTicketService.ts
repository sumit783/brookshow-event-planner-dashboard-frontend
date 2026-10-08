import { request } from './apiBase';
import { config } from '../config';
import { storage, db } from './storage';
import QRCode from 'qrcode';
import {
  Event,
  TicketType,
  GeneratedOfflineTicket,
  OfflineTicketDesignConfig,
} from '../types';

export const offlineTicketService = {
  // Generate a batch of offline tickets via Backend API
  async generateOfflineTickets(params: {
    eventId: string;
    ticketTypeId?: string;
    quantity: number;
    buyerName?: string;
    buyerPhone?: string;
    designConfig?: OfflineTicketDesignConfig;
  }): Promise<GeneratedOfflineTicket[]> {
    const { eventId, ticketTypeId, quantity, buyerName, buyerPhone, designConfig } = params;

    try {
      // Call backend batch creation endpoint
      const response = await request<{
        success: boolean;
        message?: string;
        tickets: Array<Omit<GeneratedOfflineTicket, 'qrDataUrl'>>;
      }>('/api/planner/offline-tickets/batch', {
        method: 'POST',
        body: JSON.stringify({
          eventId,
          ticketTypeId: ticketTypeId || undefined,
          quantity: Number(quantity) || 1,
          buyerName: buyerName?.trim() || undefined,
          buyerPhone: buyerPhone?.trim() || undefined,
        }),
      });

      const rawTickets = response.tickets || [];

      // Generate Data URLs for QR codes for each returned ticket
      const processedTickets: GeneratedOfflineTicket[] = await Promise.all(
        rawTickets.map(async (t) => {
          const qrDataUrl = await QRCode.toDataURL(t.qrPayload || t.ticketId, {
            width: 300,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' },
          });

          return {
            ...t,
            qrDataUrl,
          };
        })
      );

      // Save design template locally for this event if provided
      if (designConfig) {
        await storage.set(db.settings, `offline_design_${eventId}`, designConfig);
      }

      return processedTickets;
    } catch (apiError: any) {
      console.warn('Backend batch generation failed, falling back to local generation:', apiError);

      // Fetch event details as fallback
      const event = await request<any>(`/api/planner/events/${eventId}`, {
        method: 'GET',
      });
      const currentEvent: Event = event.event || event;

      let ticketTypeTitle = 'General Admission';
      let ticketPrice = 0;

      if (ticketTypeId && currentEvent.ticketData) {
        const matched = currentEvent.ticketData.find((tt) => tt.id === ticketTypeId);
        if (matched) {
          ticketTypeTitle = matched.title;
          ticketPrice = matched.price;
        }
      } else if (currentEvent.ticketData && currentEvent.ticketData.length > 0) {
        ticketTypeTitle = currentEvent.ticketData[0].title;
        ticketPrice = currentEvent.ticketData[0].price;
      }

      const generatedTickets: GeneratedOfflineTicket[] = [];
      const timestamp = Date.now();

      for (let i = 1; i <= quantity; i++) {
        const randomHex = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
        const timeHex = Math.floor(timestamp / 1000).toString(16).padStart(8, '0');
        const counterHex = i.toString(16).padStart(8, '0');
        const ticketId = `${timeHex}${randomHex}${counterHex}`.slice(0, 24);

        const ticketNumber = `OFF-${currentEvent.title.slice(0, 3).toUpperCase()}-${String(timestamp).slice(-4)}-${String(i).padStart(4, '0')}`;
        const attendeeName = buyerName ? (quantity > 1 ? `${buyerName} #${i}` : buyerName) : `Walk-in Guest #${i}`;

        const qrPayload = JSON.stringify({
          ticketId: ticketId,
          eventId: currentEvent._id || currentEvent.id,
          buyerName: attendeeName,
          type: ticketTypeTitle,
          isOffline: true,
          ticketNumber: ticketNumber,
          timestamp: Date.now(),
        });

        const qrDataUrl = await QRCode.toDataURL(qrPayload, {
          width: 300,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
        });

        const newTicket: GeneratedOfflineTicket = {
          ticketId,
          ticketNumber,
          eventId: currentEvent._id || currentEvent.id,
          eventTitle: currentEvent.title,
          eventDate: currentEvent.startAt,
          eventVenue: `${currentEvent.venue || ''}${currentEvent.city ? ', ' + currentEvent.city : ''}`,
          ticketTypeId,
          ticketTypeName: ticketTypeTitle,
          ticketPrice: ticketPrice,
          qrPayload,
          qrDataUrl,
          buyerName: attendeeName,
          buyerPhone: buyerPhone || '',
          persons: 1,
          scannedPersons: 0,
          isValide: true,
          scanned: false,
          createdAt: new Date().toISOString(),
        };

        generatedTickets.push(newTicket);
      }

      if (designConfig) {
        await storage.set(db.settings, `offline_design_${eventId}`, designConfig);
      }

      return generatedTickets;
    }
  },

  // List all stored offline tickets (optionally filtered by event) via Backend API
  async listOfflineTickets(eventId?: string): Promise<GeneratedOfflineTicket[]> {
    try {
      const queryParam = eventId && eventId !== 'all' ? `?eventId=${encodeURIComponent(eventId)}` : '';
      const response = await request<{
        success: boolean;
        tickets: Array<Omit<GeneratedOfflineTicket, 'qrDataUrl'>>;
      }>(`/api/planner/offline-tickets${queryParam}`, {
        method: 'GET',
      });

      const rawTickets = response.tickets || [];

      // Generate QR data URLs for rendering
      return await Promise.all(
        rawTickets.map(async (t) => {
          let qrDataUrl = '';
          try {
            qrDataUrl = await QRCode.toDataURL(t.qrPayload || t.ticketId, {
              width: 300,
              margin: 1,
              color: { dark: '#000000', light: '#ffffff' },
            });
          } catch (e) {
            console.error('Error generating QR for ticket', t.ticketId, e);
          }

          return {
            ...t,
            qrDataUrl,
          };
        })
      );
    } catch (err) {
      console.warn('Backend listOfflineTickets failed, returning empty or fallback:', err);
      return [];
    }
  },

  // Update offline ticket details via Backend API
  async updateOfflineTicket(
    ticketId: string,
    updates: Partial<{ buyerName: string; buyerPhone: string; ticketTypeId: string; ticketTypeName: string; ticketPrice: number }>
  ): Promise<void> {
    await request<{ success: boolean; message?: string }>(`/api/planner/offline-tickets/${ticketId}`, {
      method: 'PUT',
      body: JSON.stringify({
        buyerName: updates.buyerName,
        buyerPhone: updates.buyerPhone,
        ticketTypeId: updates.ticketTypeId,
      }),
    });
  },

  // Delete an offline ticket via Backend API
  async deleteOfflineTicket(ticketId: string): Promise<void> {
    await request<{ success: boolean; message?: string }>(`/api/planner/offline-tickets/${ticketId}`, {
      method: 'DELETE',
    });
  },

  // Delete all offline tickets (or all offline tickets for an event)
  async deleteAllOfflineTickets(tickets: GeneratedOfflineTicket[]): Promise<void> {
    // Delete concurrently in batches of 6
    const chunkSize = 6;
    for (let i = 0; i < tickets.length; i += chunkSize) {
      const chunk = tickets.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map((t) =>
          request<{ success: boolean }>(`/api/planner/offline-tickets/${t.ticketId}`, {
            method: 'DELETE',
          }).catch((err) => console.warn(`Failed to delete ticket ${t.ticketId}:`, err))
        )
      );
    }
  },

  // Load saved design for event
  async getSavedDesign(eventId: string): Promise<OfflineTicketDesignConfig | null> {
    return storage.get<OfflineTicketDesignConfig>(db.settings, `offline_design_${eventId}`);
  },

  // Save design configuration
  async saveDesign(eventId: string, config: OfflineTicketDesignConfig): Promise<void> {
    await storage.set(db.settings, `offline_design_${eventId}`, config);
  },
};
