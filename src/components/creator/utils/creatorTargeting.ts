const KEY = 'aoin_creator_targeting_v1';

export type CreatorTargeting = {
  primaryNiches: string[];
  secondaryNiches: string[];
  languages: string[];
  audience: {
    country: string;
    state?: string;
    city?: string;
  };
  contentFormats: string[];
  dealPrefs: {
    budgets: string[]; // multi-select
    turnaround: string; // single
    collabTypes: string[]; // multi-select
  };
  exclusions: string[];
};

export const DEFAULT_TARGETING: CreatorTargeting = {
  primaryNiches: ['Fashion', 'Beauty'],
  secondaryNiches: [],
  languages: ['English'],
  audience: { country: 'India' },
  contentFormats: ['Aesthetic b-roll', 'Try-on'],
  dealPrefs: {
    budgets: ['₹1k–₹3k'],
    turnaround: '48h',
    collabTypes: ['Affiliate'],
  },
  exclusions: [],
};

export function loadCreatorTargeting(): CreatorTargeting {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_TARGETING;
    const parsed = JSON.parse(raw) as CreatorTargeting;
    return { ...DEFAULT_TARGETING, ...parsed };
  } catch {
    return DEFAULT_TARGETING;
  }
}

export function saveCreatorTargeting(next: CreatorTargeting): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

