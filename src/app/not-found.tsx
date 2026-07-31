import Link from 'next/link';
import { Wordmark } from '@/components/ui/Logo';

export default function NotFound() {
  return (
    <div className="app-aurora flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <Wordmark size={40} />
      <p className="text-6xl font-bold tracking-tight">404</p>
      <p className="max-w-sm text-muted">
        We couldn’t find that page. It may have been moved, or the link is out of date.
      </p>
      <Link href="/" className="btn-primary">
        Back to the feed
      </Link>
    </div>
  );
}
