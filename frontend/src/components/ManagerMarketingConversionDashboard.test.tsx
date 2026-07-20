import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ManagerMarketingConversionDashboard } from './ManagerMarketingConversionDashboard';

describe('ManagerMarketingConversionDashboard', () => {
  it('starts with a safe loading state before protected data arrives', () => {
    expect(renderToStaticMarkup(<ManagerMarketingConversionDashboard />)).toContain('Loading conversion dashboard');
  });
});
