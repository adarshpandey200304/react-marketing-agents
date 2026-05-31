import { postJson } from './client';

/** POST /api/briefing_edit — save a manually edited briefing card (§3).
 *  Sends FLAT string values; the backend re-wraps each as { value, source }. */
export function briefingEdit(params: {
  conversationId: string;
  briefingCard: Record<string, string>;
}): Promise<{ status: string; reply: string }> {
  return postJson('/api/briefing_edit', {
    conversation_id: params.conversationId,
    briefing_card: params.briefingCard,
  });
}
