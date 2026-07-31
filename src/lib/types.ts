// -----------------------------------------------------------------------------
// Civitas domain model
// Shared TypeScript types for the whole platform. These mirror the Supabase /
// Postgres schema in `supabase/schema.sql` so the mock data layer and a real
// database stay structurally compatible.
// -----------------------------------------------------------------------------

export type Role =
  | 'visitor'
  | 'member'
  | 'volunteer'
  | 'moderator'
  | 'editor'
  | 'administrator'
  | 'super_admin';

export const ROLE_ORDER: Role[] = [
  'visitor',
  'member',
  'volunteer',
  'moderator',
  'editor',
  'administrator',
  'super_admin',
];

export function roleAtLeast(role: Role, min: Role): boolean {
  return ROLE_ORDER.indexOf(role) >= ROLE_ORDER.indexOf(min);
}

export interface GeoPoint {
  lat: number;
  lng: number;
  label?: string;
}

export interface User {
  id: string;
  handle: string;
  name: string;
  avatar: string;
  bio: string;
  role: Role;
  verified: boolean;
  location?: string;
  interests: string[];
  communities: string[]; // community ids
  badges: Badge[];
  joinedAt: string;
  stats: {
    posts: number;
    helpful: number;
    followers: number;
    following: number;
  };
  privacy: {
    showLocation: boolean;
    discoverable: boolean;
    dmFrom: 'everyone' | 'communities' | 'nobody';
  };
}

export interface Badge {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export type FeedKind = 'for-you' | 'latest' | 'trending' | 'nearby' | 'following';

export type FactCheck = 'verified' | 'context' | 'disputed' | 'unverified';

export interface Post {
  id: string;
  authorId: string;
  communityId?: string;
  headline: string;
  body: string;
  images: string[];
  video?: string;
  location?: GeoPoint;
  tags: string[];
  factCheck?: FactCheck;
  createdAt: string;
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    bookmarks: number;
  };
  // client-side interaction state (seeded per demo user)
  likedBy: string[];
  bookmarkedBy: string[];
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
  likes: number;
}

export type CommunityCategory =
  | 'local'
  | 'municipality'
  | 'province'
  | 'public-safety'
  | 'immigration-policy'
  | 'culture'
  | 'events'
  | 'neighborhood-watch'
  | 'volunteer';

export interface Community {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: CommunityCategory;
  cover: string;
  icon: string;
  location?: string;
  rules: string[];
  pinnedPostIds: string[];
  moderatorIds: string[];
  stats: {
    members: number;
    postsPerWeek: number;
    online: number;
  };
  createdAt: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  body: string;
  cover: string;
  authorId: string;
  category: string;
  sources: { label: string; url: string }[];
  references: string[];
  factCheck: FactCheck;
  readingMinutes: number;
  publishedAt: string;
  verifiedByEditor: boolean;
  metrics: { views: number; comments: number; saves: number };
}

export type EventKind = 'meetup' | 'public-meeting' | 'volunteer' | 'workshop' | 'rally';

export interface CivicEvent {
  id: string;
  title: string;
  description: string;
  cover: string;
  kind: EventKind;
  hostId: string;
  communityId?: string;
  startsAt: string;
  endsAt: string;
  location: GeoPoint;
  venue: string;
  capacity: number;
  rsvps: string[]; // user ids
  tags: string[];
}

export type HelpCategory =
  | 'legal'
  | 'translation'
  | 'transport'
  | 'volunteer'
  | 'housing'
  | 'community';

export type HelpKind = 'request' | 'offer';

export interface HelpListing {
  id: string;
  kind: HelpKind;
  category: HelpCategory;
  title: string;
  details: string;
  authorId: string;
  location: GeoPoint;
  createdAt: string;
  status: 'open' | 'matched' | 'completed';
  matchedWith?: string;
}

export type MapMarkerKind =
  | 'volunteer'
  | 'meetup'
  | 'public-meeting'
  | 'initiative'
  | 'help'
  | 'completed';

export interface MapMarker {
  id: string;
  kind: MapMarkerKind;
  title: string;
  location: GeoPoint;
  refId?: string;
}

export interface Conversation {
  id: string;
  kind: 'direct' | 'group';
  title?: string;
  participantIds: string[];
  encrypted: boolean;
  lastMessageAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  kind: 'text' | 'image' | 'voice' | 'file';
  attachment?: string;
  createdAt: string;
  readBy: string[];
}

export type NotificationKind =
  | 'like'
  | 'comment'
  | 'mention'
  | 'community-invite'
  | 'event-reminder'
  | 'help-request'
  | 'moderator';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  actorId?: string;
  text: string;
  href: string;
  createdAt: string;
  read: boolean;
}

export type ReportStatus = 'open' | 'reviewing' | 'actioned' | 'dismissed';

export interface Report {
  id: string;
  targetType: 'post' | 'comment' | 'user' | 'news';
  targetId: string;
  reporterId: string;
  reason: string;
  details?: string;
  status: ReportStatus;
  createdAt: string;
  spamScore: number;
}

export interface AuditEntry {
  id: string;
  actorId: string;
  action: string;
  target: string;
  createdAt: string;
}

export interface FeatureFlag {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  rollout: number; // 0-100
}
