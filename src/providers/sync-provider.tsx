'use client';

import { useSync } from '@/hooks/use-sync';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  // This hook handles auto-syncing when online
  useSync();

  return <>{children}</>;
}

