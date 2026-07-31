// -----------------------------------------------------------------------------
// In-memory data layer
// A framework-agnostic query API over the seed data. In production this module
// is the single place you swap for Supabase queries (see supabase/schema.sql);
// every consumer imports from here, never from `@/data/seed` directly.
// -----------------------------------------------------------------------------
import * as seed from '@/data/seed';
import type {
  User,
  Community,
  Post,
  CivicEvent,
  NewsArticle,
  HelpListing,
  FeedKind,
} from '@/lib/types';

// Mutable copies so API route handlers can simulate writes within a session.
const db = {
  users: [...seed.users],
  communities: [...seed.communities],
  posts: [...seed.posts],
  comments: [...seed.comments],
  news: [...seed.news],
  events: [...seed.events],
  help: [...seed.help],
  mapMarkers: [...seed.mapMarkers],
  conversations: [...seed.conversations],
  messages: [...seed.messages],
  notifications: [...seed.notifications],
  reports: [...seed.reports],
  audit: [...seed.audit],
  featureFlags: [...seed.featureFlags],
};

export const currentUserId = seed.currentUserId;

export function getCurrentUser(): User {
  return db.users.find((u) => u.id === currentUserId)!;
}

export function getUser(id: string): User | undefined {
  return db.users.find((u) => u.id === id);
}
export function getUserByHandle(handle: string): User | undefined {
  return db.users.find((u) => u.handle === handle);
}
export function listUsers(): User[] {
  return db.users;
}

export function listCommunities(): Community[] {
  return db.communities;
}
export function getCommunity(idOrSlug: string): Community | undefined {
  return db.communities.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
}

export function getPost(id: string): Post | undefined {
  return db.posts.find((p) => p.id === id);
}
export function listComments(postId: string) {
  return db.comments.filter((c) => c.postId === postId);
}

// Feed ranking. Each tab reorders the same post pool with a different signal.
export function getFeed(kind: FeedKind, viewer: User): Post[] {
  const base = [...db.posts];
  const score = (p: Post) => p.metrics.likes + p.metrics.comments * 3 + p.metrics.shares * 2;
  const recency = (p: Post) => Date.parse(p.createdAt);

  switch (kind) {
    case 'latest':
      return base.sort((a, b) => recency(b) - recency(a));
    case 'trending':
      return base.sort((a, b) => score(b) - score(a));
    case 'nearby':
      // Prefer posts that carry a location, then by recency.
      return base.sort(
        (a, b) => Number(!!b.location) - Number(!!a.location) || recency(b) - recency(a),
      );
    case 'following': {
      const following = new Set(viewer.communities);
      return base
        .filter((p) => (p.communityId && following.has(p.communityId)) || p.authorId !== viewer.id)
        .sort((a, b) => recency(b) - recency(a));
    }
    case 'for-you':
    default: {
      // Blend of engagement + recency + interest match — a transparent stand-in
      // for a real recommendation model.
      const interests = new Set(viewer.interests);
      const boosted = (p: Post) => {
        const tagMatch = p.tags.some((t) => interests.has(t)) ? 1.4 : 1;
        const hours = (Date.parse(seedNow()) - recency(p)) / 3_600_000;
        const freshness = 1 / (1 + hours / 12);
        return score(p) * tagMatch * (0.5 + freshness);
      };
      return base.sort((a, b) => boosted(b) - boosted(a));
    }
  }
}

// Stable "now" anchored to the seed so ranking is deterministic across renders.
function seedNow(): string {
  return '2026-07-31T09:00:00.000Z';
}

export function communityPosts(communityId: string): Post[] {
  return db.posts
    .filter((p) => p.communityId === communityId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function userPosts(userId: string): Post[] {
  return db.posts
    .filter((p) => p.authorId === userId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function listNews(): NewsArticle[] {
  return [...db.news].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}
export function getNews(id: string): NewsArticle | undefined {
  return db.news.find((n) => n.id === id);
}

export function listEvents(): CivicEvent[] {
  return [...db.events].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}
export function getEvent(id: string): CivicEvent | undefined {
  return db.events.find((e) => e.id === id);
}

export function listHelp(): HelpListing[] {
  return [...db.help].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function listMapMarkers() {
  return db.mapMarkers;
}

export function listConversations() {
  return db.conversations
    .filter((c) => c.participantIds.includes(currentUserId))
    .sort((a, b) => Date.parse(b.lastMessageAt) - Date.parse(a.lastMessageAt));
}
export function getConversation(id: string) {
  return db.conversations.find((c) => c.id === id);
}
export function conversationMessages(conversationId: string) {
  return db.messages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

export function listNotifications() {
  return [...db.notifications].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}
export function unreadNotificationCount() {
  return db.notifications.filter((n) => !n.read).length;
}

export function listReports() {
  return [...db.reports].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
export function listAudit() {
  return [...db.audit].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
export function listFeatureFlags() {
  return db.featureFlags;
}

// Global search across the primary content types.
export interface SearchResult {
  type: 'post' | 'user' | 'community' | 'event' | 'news';
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export function search(query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: SearchResult[] = [];
  const has = (s: string) => s.toLowerCase().includes(q);

  for (const p of db.posts) {
    if (has(p.headline) || has(p.body) || p.tags.some(has))
      results.push({ type: 'post', id: p.id, title: p.headline, subtitle: 'Post', href: `/post/${p.id}` });
  }
  for (const u of db.users) {
    if (has(u.name) || has(u.handle) || has(u.bio))
      results.push({ type: 'user', id: u.id, title: u.name, subtitle: `@${u.handle}`, href: `/u/${u.handle}` });
  }
  for (const c of db.communities) {
    if (has(c.name) || has(c.description) || has(c.tagline))
      results.push({ type: 'community', id: c.id, title: c.name, subtitle: 'Community', href: `/c/${c.slug}` });
  }
  for (const e of db.events) {
    if (has(e.title) || has(e.description))
      results.push({ type: 'event', id: e.id, title: e.title, subtitle: 'Event', href: `/events/${e.id}` });
  }
  for (const n of db.news) {
    if (has(n.title) || has(n.summary))
      results.push({ type: 'news', id: n.id, title: n.title, subtitle: 'News', href: `/news/${n.id}` });
  }
  return results.slice(0, 24);
}

export { db };
