import { API_BASE_URL } from './baseUrl';

export type MarketingPersona = 'yard_owner' | 'property_manager' | 'landscaping_company' | 'crew_lead';
export type MarketingIntent = 'demo' | 'portfolio_discussion' | 'early_access';

export interface MarketingAttribution {
  source?: string;
  medium?: string;
  campaign?: string;
}

export interface CreateMarketingLeadInput extends MarketingAttribution {
  fullName: string;
  email: string;
  companyName?: string;
  persona: MarketingPersona;
  teamSize?: string;
  intent: MarketingIntent;
  message?: string;
  landingPath: string;
  consentToContact: boolean;
  website?: string;
}

export interface MarketingLeadReceipt {
  id: string;
  persisted: boolean;
}

export function marketingAttributionFromSearch(search: string): MarketingAttribution {
  const params = new URLSearchParams(search);
  const source = params.get('utm_source')?.trim() || undefined;
  const medium = params.get('utm_medium')?.trim() || undefined;
  const campaign = params.get('utm_campaign')?.trim() || undefined;
  return { source, medium, campaign };
}

export async function createMarketingLead(
  input: CreateMarketingLeadInput,
): Promise<MarketingLeadReceipt> {
  const response = await fetch(`${API_BASE_URL}/marketing-leads`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      full_name: input.fullName,
      email: input.email,
      company_name: input.companyName,
      persona: input.persona,
      team_size: input.teamSize,
      intent: input.intent,
      message: input.message,
      source: input.source,
      medium: input.medium,
      campaign: input.campaign,
      landing_path: input.landingPath,
      consent_to_contact: input.consentToContact,
      website: input.website,
    }),
  });

  if (!response.ok) {
    throw new Error(`Marketing request failed with status ${response.status}.`);
  }

  const receipt = await response.json() as {
    id: string;
    persisted: boolean;
  };
  return {
    id: receipt.id,
    persisted: receipt.persisted,
  };
}
