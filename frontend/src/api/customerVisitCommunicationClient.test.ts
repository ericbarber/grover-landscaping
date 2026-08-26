import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureApiAuthentication } from './authenticatedFetch';
import {
  createCustomerVisitQuestion,
  createProviderCustomerVisitResponse,
  fetchCustomerVisitThread,
  fetchProviderCustomerVisitThread,
  fetchProviderCustomerVisitThreads,
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

  it('maps the unanswered-first provider queue without operational identifiers', async () => {
    const apiQueue = {
      threads: [{
        customer_visit_reference: apiThread.customer_visit_reference,
        customer_name: 'Jordan Lee',
        property_display_name: 'Home',
        service_date: '2026-08-28',
        service_title: 'Weekly yard care',
        current_version: 1,
        awaiting_provider_response: true,
        latest_message: apiThread.messages[0],
        updated_at_epoch_seconds: 1_800_000_000,
      }],
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify(apiQueue), { status: 200 }),
    ));

    await expect(fetchProviderCustomerVisitThreads()).resolves.toEqual({
      threads: [{
        customerVisitReference: apiThread.customer_visit_reference,
        customerName: 'Jordan Lee',
        propertyDisplayName: 'Home',
        serviceDate: '2026-08-28',
        serviceTitle: 'Weekly yard care',
        currentVersion: 1,
        awaitingProviderResponse: true,
        latestMessage: expect.objectContaining({
          messageId: 'customer_visit_message_1',
          customerSafeBody: 'Will you arrive near the start of the window?',
        }),
        updatedAtEpochSeconds: 1_800_000_000,
      }],
    });
  });

  it('loads the exact provider thread from its opaque customer visit reference', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(apiThread), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await fetchProviderCustomerVisitThread(apiThread.customer_visit_reference);

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      `/provider-customer-visit-threads/${apiThread.customer_visit_reference}`,
    );
  });

  it('posts only the exact reply target, current version, safe response, and retry key', async () => {
    const responseMessage = {
      message_id: 'customer_visit_message_2', message_version: 2,
      message_kind: 'provider_response', author_role: 'provider', topic: 'timing',
      customer_safe_body: 'Yes, the crew is scheduled near the start.',
      in_reply_to_message_id: 'customer_visit_message_1',
      created_at_epoch_seconds: 1_800_000_060,
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(responseMessage), { status: 201 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const thread: CustomerVisitThread = {
      customerVisitReference: apiThread.customer_visit_reference,
      currentVersion: 1,
      messages: [],
    };

    await createProviderCustomerVisitResponse(
      thread,
      'customer_visit_message_1',
      'Yes, the crew is scheduled near the start.',
      'provider-visit-response-001',
    );

    const request = fetchMock.mock.calls[fetchMock.mock.calls.length - 1]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toEqual({
      expected_thread_version: 1,
      in_reply_to_message_id: 'customer_visit_message_1',
      customer_safe_body: 'Yes, the crew is scheduled near the start.',
      idempotency_key: 'provider-visit-response-001',
    });
  });
});
