import React from 'react';
import ReactDOM from 'react-dom/client';
import { sharedBidTokenFromPath } from './domain/sharedBidRoute';
import { sharedReportTokenFromPath } from './domain/sharedReportRoute';
import { organizationInvitationTokenFromPath } from './domain/organizationInvitationRoute';
import { RouteLoadBoundary } from './components/RouteLoadBoundary';
import { NetworkStatusBanner } from './components/NetworkStatusBanner';
import { ApiStatusBanner } from './components/ApiStatusBanner';
import { registerProductionServiceWorker } from './registerServiceWorker';
import { ServiceWorkerUpdateBanner } from './components/ServiceWorkerUpdateBanner';
import { InstallAppBanner } from './components/InstallAppBanner';
import { isDiagnosticsPath } from './domain/diagnosticsRoute';
import { isApplicationPath } from './domain/applicationRoute';
import './styles.css';

registerProductionServiceWorker();

const CustomerBidReviewPage = React.lazy(
  () => import('./components/CustomerBidReviewPage')
    .then((module) => ({ default: module.CustomerBidReviewPage })),
);
const CustomerCompletionReportPage = React.lazy(
  () => import('./components/CustomerCompletionReportPage')
    .then((module) => ({ default: module.CustomerCompletionReportPage })),
);
const AuthenticatedExperience = React.lazy(
  () => import('./auth/AuthenticatedExperience')
    .then((module) => ({ default: module.AuthenticatedExperience })),
);
const MobileDiagnosticsPage = React.lazy(
  () => import('./components/MobileDiagnosticsPage')
    .then((module) => ({ default: module.MobileDiagnosticsPage })),
);
const PublicLandingPage = React.lazy(
  () => import('./components/PublicLandingPage')
    .then((module) => ({ default: module.PublicLandingPage })),
);

const diagnosticsRoute = isDiagnosticsPath(window.location.pathname);
const applicationRoute = isApplicationPath(window.location.pathname);
const sharedBidToken = sharedBidTokenFromPath(window.location.pathname);
const sharedReportToken = sharedReportTokenFromPath(window.location.pathname);
const organizationInvitationToken = organizationInvitationTokenFromPath(window.location.pathname);
const showOperationalBanners = diagnosticsRoute
  || applicationRoute
  || Boolean(sharedBidToken)
  || Boolean(sharedReportToken)
  || Boolean(organizationInvitationToken);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {showOperationalBanners ? (
      <>
        <NetworkStatusBanner />
        <ApiStatusBanner />
        <ServiceWorkerUpdateBanner />
        <InstallAppBanner />
      </>
    ) : null}
    <RouteLoadBoundary>
      <React.Suspense fallback={(
        <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
          <p className="text-sm font-semibold text-slate-700" role="status">
            Loading Grover Field…
          </p>
        </main>
      )}>
        {diagnosticsRoute ? (
          <MobileDiagnosticsPage />
        ) : sharedBidToken ? (
          <CustomerBidReviewPage shareToken={sharedBidToken} />
        ) : sharedReportToken ? (
          <CustomerCompletionReportPage shareToken={sharedReportToken} />
        ) : applicationRoute || organizationInvitationToken ? (
          <AuthenticatedExperience organizationInvitationToken={organizationInvitationToken} />
        ) : (
          <PublicLandingPage />
        )}
      </React.Suspense>
    </RouteLoadBoundary>
  </React.StrictMode>,
);
