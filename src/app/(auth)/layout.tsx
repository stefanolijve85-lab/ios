import { Wordmark } from '@/components/ui/Logo';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-aurora relative flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-8">
        <Wordmark size={40} />
      </Link>
      <div id="main" className="w-full max-w-md">
        {children}
      </div>
      <p className="mt-8 max-w-md text-center text-xs text-muted">
        By continuing you agree to the{' '}
        <Link href="/guidelines" className="link">
          community guidelines
        </Link>{' '}
        and confirm you will use Civitas lawfully and respectfully.
      </p>
    </div>
  );
}
