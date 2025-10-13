import { useState, useEffect } from 'react';
import { getSyncQueue } from '../services/syncQueue';
import type { SyncQueueItem } from '../types';

export function useSyncStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const loadQueue = async () => {
      const queue = await getSyncQueue();
      setSyncQueue(queue);
      setPendingCount(queue.filter(item => item.status === 'pending').length);
    };

    loadQueue();

    // Poll for updates
    const interval = setInterval(loadQueue, 2000);
    return () => clearInterval(interval);
  }, []);

  return {
    isOnline,
    syncQueue,
    pendingCount,
    hasPendingSync: pendingCount > 0,
  };
}
