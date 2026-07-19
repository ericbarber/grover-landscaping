# Mobile Diagnostics

Open `/diagnostics` on the same Grover Field origin to check a phone without
signing in. The page reports:

- browser network status;
- the configured API readiness response;
- secure-context availability;
- service-worker support and whether a worker controls the page; and
- browser versus installed home-screen display mode.

Use **Run checks again** after changing Wi-Fi, cellular, VPN, or API availability.
An API result is bounded by a five-second timeout. The diagnostics page does not
read authentication state, tenant data, or cached field-work records.

Network and service-worker-control results update while the page is open. **Copy
safe support details** writes a timestamped text summary containing only origins,
capability states, and the browser user agent. It deliberately omits the current
path, query string, authentication state, and customer or tenant data.
On phones that support the Web Share API, **Share safe support details** sends
the same sanitized text through the native share sheet. Canceling the share sheet
does not show an error.

An inactive offline shell can be expected on local Vite development, in an
insecure non-localhost browser context, or before the production service worker
finishes its first registration. Reload the production page once after initial
registration before treating that result as a fault.
