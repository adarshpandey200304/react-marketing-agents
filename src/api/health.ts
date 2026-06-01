import { apiUrl } from './client';

/** GET /health → { status: "ok" }. Used to drive the connection dot.
 *  Deliberately token-free (the backend leaves /health public), so it works
 *  before sign-in and doesn't couple the connectivity check to auth. */
export async function ping(): Promise<boolean> {
  try {
    const res = await fetch(apiUrl('/health'));
    if (!res.ok) return false;
    const data = (await res.json()) as { status?: string };
    return data?.status === 'ok';
  } catch {
    return false;
  }
}
