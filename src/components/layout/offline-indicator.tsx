'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { Badge } from '@/components/ui/badge';
import { IconWifi, IconWifiOff, IconRefresh } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  return (
    <Badge
      variant={isOnline ? 'outline' : 'destructive'}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1',
        isOnline ? 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400' : ''
      )}
    >
      {isOnline ? (
        <>
          <IconWifi title='Online' className='size-4' />
          <span className='text-xs font-medium'>Online</span>
        </>
      ) : (
        <>
          <IconWifiOff title='Offline' className='size-4' />
          <span className='text-xs font-medium'>Offline Mode</span>
        </>
      )}
    </Badge>
  );
}

interface SyncStatusProps {
  onSync?: () => void;
}

export function SyncStatus({ onSync }: SyncStatusProps) {
  const isOnline = useOnlineStatus();

  if (!isOnline) {
    return null;
  }

  return (
    <button
      onClick={onSync}
      className='flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground'
      title='Sync now'
    >
      <IconRefresh className='size-3.5' />
      <span className='hidden sm:inline'>Sync</span>
    </button>
  );
}
