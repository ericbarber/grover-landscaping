import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { CustomerBidReviewPage } from './components/CustomerBidReviewPage';
import { CustomerCompletionReportPage } from './components/CustomerCompletionReportPage';
import { sharedBidTokenFromPath } from './domain/sharedBidRoute';
import { sharedReportTokenFromPath } from './domain/sharedReportRoute';
import { AuthGate } from './auth/AuthGate';
import { AuthProvider } from './auth/AuthProvider';
import './styles.css';

const sharedBidToken = sharedBidTokenFromPath(window.location.pathname);
const sharedReportToken = sharedReportTokenFromPath(window.location.pathname);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {sharedBidToken ? (
      <CustomerBidReviewPage shareToken={sharedBidToken} />
    ) : sharedReportToken ? (
      <CustomerCompletionReportPage shareToken={sharedReportToken} />
    ) : (
      <AuthProvider>
        <AuthGate>
          <App />
        </AuthGate>
      </AuthProvider>
    )}
  </React.StrictMode>,
);
