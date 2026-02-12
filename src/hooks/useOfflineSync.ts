import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { getQueue, removeFromQueue, OfflineMutation } from '@/lib/offlineQueue';
import { toast } from 'sonner';

export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}

export function usePendingCount() {
  const [count, setCount] = useState(() => getQueue().length);

  useEffect(() => {
    const update = () => setCount(getQueue().length);
    window.addEventListener('offline-queue-change', update);
    return () => window.removeEventListener('offline-queue-change', update);
  }, []);

  return count;
}

async function replayMutation(m: OfflineMutation, userId: string): Promise<boolean> {
  try {
    switch (m.type) {
      case 'add_invoice': {
        const { error } = await supabase.from('invoices').insert(
          m.payload.map((r: any) => ({ ...r, user_id: userId }))
        );
        if (error) throw error;
        break;
      }
      case 'update_invoice': {
        const { id, data } = m.payload;
        const { error } = await supabase.from('invoices').update(data).eq('id', id);
        if (error) throw error;
        break;
      }
      case 'delete_invoice': {
        const { id, installmentGroup } = m.payload;
        if (installmentGroup) {
          const { error } = await supabase.from('invoices').delete().eq('installment_group', installmentGroup);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('invoices').delete().eq('id', id);
          if (error) throw error;
        }
        break;
      }
      case 'add_payment': {
        const { error } = await supabase.from('payments').insert({
          ...m.payload,
          user_id: userId,
        });
        if (error) throw error;
        break;
      }
      case 'add_payments_batch': {
        const rows = m.payload.map((p: any) => ({ ...p, user_id: userId }));
        const { error } = await supabase.from('payments').insert(rows);
        if (error) throw error;
        break;
      }
    }
    return true;
  } catch (err) {
    console.error('Failed to replay mutation:', m.type, err);
    return false;
  }
}

export function useOfflineSync() {
  const { user } = useAuth();
  const online = useOnlineStatus();
  const qc = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  const syncQueue = useCallback(async () => {
    if (!user || !navigator.onLine) return;
    const queue = getQueue();
    if (queue.length === 0) return;

    setSyncing(true);
    let synced = 0;

    for (const mutation of queue) {
      const success = await replayMutation(mutation, user.id);
      if (success) {
        removeFromQueue(mutation.id);
        synced++;
      } else {
        // Stop on first failure to preserve order
        break;
      }
    }

    if (synced > 0) {
      toast.success(`${synced} operação(ões) sincronizada(s)!`);
      qc.invalidateQueries({ queryKey: ['invoices'] });
    }

    setSyncing(false);
  }, [user, qc]);

  // Sync when coming back online
  useEffect(() => {
    if (online && user) {
      syncQueue();
    }
  }, [online, user, syncQueue]);

  // Also try syncing periodically when online
  useEffect(() => {
    if (!online || !user) return;
    const interval = setInterval(syncQueue, 30000);
    return () => clearInterval(interval);
  }, [online, user, syncQueue]);

  return { syncing };
}
