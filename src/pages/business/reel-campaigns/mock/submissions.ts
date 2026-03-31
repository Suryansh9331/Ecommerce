import type { MockCampaign } from './types';

export type SubmissionStatus = 'pending_review' | 'approved' | 'revision_requested';

export interface MockSubmission {
  id: number;
  campaignId: number;
  status: SubmissionStatus;
  videoUrl: string;
  thumbnailUrl?: string;
  caption: string;
  feedback?: string;
  submittedAt: Date;
  updatedAt: Date;
}

export function seedSubmissions(campaigns: MockCampaign[]): MockSubmission[] {
  const now = Date.now();
  const byStatus = (idx: number) => (idx % 3 === 0 ? 'pending_review' : idx % 3 === 1 ? 'revision_requested' : 'approved') as SubmissionStatus;
  const out: MockSubmission[] = [];

  const video = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
  const thumbs = [
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=70',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=70',
    'https://images.unsplash.com/photo-1586495777744-4e6232bf0e26?w=800&auto=format&fit=crop&q=70',
  ];

  campaigns.slice(0, 6).forEach((c, i) => {
    const status = byStatus(i);
    out.push({
      id: 7001 + i,
      campaignId: c.id,
      status,
      videoUrl: video,
      thumbnailUrl: thumbs[i % thumbs.length],
      caption: `Reel draft for ${c.product.name}. Hook + benefits + CTA.`,
      feedback: status === 'revision_requested' ? 'Please improve lighting and add a clearer CTA within the first 3 seconds.' : undefined,
      submittedAt: new Date(now - (i + 1) * 6 * 3_600_000),
      updatedAt: new Date(now - (i + 1) * 3 * 3_600_000),
    });
  });

  return out;
}

