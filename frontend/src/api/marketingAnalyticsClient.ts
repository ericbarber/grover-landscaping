import { API_BASE_URL } from './baseUrl';
import { marketingAttributionFromSearch, type MarketingPersona } from './marketingLeadsClient';

export type MarketingEventName =
  | 'page_view'
  | 'persona_selected'
  | 'tour_step_selected'
  | 'cta_clicked'
  | 'form_started'
  | 'form_submitted'
  | 'form_failed';

const sessionKey = 'grover.marketing-session.v1';

export function marketingSessionId(): string {
  const existing = window.sessionStorage.getItem(sessionKey);
  if (existing) return existing;
  const id = `ms_${window.crypto.randomUUID()}`;
  window.sessionStorage.setItem(sessionKey, id);
  return id;
}

export function trackMarketingEvent(
  eventName: MarketingEventName,
  persona: MarketingPersona,
  detail?: string,
): void {
  const attribution = marketingAttributionFromSearch(window.location.search);
  void fetch(`${API_BASE_URL}/marketing-events`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({
      session_id: marketingSessionId(),
      event_name: eventName,
      persona,
      detail,
      source: attribution.source,
      medium: attribution.medium,
      campaign: attribution.campaign,
      landing_path: `${window.location.pathname}${window.location.search}`,
    }),
  }).catch(() => undefined);
}
