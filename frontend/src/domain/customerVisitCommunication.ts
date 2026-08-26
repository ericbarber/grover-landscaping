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
