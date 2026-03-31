export type CampaignStatus =
  | 'Draft'
  | 'Sent'
  | 'Accepted'
  | 'Active'
  | 'Submitted'
  | 'Approved'
  | 'Live'
  | 'Completed'
  | 'Rejected'
  | 'Cancelled'
  | 'Expired';

export type CommissionType = 'percent_unlimited' | 'percent_capped';

export interface MockProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  imageUrl?: string;
}

export interface MockCreator {
  id: number;
  name: string;
  handle: string;
  availability: 'available' | 'busy';
  categories: string[];
  avatarUrl?: string;
}

export interface MockCampaign {
  id: number;
  code: string;
  status: CampaignStatus;
  product: MockProduct;
  creator: MockCreator;
  commissionType: CommissionType;
  commissionPercent: number;
  capQuantity?: number;
  windowEnd: Date;
  deliverableCount: number;
  brief: string;
  createdAt: Date;
  updatedAt: Date;
}

