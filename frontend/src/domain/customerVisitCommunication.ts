export type CustomerVisitQuestionTopic =
  | 'timing'
  | 'preparation'
  | 'access'
  | 'service_scope'
  | 'other';

export interface CustomerVisitMessage {
  messageId: string;
  messageVersion: number;
  messageKind: 'customer_question' | 'provider_response';
  authorRole: 'customer' | 'provider';
  topic: CustomerVisitQuestionTopic;
  customerSafeBody: string;
  inReplyToMessageId?: string;
  createdAtEpochSeconds: number;
}

export interface CustomerVisitThread {
  customerVisitReference: string;
  currentVersion: number;
  messages: CustomerVisitMessage[];
}

export interface ProviderCustomerVisitThreadSummary {
  customerVisitReference: string;
  customerName: string;
  propertyDisplayName: string;
  serviceDate: string;
  serviceTitle: string;
  currentVersion: number;
  awaitingProviderResponse: boolean;
  latestMessage?: CustomerVisitMessage;
  updatedAtEpochSeconds: number;
}

export interface ProviderCustomerVisitThreadQueue {
  threads: ProviderCustomerVisitThreadSummary[];
}
