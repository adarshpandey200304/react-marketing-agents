// Thin fetch wrapper. Base URL comes from VITE_API_BASE_URL; when empty we use
// relative paths so the Vite dev proxy (vite.config.ts) forwards to FastAPI.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function url(path: string): string {
  return `${API_BASE_URL}${path}`;
}

/** POST JSON and parse a JSON response, surfacing the backend's { error } shape. */
export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(url(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleJson<T>(res);
}

/** POST multipart/form-data (used by /api/upload). */
export async function postForm<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(url(path), { method: 'POST', body: form });
  return handleJson<T>(res);
}

export async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(url(path));
  return handleJson<T>(res);
}

async function handleJson<T>(res: Response): Promise<T> {
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON or empty body */
  }
  if (!res.ok) {
    const msg = data?.error || data?.detail || `Request failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

export { url as apiUrl };
