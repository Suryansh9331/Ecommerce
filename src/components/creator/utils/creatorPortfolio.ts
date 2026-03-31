const KEY = 'aoin_creator_portfolio_v1';

export type CreatorPortfolioData = {
  featuredReelIds: number[];
  socialLinks: {
    instagram?: string;
    youtube?: string;
    website?: string;
  };
  packages: {
    showRates: boolean;
    reelRate?: number;
    turnaround?: string;
    revisionPolicy?: string;
  };
};

export const DEFAULT_PORTFOLIO: CreatorPortfolioData = {
  featuredReelIds: [13, 12, 11],
  socialLinks: {
    instagram: 'https://instagram.com/aoin.creator',
    youtube: '',
    website: 'https://aoinstore.com/aoin.creator',
  },
  packages: {
    showRates: false,
    reelRate: 3500,
    turnaround: '48h',
    revisionPolicy: '1 revision included. Additional revisions may affect timeline.',
  },
};

export function loadCreatorPortfolio(): CreatorPortfolioData {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PORTFOLIO;
    const parsed = JSON.parse(raw) as CreatorPortfolioData;
    return { ...DEFAULT_PORTFOLIO, ...parsed, socialLinks: { ...DEFAULT_PORTFOLIO.socialLinks, ...parsed.socialLinks }, packages: { ...DEFAULT_PORTFOLIO.packages, ...parsed.packages } };
  } catch {
    return DEFAULT_PORTFOLIO;
  }
}

export function saveCreatorPortfolio(next: CreatorPortfolioData): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

