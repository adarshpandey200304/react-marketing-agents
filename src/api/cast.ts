import { apiUrl, postJson } from './client';
import type { CastChunk, Language } from '../types';

/**
 * POST /api/cast_report/stream — SSE consumption (frontend-migration.md §6).
 * Replaces the Streamlit thread+poll hack with a direct ReadableStream reader.
 * `onChunk` is called for each parsed event. Aborts when `signal` fires.
 */
export async function streamCastReport(
  params: { conversationId: string; language: Language },
  onChunk: (chunk: CastChunk) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(apiUrl('/api/cast_report/stream'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Generate cast report',
      conversation_id: params.conversationId,
      language: params.language,
      intent: 'cast_report',
    }),
    signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`Cast stream failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split('\n\n'); // SSE event delimiter
    buffer = parts.pop() ?? '';
    for (const part of parts) {
      const line = part.trim();
      if (line.startsWith('data: ')) {
        try {
          onChunk(JSON.parse(line.slice(6)) as CastChunk);
        } catch {
          /* ignore malformed event */
        }
      }
    }
  }
}

/** POST /api/cast_edit — regenerate report from an edited cast list (§3).
 *  Returns only a status; caller must re-trigger the report afterwards. */
export function castEdit(params: {
  conversationId: string;
  identityAnchors: Record<string, string>;
}): Promise<{ status: string; cast_count: number }> {
  return postJson('/api/cast_edit', {
    conversation_id: params.conversationId,
    identity_anchors: params.identityAnchors,
  });
}
