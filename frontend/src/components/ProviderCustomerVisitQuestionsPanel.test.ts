import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { CustomerVisitMessage } from '../domain/customerVisitCommunication';
import {
  ProviderCustomerVisitQuestionsPanel,
  unansweredCustomerQuestions,
} from './ProviderCustomerVisitQuestionsPanel';

const question: CustomerVisitMessage = {
  messageId: 'question-1',
  messageVersion: 1,
  messageKind: 'customer_question',
  authorRole: 'customer',
  topic: 'access',
  customerSafeBody: 'Should the side gate be unlocked?',
  createdAtEpochSeconds: 1_800_000_000,
};

describe('provider customer visit questions panel', () => {
  it('finds questions without an exact provider response', () => {
    const response: CustomerVisitMessage = {
      messageId: 'response-1',
      messageVersion: 2,
      messageKind: 'provider_response',
      authorRole: 'provider',
      topic: 'access',
      customerSafeBody: 'Yes, please unlock it before the arrival window.',
      inReplyToMessageId: question.messageId,
      createdAtEpochSeconds: 1_800_000_060,
    };
    const secondQuestion = { ...question, messageId: 'question-2', messageVersion: 3 };

    expect(unansweredCustomerQuestions([question, response, secondQuestion]))
      .toEqual([secondQuestion]);
  });

  it('starts with an explicit authoritative loading state', () => {
    const markup = renderToStaticMarkup(createElement(ProviderCustomerVisitQuestionsPanel));

    expect(markup).toContain('Visit questions');
    expect(markup).toContain('Loading visit questions');
    expect(markup).not.toContain('response time');
    expect(markup).not.toContain('notification');
  });
});
