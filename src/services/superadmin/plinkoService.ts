import {
  LeadFilters,
  Pagination,
  PlinkoCampaignConfig,
  PlinkoLeadRow,
  PlinkoStats,
} from '../../types/plinko';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ENDPOINT = `${API_BASE_URL}/api/superadmin/plinko`;

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('access_token')}`,
});

const buildQuery = (filters: LeadFilters) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      params.append(key, String(value));
    }
  });
  return params.toString();
};

const unwrap = async (response: Response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const fetchLeads = async (
  filters: LeadFilters
): Promise<{ leads: PlinkoLeadRow[]; pagination: Pagination }> =>
  unwrap(await fetch(`${ENDPOINT}/leads?${buildQuery(filters)}`, { headers: getAuthHeaders() }));

export const fetchStats = async (campaignId?: number): Promise<PlinkoStats> =>
  unwrap(
    await fetch(`${ENDPOINT}/stats${campaignId ? `?campaign_id=${campaignId}` : ''}`, {
      headers: getAuthHeaders(),
    })
  );

export const fetchCampaigns = async (): Promise<PlinkoCampaignConfig[]> =>
  unwrap(await fetch(`${ENDPOINT}/campaigns`, { headers: getAuthHeaders() }));

export const saveCampaign = async (
  campaign: Partial<PlinkoCampaignConfig>
): Promise<PlinkoCampaignConfig> =>
  unwrap(
    await fetch(
      campaign.campaign_id ? `${ENDPOINT}/campaigns/${campaign.campaign_id}` : `${ENDPOINT}/campaigns`,
      {
        method: campaign.campaign_id ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(campaign),
      }
    )
  );

/**
 * CSV is built server-side and streamed back, so an export reflects every row matching
 * the filters rather than just the page currently loaded in the table.
 */
export const exportLeads = async (filters: LeadFilters): Promise<void> => {
  const response = await fetch(`${ENDPOINT}/leads/export?${buildQuery(filters)}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
  });
  if (!response.ok) throw new Error('Export failed');

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `plinko_leads_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
