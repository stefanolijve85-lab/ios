"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const items = [
  { href: "/overview",  label: "Overview" },
  { href: "/invoices",  label: "Invoices" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/alerts",    label: "Alerts" },
  { href: "/insights",  label: "AI Insights" },
  { href: "/audit",     label: "Audit log" },
  { href: "/settings",  label: "Settings" },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-white/70 dark:bg-ink-950/60 dark:border-ink-800 backdrop-blur">
      <Link href="/overview" className="flex items-center gap-2 px-5 py-5">
        <div className="size-8 rounded-md bg-gradient-to-br from-accent-400 to-accent-700 grid place-items-center text-white font-bold">T</div>
        <div>
          <div className="text-sm font-semibold leading-none">Trustline</div>
          <div className="text-[10px] uppercase tracking-widest text-ink-500">AP security</div>
        </div>
      </Link>
      <nav className="flex-1 px-2 py-2">
        {items.map((it) => {
          const active = path?.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={clsx(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-ink-100 text-ink-900 dark:bg-ink-800 dark:text-white"
                  : "text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800",
              )}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t dark:border-ink-800">
        <div className="text-[11px] uppercase tracking-wider text-ink-500">Tenant</div>
        <div className="text-sm font-medium">Acme Holding</div>
        <div className="text-[11px] text-ink-500">Professional plan</div>
      </div>
    </aside>
  );
}
