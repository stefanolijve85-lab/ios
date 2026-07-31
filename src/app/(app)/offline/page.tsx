import { Icon } from '@/components/ui/Icon';
import Link from 'next/link';

export const metadata = { title: 'Offline' };

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-elevated text-muted">
        <Icon name="globe" size={28} />
      </span>
      <h1 className="text-xl font-semibold">You’re offline</h1>
      <p className="text-sm text-muted">
        Civitas caches recently viewed pages so you can keep reading. Reconnect to load the latest posts, messages and
        notifications.
      </p>
      <Link href="/" className="btn-outline mt-2">
        Try again
      </Link>
    </div>
  );
}
