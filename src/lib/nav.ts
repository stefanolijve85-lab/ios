import type { IconName } from '@/components/ui/Icon';
import type { Role } from '@/lib/types';

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  minRole?: Role;
  primaryMobile?: boolean; // shown in the mobile bottom bar
}

export const NAV: NavItem[] = [
  { href: '/', label: 'Home', icon: 'home', primaryMobile: true },
  { href: '/communities', label: 'Communities', icon: 'users', primaryMobile: true },
  { href: '/map', label: 'Map', icon: 'map', primaryMobile: true },
  { href: '/events', label: 'Events', icon: 'calendar' },
  { href: '/news', label: 'News', icon: 'news' },
  { href: '/help', label: 'Help Network', icon: 'hand' },
  { href: '/messages', label: 'Messages', icon: 'message', primaryMobile: true },
  { href: '/search', label: 'Search', icon: 'search' },
  { href: '/notifications', label: 'Notifications', icon: 'bell' },
  { href: '/moderation', label: 'Moderation', icon: 'shield', minRole: 'moderator' },
  { href: '/admin', label: 'Admin', icon: 'settings', minRole: 'administrator' },
];
