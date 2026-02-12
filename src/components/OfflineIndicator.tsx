import { useOnlineStatus, usePendingCount } from '@/hooks/useOfflineSync';
import { WifiOff, CloudOff, RefreshCw } from 'lucide-react';

export function OfflineIndicator() {
  const online = useOnlineStatus();
  const pendingCount = usePendingCount();

  if (online && pendingCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg bg-card border border-border text-sm animate-in slide-in-from-bottom-4">
      {!online ? (
        <>
          <WifiOff className="h-4 w-4 text-orange-500" />
          <span className="text-muted-foreground">Sem conexão</span>
          {pendingCount > 0 && (
            <span className="bg-orange-500/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full text-xs font-medium">
              {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
            </span>
          )}
        </>
      ) : pendingCount > 0 ? (
        <>
          <RefreshCw className="h-4 w-4 text-primary animate-spin" />
          <span className="text-muted-foreground">Sincronizando {pendingCount}...</span>
        </>
      ) : null}
    </div>
  );
}
