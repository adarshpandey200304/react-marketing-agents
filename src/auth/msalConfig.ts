import { PublicClientApplication, LogLevel } from '@azure/msal-browser';
import type { Configuration } from '@azure/msal-browser';

// Single-tenant Microsoft Entra ID sign-in. clientId + tenantId come from env
// (the same values the backend validates against — see services/auth.py).
const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage', // survives reloads and new tabs
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Error,
      loggerCallback: (level, message) => {
        if (level === LogLevel.Error) console.error('[MSAL]', message);
      },
    },
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

// Scopes used for sign-in and silent token refresh. `User.Read` is a default
// Microsoft Graph delegated permission present on every app registration, so no
// extra portal setup is needed — it is only used to keep a fresh ID token, which
// is what the backend validates (aud == client id).
export const LOGIN_SCOPES = ['User.Read'];
