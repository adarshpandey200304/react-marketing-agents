import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { EventType } from '@azure/msal-browser';
import type { AuthenticationResult } from '@azure/msal-browser';
import { msalInstance } from './auth/msalConfig';
import { DEV_AUTH } from './auth/getAuthToken';
import App from './App';
import LoginPage from './components/LoginPage';
import './styles/app.css';

// In dev-auth mode the login gate is bypassed: render <App/> directly. We still
// keep MsalProvider mounted so components using useMsal() (e.g. Header) work.
const gate = DEV_AUTH ? (
  <App />
) : (
  <>
    <AuthenticatedTemplate>
      <App />
    </AuthenticatedTemplate>
    <UnauthenticatedTemplate>
      <LoginPage />
    </UnauthenticatedTemplate>
  </>
);

// MSAL v3 requires initialize() before any other API and before rendering, so it
// can process the redirect callback. Render inside the .then() (no top-level await).
void msalInstance.initialize().then(() => {
  // MSAL doesn't set an active account automatically — do it on load + on login,
  // so silent token acquisition can always find the account.
  if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {
    msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
  }
  msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      msalInstance.setActiveAccount((event.payload as AuthenticationResult).account);
    }
  });

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>{gate}</MsalProvider>
    </StrictMode>,
  );
});
