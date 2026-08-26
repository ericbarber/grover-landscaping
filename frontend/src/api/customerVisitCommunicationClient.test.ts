import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureApiAuthentication } from './authenticatedFetch';
import {
  createCustomerVisitQuestion,
  fetchCustomerVisitThread,
} from './customerVisitCommunicationClient';
import type { CustomerVisitThread } from '../domain/customerVisitCommunication';

afterEach(() => {
  configureApiAuthentication(false, async () => null);
  vi.unstubAllGlobals();
});

const apiThread = {
  customer_visit_reference: 'customer_visit_0123456789abcdef0123456789abcdef',
  current_version: 1,
  messages: [{
    message_id: 'customer_visit_message_1', message_version: 1,
    message_kind: 'customer_question', author_role: 'customer', topic: 'timing',
    customer_safe_body: 'Will you arrive near the start of the window?',
    created_at_epoch_seconds: 1_800_000_000, persisted: true,
  }],
  persisted: true,
};

describe('customer visit communication client', () => {
  it('maps the minimized authoritative thread', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify(apiThread), { status: 200 }),
    ));

    await expect(fetchCustomerVisitThread(apiThread.customer_visit_reference)).resolves.toMatchObject({
      customerVisitReference: apiThread.customer_visit_reference,
      currentVersion: 1,
      messages: [{ authorRole: 'customer', topic: 'timing' }],
    });
  });

  it('posts only the current version, safe question, topic, and retry key', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(apiThread.messages[0]), { status: 201 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const thread: CustomerVisitThread = {
      customerVisitReference: apiThread.customer_visit_reference,
      currentVersion: 1,
      messages: [],
    };
    await createCustomerVisitQuestion(
      thread,
      'access',
      'Should I leave the side gate unlocked?',
      'customer-visit-question-001',
    );
    const request = fetchMock.mock.calls[fetchMock.mock.calls.length - 1]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toEqual({
      expected_thread_version: 1,
      topic: 'access',
      customer_safe_body: 'Should I leave the side gate unlocked?',
      idempotency_key: 'customer-visit-question-001',
    });
  });
});
