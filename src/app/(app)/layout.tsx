import { AppShell } from '@/components/AppShell';

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <div id="main">{children}</div>
    </AppShell>
  );
}
