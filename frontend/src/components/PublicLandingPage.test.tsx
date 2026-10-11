import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PublicLandingPage } from './PublicLandingPage';

describe('PublicLandingPage', () => {
  it('leads the company path with supported operations and one setup outcome', () => {
    const markup = renderToStaticMarkup(<PublicLandingPage initialPersonaId="company" />);

    expect(markup).toContain('Plan the day. Guide the crew. Prove the work.');
    expect(markup).toContain('Start company setup');
    expect(markup).toContain('Request a walkthrough');
    expect(markup).toContain('customer-ready proof');
    expect(markup).toContain('href="#main-content"');
    expect(markup).toContain('<main');
    expect(markup).toContain('<footer');
    expect(markup).not.toContain('completed revenue');
    expect(markup).not.toContain('Turn work into revenue');
    expect(markup).not.toContain('Revenue handoffs');
    expect(markup).not.toContain('billing stays connected');
  });

  it('keeps non-company audiences available without replacing their primary path', () => {
    const ownerMarkup = renderToStaticMarkup(<PublicLandingPage initialPersonaId="owner" />);
    const managerMarkup = renderToStaticMarkup(
      <PublicLandingPage initialPersonaId="property-manager" />,
    );

    expect(ownerMarkup).toContain('Create my private yard');
    expect(ownerMarkup).toContain('connect a provider you know');
    expect(ownerMarkup).not.toContain('From finding care');
    expect(managerMarkup).toContain('Discuss my portfolio');
    expect(managerMarkup).toContain('properties you are authorized to access');
    expect(managerMarkup).not.toContain('Vendor accountability');
    expect(managerMarkup).toContain('aria-label="Choose your perspective"');
  });

  it('keeps the entry hero focused and moves persona review into the second section', () => {
    const companyMarkup = renderToStaticMarkup(
      <PublicLandingPage initialPersonaId="company" />,
    );
    const ownerMarkup = renderToStaticMarkup(<PublicLandingPage initialPersonaId="owner" />);

    for (const markup of [companyMarkup, ownerMarkup]) {
      expect(markup.match(/<h1/g)).toHaveLength(1);
      expect(markup.indexOf('data-testid="marketing-hero"')).toBeLessThan(
        markup.indexOf('id="who-its-for"'),
      );
      expect(markup.indexOf('role="tablist"')).toBeLessThan(
        markup.indexOf('id="persona-review-panel"'),
      );
    }
    const companyHero = companyMarkup.slice(
      companyMarkup.indexOf('data-testid="marketing-hero"'),
      companyMarkup.indexOf('id="who-its-for"'),
    );
    expect(companyHero).toContain('/brand/yardfolio-landscape-home-hero.webp');
    expect(companyHero).toContain('See how it works');
    expect(companyHero).not.toContain('Sample landscaping company workspace');
    expect(companyHero).not.toContain('hero-entry-preview');
    expect(companyHero).not.toContain('Request a walkthrough');
    expect(companyMarkup).toContain('Plan the day. Guide the crew. Prove the work.');
    expect(companyMarkup).toContain('Built first for yard owners, connected to everyone who helps.');
    expect(ownerMarkup).not.toContain('Sample yard owner workspace');
    expect(ownerMarkup).toContain('Know what happened—without chasing an update.');
    expect(ownerMarkup).toContain('Create my private yard');
    expect(ownerMarkup).not.toContain('Join early access');
  });

  it('uses the landscape image as the focused hero background', () => {
    const ownerMarkup = renderToStaticMarkup(<PublicLandingPage initialPersonaId="owner" />);
    const companyMarkup = renderToStaticMarkup(
      <PublicLandingPage initialPersonaId="company" />,
    );

    for (const markup of [ownerMarkup, companyMarkup]) {
      expect(markup).toContain('data-testid="hero-visual"');
      expect(markup).toContain('/brand/yardfolio-landscape-home-hero.webp');
      expect(markup).not.toContain('Sample service journey');
      expect(markup).not.toContain('data-testid="hero-entry-preview"');
    }
  });

  it('organizes audiences into owner-first customer and service groups', () => {
    const markup = renderToStaticMarkup(<PublicLandingPage initialPersonaId="owner" />);

    expect(markup).toContain('Property customers');
    expect(markup).toContain('Service teams');
    expect(markup).toContain('Yard owner first');
    expect(markup).toContain('Yard owners are our first priority.');
    expect(markup.indexOf('id="persona-review-tab-owner"')).toBeLessThan(
      markup.indexOf('id="persona-review-tab-property-manager"'),
    );
    expect(markup.indexOf('id="persona-review-tab-property-manager"')).toBeLessThan(
      markup.indexOf('id="persona-review-tab-company"'),
    );
    expect(markup.indexOf('id="persona-review-tab-company"')).toBeLessThan(
      markup.indexOf('id="persona-review-tab-crew"'),
    );
  });
});
