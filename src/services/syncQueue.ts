/**
 * Sync Queue - Handles offline-first data synchronization
 * 
 * This module manages a queue of actions that need to be synced with the server.
 * When online, it attempts to flush the queue with retry logic and exponential backoff.
 * 
 * Integration notes:
 * - Replace mock sync logic with actual API calls in flushQueue()
 * - Implement server-side validation for all queued actions
 * - Consider using background sync API for better UX
 */

import { config } from '../config';
import { storage, db } from './storage';
import type { SyncQueueItem } from '../types';

export async function addToSyncQueue(action: string, payload: any): Promise<void> {
  const item: SyncQueueItem = {
    id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    action,
    payload,
    createdAt: new Date().toISOString(),
    retries: 0,
    status: 'pending',
  };

  await storage.set(db.syncQueue, item.id, item);
  
  // Trigger sync attempt
  setTimeout(() => flushQueue(), 1000);
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  return storage.getAll<SyncQueueItem>(db.syncQueue);
}

export async function flushQueue(): Promise<void> {
  if (config.SIMULATE_OFFLINE) {
    console.log('Offline mode - skipping sync');
    return;
  }

  const queue = await getSyncQueue();
  const pending = queue.filter(item => item.status === 'pending');

  for (const item of pending) {
    try {
      // TODO: Replace with actual API call based on item.action
      // Example:
      // if (item.action === 'createEvent') {
      //   await fetch(`${config.API_BASE_URL}/events`, {
      //     method: 'POST',
      //     body: JSON.stringify(item.payload),
      //   });
      // }

      // Mock success
      await new Promise(resolve => setTimeout(resolve, 100));

      // Mark as synced
      const updated: SyncQueueItem = {
        ...item,
        status: 'synced',
      };
      await storage.set(db.syncQueue, item.id, updated);

      // Update associated scan logs
      if (item.action === 'scanTicket' && item.payload.id) {
        const scanLog = await storage.get<any>(db.scanLogs, item.payload.id);
        if (scanLog) {
          await storage.set(db.scanLogs, item.payload.id, {
            ...scanLog,
            synced: true,
          });
        }
      }
    } catch (error: any) {
      console.error('Sync failed for item:', item.id, error);

      const retries = item.retries + 1;
      const shouldRetry = retries < config.SYNC_RETRY_MAX;

      if (shouldRetry) {
        // Retry with exponential backoff
        const delay =
          config.SYNC_RETRY_DELAY_MS * Math.pow(config.SYNC_RETRY_BACKOFF_FACTOR, retries);

        const updated: SyncQueueItem = {
          ...item,
          retries,
          errorMessage: error.message,
        };
        await storage.set(db.syncQueue, item.id, updated);

        setTimeout(() => flushQueue(), delay);
      } else {
        // Mark as failed
        const updated: SyncQueueItem = {
          ...item,
          status: 'failed',
          errorMessage: error.message,
        };
        await storage.set(db.syncQueue, item.id, updated);
      }
    }
  }
}

export async function retrySyncItem(itemId: string): Promise<void> {
  const item = await storage.get<SyncQueueItem>(db.syncQueue, itemId);
  if (!item) return;

  const updated: SyncQueueItem = {
    ...item,
    status: 'pending',
    retries: 0,
    errorMessage: undefined,
  };

  await storage.set(db.syncQueue, itemId, updated);
  await flushQueue();
}

export async function clearSyncedItems(): Promise<void> {
  const queue = await getSyncQueue();
  const synced = queue.filter(item => item.status === 'synced');

  for (const item of synced) {
    await storage.remove(db.syncQueue, item.id);
  }
}

// Auto-sync on network reconnection
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Network reconnected - flushing sync queue');
    flushQueue();
  });
}
