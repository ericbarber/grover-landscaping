import type {
  CustomerVisitMessage,
  CustomerVisitQuestionTopic,
  CustomerVisitThread,
} from '../domain/customerVisitCommunication';
import { apiRequestError } from './apiError';
import { authenticatedFetch } from './authenticatedFetch';
import { API_BASE_URL } from './baseUrl';

interface ApiCustomerVisitMessage {
  message_id: string;
  message_version: number;
  message_kind: 'customer_question' | 'provider_response';
  author_role: 'customer' | 'provider';
  topic: CustomerVisitQuestionTopic;
  customer_safe_body: string;
  in_reply_to_message_id?: string;
  created_at_epoch_seconds: number;
}

interface ApiCustomerVisitThread {
  customer_visit_reference: string;
  current_version: number;
  messages: ApiCustomerVisitMessage[];
}

function toMessage(message: ApiCustomerVisitMessage): CustomerVisitMessage {
  return {
    messageId: message.message_id,
    messageVersion: message.message_version,
    messageKind: message.message_kind,
    authorRole: message.author_role,
    topic: message.topic,
    customerSafeBody: message.customer_safe_body,
    ...(message.in_reply_to_message_id
      ? { inReplyToMessageId: message.in_reply_to_message_id }
      : {}),
    createdAtEpochSeconds: message.created_at_epoch_seconds,
  };
}

function toThread(thread: ApiCustomerVisitThread): CustomerVisitThread {
  return {
    customerVisitReference: thread.customer_visit_reference,
    currentVersion: thread.current_version,
    messages: thread.messages.map(toMessage),
  };
}

export async function fetchCustomerVisitThread(
  customerVisitReference: string,
): Promise<CustomerVisitThread> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/customer-portal/visits/${encodeURIComponent(customerVisitReference)}/messages`,
    { headers: { accept: 'application/json' } },
  );
  if (!response.ok) {
    throw await apiRequestError(response, 'The visit conversation could not be loaded.');
  }
  return toThread(await response.json() as ApiCustomerVisitThread);
}

export async function createCustomerVisitQuestion(
  thread: CustomerVisitThread,
  topic: CustomerVisitQuestionTopic,
  customerSafeBody: string,
  idempotencyKey: string,
): Promise<CustomerVisitMessage> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/customer-portal/visits/${encodeURIComponent(thread.customerVisitReference)}/messages`,
    {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({
        expected_thread_version: thread.currentVersion,
        topic,
        customer_safe_body: customerSafeBody,
        idempotency_key: idempotencyKey,
      }),
    },
  );
  if (!response.ok) {
    throw await apiRequestError(response, 'The visit question could not be confirmed.');
  }
  return toMessage(await response.json() as ApiCustomerVisitMessage);
}
