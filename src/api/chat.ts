import { postJson, postForm } from './client';
import type { Action, BriefingField, CreativeImage, Intent, Language } from '../types';

export interface MessageResponse {
  reply: string;
  suggested_actions?: Action[];
  cast_edit_data?: Record<string, string>;
  briefing_edit_data?: Record<string, BriefingField | string>;
  creative_images?: CreativeImage[];
}

/** POST /api/message — main chat router (§3). Omit `intent` to let the backend classify. */
export function sendMessage(params: {
  message: string;
  conversationId: string;
  language: Language;
  intent?: Intent;
}): Promise<MessageResponse> {
  const body: Record<string, unknown> = {
    message: params.message,
    conversation_id: params.conversationId,
    language: params.language,
  };
  // Only send real server intents; never leak the client-only pseudo-intents.
  if (params.intent && !params.intent.startsWith('_')) {
    body.intent = params.intent;
  }
  return postJson<MessageResponse>('/api/message', body);
}

export interface UploadResponse {
  reply: string;
  suggested_actions?: Action[];
}

/** POST /api/upload — multipart document upload (§3). */
export function uploadFiles(params: {
  files: File[];
  conversationId: string;
  language: Language;
}): Promise<UploadResponse> {
  const form = new FormData();
  form.append('conversation_id', params.conversationId);
  form.append('language', params.language);
  for (const f of params.files) form.append('files', f);
  return postForm<UploadResponse>('/api/upload', form);
}
