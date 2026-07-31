'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { currentUserId } from '@/lib/db';
import { users } from '@/data/seed';
import type { User } from '@/lib/types';

type Theme = 'dark' | 'light';

interface AppState {
  user: User;
  theme: Theme;
  toggleTheme: () => void;

  liked: Set<string>;
  bookmarked: Set<string>;
  rsvped: Set<string>;
  toggleLike: (postId: string) => void;
  toggleBookmark: (postId: string) => void;
  toggleRsvp: (eventId: string) => void;

  composerOpen: boolean;
  setComposerOpen: (open: boolean) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const user = useMemo(() => users.find((u) => u.id === currentUserId)!, []);
  const [theme, setTheme] = useState<Theme>('dark');
  const [liked, setLiked] = useState<Set<string>>(() => new Set(['p_lang', 'p_policy']));
  const [bookmarked, setBookmarked] = useState<Set<string>>(() => new Set(['p_lang']));
  const [rsvped, setRsvped] = useState<Set<string>>(() => new Set(['e_council', 'e_food']));
  const [composerOpen, setComposerOpen] = useState(false);

  // Restore theme preference.
  useEffect(() => {
    const stored = (localStorage.getItem('civitas-theme') as Theme | null) ?? 'dark';
    setTheme(stored);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light', theme === 'light');
    root.style.colorScheme = theme;
    localStorage.setItem('civitas-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  const toggleIn = useCallback(
    (setter: typeof setLiked) => (id: string) =>
      setter((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    [],
  );

  const toggleLike = useCallback((id: string) => toggleIn(setLiked)(id), [toggleIn]);
  const toggleBookmark = useCallback((id: string) => toggleIn(setBookmarked)(id), [toggleIn]);
  const toggleRsvp = useCallback((id: string) => toggleIn(setRsvped)(id), [toggleIn]);

  const value: AppState = {
    user,
    theme,
    toggleTheme,
    liked,
    bookmarked,
    rsvped,
    toggleLike,
    toggleBookmark,
    toggleRsvp,
    composerOpen,
    setComposerOpen,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
