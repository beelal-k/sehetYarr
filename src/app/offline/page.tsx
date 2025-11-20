import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <WifiOff className="w-24 h-24 mx-auto text-muted-foreground" />
        <h1 className="text-4xl font-bold">You&apos;re Offline</h1>
        <p className="text-lg text-muted-foreground">
          It looks like you&apos;ve lost your internet connection. Don&apos;t worry, you can
          still view cached pages and data.
        </p>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            • Previously visited pages are available
            <br />
            • Your data is safe and synced locally
            <br />
            • Changes will sync when you&apos;re back online
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}

