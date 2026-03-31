import React, { createContext, useContext, useMemo, useReducer } from 'react';
import { MOCK_CAMPAIGNS, MOCK_CREATORS, MOCK_PRODUCTS } from '../mock/seed';
import type { MockCampaign, MockCreator, MockProduct } from '../mock/types';
import { seedSubmissions, type MockSubmission, type SubmissionStatus } from '../mock/submissions';

type State = {
  products: MockProduct[];
  creators: MockCreator[];
  campaigns: MockCampaign[];
  submissions: MockSubmission[];
};

type Action =
  | { type: 'campaign/create'; campaign: MockCampaign }
  | { type: 'campaign/cancel'; campaignId: number }
  | { type: 'submission/approve'; submissionId: number }
  | { type: 'submission/revision'; submissionId: number; feedback: string };

const initialState: State = (() => {
  const campaigns = [...MOCK_CAMPAIGNS];
  return {
    products: [...MOCK_PRODUCTS],
    creators: [...MOCK_CREATORS],
    campaigns,
    submissions: seedSubmissions(campaigns),
  };
})();

function updateCampaignStatusFromSubmissions(status: SubmissionStatus): MockCampaign['status'] | null {
  if (status === 'pending_review') return 'Submitted';
  if (status === 'approved') return 'Approved';
  if (status === 'revision_requested') return 'Rejected';
  return null;
}

function reducer(state: State, action: Action): State {
  if (action.type === 'campaign/create') {
    const nextCampaigns = [action.campaign, ...state.campaigns];
    const newSubmission: MockSubmission = {
      id: Math.max(...state.submissions.map((s) => s.id)) + 1,
      campaignId: action.campaign.id,
      status: 'pending_review',
      videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      thumbnailUrl: action.campaign.product.imageUrl,
      caption: `Draft reel for ${action.campaign.product.name}.`,
      submittedAt: new Date(),
      updatedAt: new Date(),
    };
    return { ...state, campaigns: nextCampaigns, submissions: [newSubmission, ...state.submissions] };
  }

  if (action.type === 'campaign/cancel') {
    return {
      ...state,
      campaigns: state.campaigns.map((c) =>
        c.id === action.campaignId ? { ...c, status: 'Cancelled', updatedAt: new Date() } : c
      ),
    };
  }

  if (action.type === 'submission/approve') {
    const nextSubs = state.submissions.map((s) =>
      s.id === action.submissionId ? { ...s, status: 'approved', feedback: undefined, updatedAt: new Date() } : s
    );
    const sub = nextSubs.find((s) => s.id === action.submissionId);
    const nextCampaignStatus = sub ? updateCampaignStatusFromSubmissions(sub.status) : null;
    return {
      ...state,
      submissions: nextSubs,
      campaigns:
        nextCampaignStatus && sub
          ? state.campaigns.map((c) =>
              c.id === sub.campaignId ? { ...c, status: nextCampaignStatus, updatedAt: new Date() } : c
            )
          : state.campaigns,
    };
  }

  if (action.type === 'submission/revision') {
    const nextSubs = state.submissions.map((s) =>
      s.id === action.submissionId
        ? { ...s, status: 'revision_requested', feedback: action.feedback, updatedAt: new Date() }
        : s
    );
    const sub = nextSubs.find((s) => s.id === action.submissionId);
    const nextCampaignStatus = sub ? updateCampaignStatusFromSubmissions(sub.status) : null;
    return {
      ...state,
      submissions: nextSubs,
      campaigns:
        nextCampaignStatus && sub
          ? state.campaigns.map((c) =>
              c.id === sub.campaignId ? { ...c, status: nextCampaignStatus, updatedAt: new Date() } : c
            )
          : state.campaigns,
    };
  }

  return state;
}

const Ctx = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null);

export const ReelCampaignsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useReelCampaignsStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useReelCampaignsStore must be used within ReelCampaignsProvider');
  return v;
}

