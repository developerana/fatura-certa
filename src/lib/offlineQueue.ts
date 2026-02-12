const QUEUE_KEY = 'offline_mutation_queue';

export interface OfflineMutation {
  id: string;
  type: 'add_invoice' | 'update_invoice' | 'delete_invoice' | 'add_payment' | 'add_payments_batch';
  payload: any;
  createdAt: string;
}

export function getQueue(): OfflineMutation[] {
  try {
    const data = localStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addToQueue(mutation: Omit<OfflineMutation, 'id' | 'createdAt'>): OfflineMutation {
  const queue = getQueue();
  const entry: OfflineMutation = {
    ...mutation,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  queue.push(entry);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent('offline-queue-change'));
  return entry;
}

export function removeFromQueue(id: string) {
  const queue = getQueue().filter(m => m.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent('offline-queue-change'));
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
  window.dispatchEvent(new CustomEvent('offline-queue-change'));
}

export function isOnline(): boolean {
  return navigator.onLine;
}
