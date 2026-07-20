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
let memorySessionId: string | undefined;

export function createAnonymousMarketingSessionId(): string {
  const randomUuid = window.crypto?.randomUUID?.bind(window.crypto);
  if (randomUuid) return `ms_${randomUuid()}`;

  const randomValues = window.crypto?.getRandomValues?.bind(window.crypto);
  if (randomValues) {
    const values = randomValues(new Uint32Array(4));
    return `ms_${Array.from(values, (value) => value.toString(16).padStart(8, '0')).join('')}`;
  }

  return `ms_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

export function marketingSessionId(): string {
  if (memorySessionId) return memorySessionId;

  try {
    const existing = window.sessionStorage.getItem(sessionKey);
    if (existing) {
      memorySessionId = existing;
      return existing;
    }
  } catch {
    // Safari privacy modes and embedded browsers may deny session storage.
  }

  memorySessionId = createAnonymousMarketingSessionId();
  try {
    window.sessionStorage.setItem(sessionKey, memorySessionId);
  } catch {
    // The in-memory identifier is sufficient when storage is unavailable.
  }
  return memorySessionId;
}

export function trackMarketingEvent(
  eventName: MarketingEventName,
  persona: MarketingPersona,
  detail?: string,
): void {
  try {
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
  } catch {
    // Measurement must never prevent the public experience from rendering.
  }
}
