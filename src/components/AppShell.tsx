'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { NAV } from '@/lib/nav';
import { roleAtLeast } from '@/lib/types';
import { useApp } from '@/context/AppProvider';
import { Icon } from '@/components/ui/Icon';
import { Wordmark, Logo } from '@/components/ui/Logo';
import { Avatar, RoleBadge } from '@/components/ui/Primitives';
import { Composer } from '@/components/Composer';
import { unreadNotificationCount } from '@/lib/db';

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

function Sidebar() {
  const pathname = usePathname();
  const { user, setComposerOpen } = useApp();
  const items = NAV.filter((n) => !n.minRole || roleAtLeast(user.role, n.minRole));

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-1 border-r border-border/60 bg-surface/40 px-3 py-5 lg:flex">
      <div className="px-2 pb-4">
        <Link href="/" aria-label="Civitas home">
          <Wordmark />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? 'bg-elevated text-fg shadow-glass' : 'text-muted hover:bg-elevated/60 hover:text-fg'
              }`}
            >
              <span className={active ? 'text-brand-soft' : ''}>
                <Icon name={item.icon} size={21} filled={active && item.icon === 'home'} />
              </span>
              {item.label}
              {item.href === '/notifications' && unreadNotificationCount() > 0 && (
                <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
                  {unreadNotificationCount()}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <button className="btn-primary mt-2 w-full" onClick={() => setComposerOpen(true)}>
        <Icon name="plus" size={18} /> Create post
      </button>

      <Link
        href={`/u/${user.handle}`}
        className="mt-3 flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-elevated/60"
      >
        <Avatar src={user.avatar} name={user.name} size={38} ring />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold">{user.name}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <p className="truncate text-xs text-muted">@{user.handle}</p>
            <RoleBadge role={user.role} />
          </div>
        </div>
      </Link>
    </aside>
  );
}

function TopBar() {
  const { toggleTheme, theme } = useApp();
  return (
    <header className="glass sticky top-0 z-40 flex items-center gap-3 border-b border-border/60 px-4 py-3 lg:hidden">
      <Link href="/" aria-label="Civitas home" className="mr-auto">
        <Logo size={34} />
      </Link>
      <Link href="/search" className="btn-ghost !p-2" aria-label="Search">
        <Icon name="search" size={20} />
      </Link>
      <button className="btn-ghost !p-2" onClick={toggleTheme} aria-label="Toggle theme">
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
      </button>
      <Link href="/notifications" className="btn-ghost relative !p-2" aria-label="Notifications">
        <Icon name="bell" size={20} />
        {unreadNotificationCount() > 0 && (
          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-surface" />
        )}
      </Link>
    </header>
  );
}

function BottomNav() {
  const pathname = usePathname();
  const { setComposerOpen } = useApp();
  const items = NAV.filter((n) => n.primaryMobile);

  return (
    <nav className="glass-strong fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border/60 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 lg:hidden">
      {items.slice(0, 2).map((item) => (
        <NavPill key={item.href} pathname={pathname} href={item.href} icon={item.icon} label={item.label} />
      ))}
      <button
        onClick={() => setComposerOpen(true)}
        className="grid h-12 w-12 -translate-y-3 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow active:scale-95"
        aria-label="Create post"
      >
        <Icon name="plus" size={24} />
      </button>
      {items.slice(2, 4).map((item) => (
        <NavPill key={item.href} pathname={pathname} href={item.href} icon={item.icon} label={item.label} />
      ))}
    </nav>
  );
}

function NavPill({
  pathname,
  href,
  icon,
  label,
}: {
  pathname: string;
  href: string;
  icon: Parameters<typeof Icon>[0]['name'];
  label: string;
}) {
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      className={`flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-medium transition ${
        active ? 'text-brand-soft' : 'text-muted'
      }`}
    >
      <Icon name={icon} size={22} filled={active && icon === 'home'} />
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-aurora relative mx-auto flex min-h-dvh w-full max-w-7xl">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-w-0 flex-1 px-3 pb-28 pt-4 sm:px-5 lg:px-8 lg:pb-10">{children}</main>
      </div>
      <BottomNav />
      <Composer />
    </div>
  );
}
