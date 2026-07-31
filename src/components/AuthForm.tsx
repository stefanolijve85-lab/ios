'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon, type IconName } from '@/components/ui/Icon';

const providers: { key: string; label: string; icon?: IconName; mark?: string }[] = [
  { key: 'google', label: 'Continue with Google', mark: 'G' },
  { key: 'apple', label: 'Continue with Apple', mark: '' },
  { key: 'passkey', label: 'Continue with a passkey', icon: 'lock' },
];

export function AuthForm({ mode }: { mode: 'signin' | 'signup' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const signup = mode === 'signup';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Demo auth: no backend call — route into the app.
    setTimeout(() => router.push('/'), 500);
  };

  return (
    <div className="card p-6">
      <h1 className="text-xl font-bold tracking-tight">{signup ? 'Create your account' : 'Welcome back'}</h1>
      <p className="mt-1 text-sm text-muted">
        {signup ? 'Join a community built for lawful civic participation.' : 'Sign in to continue to Civitas.'}
      </p>

      <div className="mt-5 flex flex-col gap-2">
        {providers.map((p) => (
          <button
            key={p.key}
            onClick={() => submit(new Event('submit') as unknown as React.FormEvent)}
            className="btn-outline w-full justify-center"
          >
            {p.icon ? (
              <Icon name={p.icon} size={17} />
            ) : (
              <span className="grid h-4 w-4 place-items-center text-sm font-bold">{p.mark || ''}</span>
            )}
            {p.label}
          </button>
        ))}
      </div>

      <div className="my-5 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        {signup && <input className="input" placeholder="Full name" required />}
        <input
          className="input"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input className="input" type="password" placeholder="Password" required minLength={8} />
        {signup && (
          <label className="flex items-start gap-2 text-xs text-muted">
            <input type="checkbox" required className="mt-0.5 accent-[rgb(var(--brand))]" />I agree to follow the
            community guidelines and use Civitas lawfully.
          </label>
        )}
        <button className="btn-primary w-full justify-center" disabled={loading}>
          {loading ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}
        </button>
      </form>

      {!signup && (
        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
          <Icon name="shield" size={13} /> Two-factor authentication supported
        </div>
      )}

      <p className="mt-5 text-center text-sm text-muted">
        {signup ? 'Already have an account?' : 'New to Civitas?'}{' '}
        <Link href={signup ? '/signin' : '/signup'} className="link font-medium">
          {signup ? 'Sign in' : 'Create one'}
        </Link>
      </p>
    </div>
  );
}
