import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  WorkspaceStatusBadge,
  WorkspaceStatusNotice,
  workspaceStatusRole,
} from './WorkspaceStatus';

describe('workspace status primitives', () => {
  it('reserves alert semantics for dangerous states', () => {
    expect(workspaceStatusRole('danger')).toBe('alert');
    expect(workspaceStatusRole('warning')).toBe('status');
    expect(workspaceStatusRole('success')).toBe('status');
    expect(workspaceStatusRole('info')).toBe('status');
    expect(workspaceStatusRole('neutral')).toBe('status');
  });

  it('renders semantic notices and bounded status pills from one visual contract', () => {
    const notice = renderToStaticMarkup(createElement(WorkspaceStatusNotice, {
      detail: 'Retry after readiness recovers.',
      title: 'Route unavailable',
      tone: 'danger',
    }));
    const badge = renderToStaticMarkup(createElement(WorkspaceStatusBadge, {
      children: 'Everything synced',
      tone: 'success',
    }));

    expect(notice).toContain('role="alert"');
    expect(notice).toContain('<svg');
    expect(notice).toContain('Route unavailable');
    expect(badge).toContain('rounded-full');
    expect(badge).toContain('Everything synced');
  });

  it('can expose a notice title as the page state heading', () => {
    const notice = renderToStaticMarkup(createElement(WorkspaceStatusNotice, {
      detail: 'Protected facts remain hidden.',
      title: 'Customer portal access is not active.',
      titleAs: 'h2',
      tone: 'warning',
    }));

    expect(notice).toContain('<h2');
    expect(notice).toContain('Customer portal access is not active.</h2>');
  });
});
