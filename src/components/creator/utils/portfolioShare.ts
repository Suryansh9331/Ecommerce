import type { CreatorPortfolioData } from './creatorPortfolio';
import type { CreatorTargeting } from './creatorTargeting';

const SLUG_KEY = 'aoin_creator_portfolio_share_slug_v1';
const SNAPSHOT_PREFIX = 'aoin_creator_portfolio_share_snapshot_v1:';

export type PortfolioShareSnapshot = {
  createdAt: string;
  profile: {
    name: string;
    handle: string;
    bio?: string;
    city?: string;
    avatarUrl?: string;
  };
  stats?: {
    totalViews?: number;
    totalLikes?: number;
    totalShares?: number;
    totalDeals?: number;
    followers?: number;
  };
  targeting?: CreatorTargeting;
  collaborations?: Array<{
    brand: string;
    campaign: string;
    result: string;
    highlight?: string;
  }>;
  portfolio: CreatorPortfolioData;
};

function randomSlug(length = 10) {
  // URL-safe: lowercase letters + digits
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const buf = new Uint8Array(length);
  crypto.getRandomValues(buf);
  let out = '';
  for (let i = 0; i < buf.length; i += 1) out += alphabet[buf[i] % alphabet.length];
  return out;
}

export function getOrCreateShareSlug(): string {
  try {
    const existing = window.localStorage.getItem(SLUG_KEY);
    if (existing) return existing;
    const slug = randomSlug(12);
    window.localStorage.setItem(SLUG_KEY, slug);
    return slug;
  } catch {
    return randomSlug(12);
  }
}

export function saveShareSnapshot(slug: string, snapshot: PortfolioShareSnapshot): void {
  try {
    window.localStorage.setItem(`${SNAPSHOT_PREFIX}${slug}`, JSON.stringify(snapshot));
  } catch {
    // ignore
  }
}

export function loadShareSnapshot(slug: string): PortfolioShareSnapshot | null {
  try {
    const raw = window.localStorage.getItem(`${SNAPSHOT_PREFIX}${slug}`);
    if (!raw) return null;
    return JSON.parse(raw) as PortfolioShareSnapshot;
  } catch {
    return null;
  }
}

