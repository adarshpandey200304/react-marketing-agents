import { getJson } from './client';

/** GET /health → { status: "ok" }. Used to drive the connection dot. */
export async function ping(): Promise<boolean> {
  try {
    const res = await getJson<{ status: string }>('/health');
    return res?.status === 'ok';
  } catch {
    return false;
  }
}
