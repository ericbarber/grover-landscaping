import { authenticatedFetch } from './authenticatedFetch';
import { API_BASE_URL } from './baseUrl';

export interface MarketingLeadInboxItem {
  id: string; full_name: string; email: string; company_name?: string; persona: string;
  team_size?: string; intent: string; message?: string; source?: string; medium?: string;
  campaign?: string; landing_path: string; status: string; assigned_to?: string;
  next_action_at?: string; created_at: string;
}

export interface MarketingLeadHistoryItem {
  id: string; actor_user_id: string; previous_status: string; new_status: string;
  assigned_to?: string; next_action_at?: string; note?: string; occurred_at: string;
}

export interface MarketingFunnelSegment {
  segment: string; page_views: number; cta_clicks: number; form_starts: number; submissions: number;
}

export interface MarketingFunnelCounts {
  page_views: number; cta_clicks: number; form_starts: number; submissions: number; failures: number;
}

export interface MarketingDashboard {
  window_days: number;
  totals: MarketingFunnelCounts;
  by_persona: MarketingFunnelSegment[];
  by_campaign: MarketingFunnelSegment[];
}

export async function getMarketingDashboard(): Promise<MarketingDashboard> {
  const response = await authenticatedFetch(`${API_BASE_URL}/marketing-dashboard`);
  if (!response.ok) throw new Error(`Conversion dashboard failed with status ${response.status}.`);
  return response.json() as Promise<MarketingDashboard>;
}

export async function listMarketingLeads(): Promise<MarketingLeadInboxItem[]> {
  const response = await authenticatedFetch(`${API_BASE_URL}/marketing-leads`);
  if (!response.ok) throw new Error(`Lead inbox failed with status ${response.status}.`);
  return response.json() as Promise<MarketingLeadInboxItem[]>;
}

export async function updateMarketingLead(
  leadId: string,
  update: { status: string; assignedTo?: string; nextActionAt?: string; note?: string },
): Promise<{ lead: MarketingLeadInboxItem; history: MarketingLeadHistoryItem[] }> {
  const response = await authenticatedFetch(`${API_BASE_URL}/marketing-leads/${encodeURIComponent(leadId)}`, {
    method: 'PUT', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status: update.status, assigned_to: update.assignedTo, next_action_at: update.nextActionAt, note: update.note }),
  });
  if (!response.ok) throw new Error(`Lead update failed with status ${response.status}.`);
  return response.json() as Promise<{ lead: MarketingLeadInboxItem; history: MarketingLeadHistoryItem[] }>;
}
