# Typography

The visual direction pairs an editorial display face with a highly legible
interface sans serif.

## Roles

- **Editorial display:** Iowan Old Style, Palatino, or Georgia fallback. Use for
  marketing headlines, customer proof moments, and selected workspace greetings.
- **Interface:** Inter, Segoe UI, or system sans-serif fallback. Use for every
  control, data value, status, table, form, and operational heading.
- **Monospace:** use only for immutable audit IDs, diagnostic values, and code-like
  support details.

In production React, `font-display` and `grover-display` identify editorial
moments. `grover-type-operational` explicitly resets task titles and data back
to the interface family when they sit inside an otherwise editorial surface.
Destination names such as Visits, Proof, Account, Schedule, Reports, Team, and
Recovery are operational. A customer greeting, property/place promise, service
name, service date, or delivered-care moment may remain editorial. Status,
failure, loading, decision, queue, and monetary values are always interface
text. This boundary was audited across the authenticated persona surfaces on
September 19, 2026; future workflow slices should apply the semantic role rather
than matching the nearest heading visually.

## Scale

| Role | Desktop | Mobile | Guidance |
| --- | --- | --- | --- |
| Marketing display | 56–68px | 40–48px | Short lines and intentional wrapping |
| Page title | 28–34px | 24–28px | One per page |
| Section heading | 20–24px | 18–22px | Scannable content grouping |
| Operational heading | 15–18px | 15–17px | Lists, cards, panels, records |
| Body | 14–18px | 14–16px | Never compress instructions below 14px |
| Metadata | 11–13px | 11–13px | Dates, counts, status context |
| Eyebrow | 9–12px | 9–11px | Uppercase with deliberate tracking |

Use weight before size to distinguish dense operational hierarchy. Avoid all-caps
sentences, excessive bold copy, and decorative display type inside tools.
