import type { MockCampaign, MockCreator, MockProduct } from './types';

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: 501,
    name: 'Handwoven Silk Kurta Set',
    category: 'Fashion',
    price: 2490,
    imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=70',
  },
  {
    id: 502,
    name: 'ColorFit Pro 5 Smartwatch',
    category: 'Electronics',
    price: 4999,
    imageUrl: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop&q=70',
  },
  {
    id: 503,
    name: 'Matte Attack Lip Color',
    category: 'Beauty',
    price: 899,
    imageUrl: 'https://images.unsplash.com/photo-1586495777744-4e6232bf0e26?w=600&auto=format&fit=crop&q=70',
  },
];

export const MOCK_CREATORS: MockCreator[] = [
  {
    id: 201,
    name: 'Aoin Creator',
    handle: 'aoin.creator',
    availability: 'available',
    categories: ['Fashion', 'Beauty', 'UGC'],
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=256&auto=format&fit=crop&q=70',
  },
  {
    id: 202,
    name: 'Riya Sharma',
    handle: 'riya.reels',
    availability: 'busy',
    categories: ['Electronics', 'Lifestyle'],
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=256&auto=format&fit=crop&q=70',
  },
  {
    id: 203,
    name: 'Kunal Verma',
    handle: 'kunal.ugc',
    availability: 'available',
    categories: ['Beauty', 'Skincare'],
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&auto=format&fit=crop&q=70',
  },
];

const now = Date.now();

export const MOCK_CAMPAIGNS: MockCampaign[] = [
  {
    id: 1001,
    code: 'RC-8F2K',
    status: 'Sent',
    product: MOCK_PRODUCTS[0],
    creator: MOCK_CREATORS[0],
    commissionType: 'percent_capped',
    commissionPercent: 18,
    capQuantity: 150,
    windowEnd: new Date(now + 10 * 86_400_000),
    deliverableCount: 1,
    brief: 'Create a 20–40s reel showing styling + fabric close-ups. Hook in first 3 seconds. Clear CTA: “Shop now”.',
    createdAt: new Date(now - 2 * 86_400_000),
    updatedAt: new Date(now - 3 * 3_600_000),
  },
  {
    id: 1002,
    code: 'RC-1N9P',
    status: 'Active',
    product: MOCK_PRODUCTS[1],
    creator: MOCK_CREATORS[1],
    commissionType: 'percent_unlimited',
    commissionPercent: 15,
    windowEnd: new Date(now + 5 * 86_400_000),
    deliverableCount: 1,
    brief: 'Unboxing + 3 key features. Mention battery life and display. CTA: “Tap to buy”.',
    createdAt: new Date(now - 8 * 86_400_000),
    updatedAt: new Date(now - 2 * 86_400_000),
  },
  {
    id: 1003,
    code: 'RC-6T7Q',
    status: 'Approved',
    product: MOCK_PRODUCTS[2],
    creator: MOCK_CREATORS[2],
    commissionType: 'percent_capped',
    commissionPercent: 25,
    capQuantity: 200,
    windowEnd: new Date(now + 2 * 86_400_000),
    deliverableCount: 1,
    brief: 'Shade demo in natural light + quick application. CTA: “Shop the shade”.',
    createdAt: new Date(now - 15 * 86_400_000),
    updatedAt: new Date(now - 6 * 3_600_000),
  },
];

