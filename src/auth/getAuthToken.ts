import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { msalInstance, LOGIN_SCOPES } from './msalConfig';

// Local-dev auth bypass: when VITE_DEV_AUTH=true, skip MSAL and send a hardcoded
// developer token the backend accepts (DEV_AUTH=true there). NEVER ship enabled.
export const DEV_AUTH = import.meta.env.VITE_DEV_AUTH === 'true';
const DEV_AUTH_TOKEN = import.meta.env.VITE_DEV_AUTH_TOKEN ?? 'dev-local-token';

/**
 * Returns a fresh ID token to send as `Authorization: Bearer <jwt>`.
 * Plain module (no React) so it can be used by the SSE fetch in cast.ts too.
 * On `InteractionRequiredAuthError` it redirects to re-authenticate (the page
 * reloads), so callers should acquire the token *before* opening a long stream.
 */
export async function getAuthToken(): Promise<string> {
  if (DEV_AUTH) return DEV_AUTH_TOKEN;

  const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];
  if (!account) throw new Error('Not signed in');
  try {
    const result = await msalInstance.acquireTokenSilent({ scopes: LOGIN_SCOPES, account });
    return result.idToken;
  } catch (err) {
    if (err instanceof InteractionRequiredAuthError) {
      await msalInstance.acquireTokenRedirect({ scopes: LOGIN_SCOPES, account });
      throw new Error('Redirecting for authentication');
    }
    throw err;
  }
}
