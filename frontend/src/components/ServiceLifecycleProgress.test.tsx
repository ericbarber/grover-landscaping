import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ServiceLifecycleProgress } from './ServiceLifecycleProgress';

const steps = [
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'en-route', label: 'On the way' },
  { id: 'care', label: 'Care' },
  { id: 'complete', label: 'Complete' },
] as const;

describe('ServiceLifecycleProgress', () => {
  it('marks exactly one current step and keeps the ordered lifecycle visible', () => {
    const markup = renderToStaticMarkup(
      <ServiceLifecycleProgress currentIndex={2} steps={steps} />,
    );

    expect(markup).toContain('<ol aria-label="Service progress"');
    expect(markup.match(/aria-current="step"/g)).toHaveLength(1);
    expect(markup.indexOf('Confirmed')).toBeLessThan(markup.indexOf('On the way'));
    expect(markup.indexOf('On the way')).toBeLessThan(markup.indexOf('Care'));
    expect(markup.indexOf('Care')).toBeLessThan(markup.indexOf('Complete'));
  });

  it('allows a context-specific accessible label without changing step labels', () => {
    const markup = renderToStaticMarkup(
      <ServiceLifecycleProgress
        ariaLabel="Mesa Court service progress"
        currentIndex={0}
        steps={steps}
      />,
    );

    expect(markup).toContain('aria-label="Mesa Court service progress"');
    expect(markup).toContain('Confirmed');
    expect(markup).toContain('Complete');
  });

  it('renders completed markers only before the current step', () => {
    const firstMarkup = renderToStaticMarkup(
      <ServiceLifecycleProgress currentIndex={0} steps={steps} />,
    );
    const lastMarkup = renderToStaticMarkup(
      <ServiceLifecycleProgress currentIndex={3} steps={steps} />,
    );

    expect(firstMarkup).not.toContain('<svg');
    expect(lastMarkup.match(/<svg/g) ?? []).toHaveLength(3);
  });

  it('keeps one current step when the supplied index falls outside the lifecycle', () => {
    const beforeMarkup = renderToStaticMarkup(
      <ServiceLifecycleProgress currentIndex={-1} steps={steps} />,
    );
    const afterMarkup = renderToStaticMarkup(
      <ServiceLifecycleProgress currentIndex={99} steps={steps} />,
    );

    expect(beforeMarkup.match(/aria-current="step"/g)).toHaveLength(1);
    expect(afterMarkup.match(/aria-current="step"/g)).toHaveLength(1);
    expect(beforeMarkup.indexOf('aria-current="step"')).toBeLessThan(beforeMarkup.indexOf('On the way'));
    expect(afterMarkup.indexOf('aria-current="step"')).toBeGreaterThan(afterMarkup.indexOf('Care'));
  });
});
