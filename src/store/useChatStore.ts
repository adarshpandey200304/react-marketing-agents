import { create } from 'zustand';
import type {
  Action,
  CastChunk,
  CastProfile,
  ConversationSummary,
  EditingState,
  Language,
  Message,
  ThinkingStep,
  WorkflowStep,
} from '../types';
import { WORKFLOW_STEPS } from '../i18n/strings';
import { sendMessage as apiSendMessage, uploadFiles } from '../api/chat';
import { streamCastReport, castEdit } from '../api/cast';
import { briefingEdit } from '../api/briefing';
import { ping } from '../api/health';
import { getJson } from '../api/client';

const CONV_KEY = 'ma_conversation_id';
const LANG_KEY = 'ma_language';

function loadConversationId(): string {
  // Per-session id: sessionStorage survives reloads within the same tab, but a new
  // browser session / tab starts fresh — so uploaded documents never leak across
  // sessions. (Previously this used localStorage, which made one permanent
  // conversation that accumulated every doc ever uploaded.)
  localStorage.removeItem(CONV_KEY); // drop the old cross-session id if present
  const existing = sessionStorage.getItem(CONV_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  sessionStorage.setItem(CONV_KEY, id);
  return id;
}

function loadLanguage(): Language {
  const v = localStorage.getItem(LANG_KEY);
  return v === 'english' || v === 'german' ? v : 'german';
}

function now(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const newId = () => crypto.randomUUID();

interface ChatState {
  conversationId: string;
  conversations: ConversationSummary[]; // sidebar: the user's past sessions
  sidebarOpen: boolean; // drawer open/closed
  messages: Message[];
  processing: boolean;
  language: Language;
  isConnected: boolean;
  stagedFiles: File[];
  draft: string;
  editing: EditingState | null;
  pendingUploadText: string | null; // content_briefing button → open picker, then auto-submit

  // guided workflow stepper
  completedSteps: WorkflowStep[]; // stages the user has finished, in any order
  activeStep: WorkflowStep | null; // stage currently running (for the pulse)

  // basic setters
  setDraft: (v: string) => void;
  registerFilePicker: (fn: () => void) => void;
  submitPendingUpload: () => Promise<void>;
  setLanguage: (l: Language) => void;
  setConnected: (c: boolean) => void;
  addFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  openEdit: (e: EditingState) => void;
  closeEdit: () => void;
  newConversation: () => void;
  fetchConversations: () => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  toggleSidebar: () => void;
  closeSidebar: () => void;

  // guided workflow stepper
  goToStep: (step: WorkflowStep) => Promise<void>;
  markStepDone: (step: WorkflowStep) => void;

  // message helpers
  pushMessage: (m: Message) => string;
  updateMessage: (id: string, patch: Partial<Message>) => void;

  // flows
  checkHealth: () => Promise<void>;
  submitComposer: () => Promise<void>;
  handleAction: (action: Action) => Promise<void>;
  startCastStream: () => Promise<void>;
  confirmCastEdit: (anchors: Record<string, string>) => Promise<void>;
  confirmBriefingEdit: (card: Record<string, string>) => Promise<void>;
}

let streamAbort: AbortController | null = null;
// Opens the hidden <input type=file> in App; registered on mount.
let externalFilePicker: (() => void) | null = null;

export const useChatStore = create<ChatState>((set, get) => ({
  conversationId: loadConversationId(),
  conversations: [],
  sidebarOpen: false,
  messages: [],
  processing: false,
  language: loadLanguage(),
  isConnected: false,
  stagedFiles: [],
  draft: '',
  editing: null,
  pendingUploadText: null,
  completedSteps: [],
  activeStep: null,

  setDraft: (v) => set({ draft: v }),
  registerFilePicker: (fn) => {
    externalFilePicker = fn;
  },
  // Once files land after a content_briefing button, submit with the saved text.
  submitPendingUpload: async () => {
    const { pendingUploadText, stagedFiles, processing } = get();
    if (processing || !pendingUploadText || stagedFiles.length === 0) return;
    set({ draft: pendingUploadText, pendingUploadText: null });
    await get().submitComposer();
  },
  setLanguage: (l) => {
    localStorage.setItem(LANG_KEY, l);
    set({ language: l });
  },
  setConnected: (c) => set({ isConnected: c }),
  addFiles: (files) => set((s) => ({ stagedFiles: [...s.stagedFiles, ...files] })),
  removeFile: (index) => set((s) => ({ stagedFiles: s.stagedFiles.filter((_, i) => i !== index) })),
  clearFiles: () => set({ stagedFiles: [] }),
  openEdit: (e) => set({ editing: e }),
  closeEdit: () => set({ editing: null }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),

  // Start a fresh session: new conversation id + cleared chat/doc state. The new
  // id means the server creates a new session, so the briefing only ever sees
  // documents uploaded in this session.
  newConversation: () => {
    if (streamAbort) {
      streamAbort.abort();
      streamAbort = null;
    }
    const id = crypto.randomUUID();
    sessionStorage.setItem(CONV_KEY, id);
    set({
      conversationId: id,
      messages: [],
      processing: false,
      editing: null,
      stagedFiles: [],
      draft: '',
      pendingUploadText: null,
      completedSteps: [],
      activeStep: null,
    });
    void get().fetchConversations();
  },

  // --- sidebar: list past sessions + load one's history ---
  fetchConversations: async () => {
    try {
      const res = await getJson<{ conversations: ConversationSummary[] }>('/api/conversations');
      set({ conversations: res.conversations ?? [] });
    } catch {
      /* sidebar just stays as-is on failure */
    }
  },

  // Load a past session: hydrate messages from stored chat_history. Rich widgets
  // (cast carousel, edit tables, follow-up chips) are NOT reconstructed — only
  // the markdown content is stored — so everything renders as plain bubbles.
  loadConversation: async (conversationId: string) => {
    if (get().processing) return;
    if (streamAbort) {
      streamAbort.abort();
      streamAbort = null;
    }
    try {
      const res = await getJson<{
        conversation_id: string;
        chat_history: { role: string; content: string; timestamp?: string }[];
      }>(`/api/conversations/${conversationId}`);
      const messages: Message[] = (res.chat_history ?? []).map((m) => ({
        id: newId(),
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
        timestamp: m.timestamp ? m.timestamp.slice(11, 16) : now(),
        kind: m.role === 'assistant' ? 'markdown' : undefined,
      }));
      sessionStorage.setItem(CONV_KEY, conversationId);
      set({
        conversationId,
        messages,
        processing: false,
        editing: null,
        stagedFiles: [],
        draft: '',
        pendingUploadText: null,
        completedSteps: [],
        activeStep: null,
      });
    } catch (e) {
      get().pushMessage(errorMessage(e));
    }
  },

  // --- guided workflow stepper ---
  // Dispatch the action behind a stepper stage. content_briefing flows through
  // handleAction (which opens the file picker); the others hit /api/message.
  goToStep: async (step) => {
    if (get().processing) return;
    const def = WORKFLOW_STEPS.find((s) => s.id === step);
    if (!def) return;
    set({ activeStep: step });
    await get().handleAction({ title: def.label.english, value: def.trigger, intent: def.intent });
  },
  markStepDone: (step) =>
    set((s) => ({
      activeStep: s.activeStep === step ? null : s.activeStep,
      completedSteps: s.completedSteps.includes(step) ? s.completedSteps : [...s.completedSteps, step],
    })),

  pushMessage: (m) => {
    set((s) => ({ messages: [...s.messages, m] }));
    return m.id;
  },
  updateMessage: (id, patch) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),

  checkHealth: async () => {
    const ok = await ping();
    set({ isConnected: ok });
  },

  // --- §5.1 / §5.2: plain message + optional upload ---
  submitComposer: async () => {
    const { draft, stagedFiles, processing } = get();
    const text = draft.trim();
    if (processing) return;
    if (!text && stagedFiles.length === 0) return;

    const attachmentNames = stagedFiles.map((f) => f.name);
    get().pushMessage({
      id: newId(),
      role: 'user',
      content: text || (attachmentNames.length ? '📎 ' + attachmentNames.join(', ') : ''),
      timestamp: now(),
      attachmentNames: attachmentNames.length ? attachmentNames : undefined,
    });

    const filesToSend = stagedFiles;
    set({ processing: true, draft: '', stagedFiles: [] });

    const { conversationId, language } = get();
    try {
      // Always upload first when files are staged (§5.2). Mirrors get_bot_reply:
      // when there is ALSO typed text, only the message reply is surfaced — the
      // upload reply is consumed silently. Upload-only shows the upload reply.
      let uploadReply: string | undefined;
      let uploadActions: Action[] | undefined;
      if (filesToSend.length > 0) {
        const up = await uploadFiles({ files: filesToSend, conversationId, language });
        uploadReply = up.reply;
        uploadActions = up.suggested_actions;
      }
      if (text) {
        const res = await apiSendMessage({ message: text, conversationId, language });
        get().pushMessage(
          assistantFromReply(res.reply, res.suggested_actions, res.cast_edit_data, res.briefing_edit_data),
        );
        // A returned briefing card means the Content Briefing stage is done.
        if (res.briefing_edit_data) get().markStepDone('content_briefing');
      } else if (uploadReply) {
        get().pushMessage(assistantFromReply(uploadReply, uploadActions));
      }
      void get().fetchConversations(); // surface the (possibly new) session in the sidebar
    } catch (e) {
      get().pushMessage(errorMessage(e));
      set({ activeStep: null });
    } finally {
      set({ processing: false });
    }
  },

  // --- follow-up buttons / feature cards ---
  handleAction: async (action) => {
    if (get().processing) return;

    // client-only pseudo-intents open editors
    if (action.intent === '_cast_edit') {
      const msg = [...get().messages].reverse().find((m) => m.castEditData);
      if (msg) get().openEdit({ type: 'cast', messageId: msg.id });
      return;
    }
    if (action.intent === '_briefing_edit') {
      const msg = [...get().messages].reverse().find((m) => m.briefingEditData);
      if (msg) get().openEdit({ type: 'briefing', messageId: msg.id });
      return;
    }

    // content_briefing button opens the file picker first, then auto-submits
    // once files are staged (client_new.py `_handle_button_click`).
    if (action.intent === 'content_briefing') {
      set({ pendingUploadText: action.value });
      externalFilePicker?.();
      return;
    }

    // streaming cast report (§5.3)
    if (action.intent === 'cast_report') {
      get().pushMessage({ id: newId(), role: 'user', content: action.value || action.title, timestamp: now() });
      await get().startCastStream();
      return;
    }

    // everything else → /api/message with the forced intent
    get().pushMessage({ id: newId(), role: 'user', content: action.value || action.title, timestamp: now() });
    set({ processing: true });
    const { conversationId, language } = get();
    try {
      const res = await apiSendMessage({
        message: action.value,
        conversationId,
        language,
        intent: action.intent,
      });
      get().pushMessage(
        assistantFromReply(res.reply, res.suggested_actions, res.cast_edit_data, res.briefing_edit_data),
      );
      if (isWorkflowStep(action.intent)) get().markStepDone(action.intent);
      void get().fetchConversations();
    } catch (e) {
      get().pushMessage(errorMessage(e));
      set({ activeStep: null });
    } finally {
      set({ processing: false });
    }
  },

  // --- §6: SSE cast report stream ---
  startCastStream: async () => {
    const { conversationId, language } = get();
    const msgId = get().pushMessage({
      id: newId(),
      role: 'assistant',
      content: '',
      timestamp: now(),
      kind: 'carousel',
      profiles: [],
      streaming: true,
      thinkingSteps: [{ label: 'Fetching wiki & social data', status: 'active' }],
    });

    set({ processing: true });
    streamAbort = new AbortController();
    const profiles: CastProfile[] = [];
    let total = 0;

    const rebuildSteps = (complete: boolean): ThinkingStep[] => {
      const steps: ThinkingStep[] = [
        { label: 'Fetching wiki & social data', status: 'done' },
        ...profiles.map((p) => ({ label: `Profiled ${p.name}`, status: 'done' as const })),
      ];
      if (!complete) {
        steps.push({ label: 'Profiling…', status: 'active' });
      }
      return steps;
    };

    const onChunk = (chunk: CastChunk) => {
      switch (chunk.type) {
        case 'status':
          get().updateMessage(msgId, {
            thinkingSteps: [{ label: chunk.message, status: 'active' }],
          });
          break;
        case 'profile': {
          total = chunk.total ?? total;
          const profile: CastProfile = {
            name: chunk.name,
            index: chunk.index,
            total: chunk.total,
            image: chunk.image,
            profileHtml: chunk.profile_html,
            ...(chunk.profile ?? {}),
          };
          profiles.push(profile);
          get().updateMessage(msgId, {
            profiles: [...profiles],
            thinkingSteps: rebuildSteps(false),
          });
          break;
        }
        case 'complete': {
          get().updateMessage(msgId, {
            streaming: false,
            thinkingSteps: rebuildSteps(true),
          });
          get().pushMessage({
            id: newId(),
            role: 'assistant',
            content: `**${chunk.report_name}**\n\n${chunk.overview_table}`,
            timestamp: now(),
            kind: 'markdown',
            suggestedActions: chunk.suggested_actions,
          });
          void get().fetchConversations();
          break;
        }
        case 'error':
          get().updateMessage(msgId, { streaming: false });
          get().pushMessage(errorMessage(chunk.message));
          break;
      }
    };

    try {
      await streamCastReport({ conversationId, language }, onChunk, streamAbort.signal);
    } catch (e) {
      get().updateMessage(msgId, { streaming: false });
      if ((e as Error).name !== 'AbortError') get().pushMessage(errorMessage(e));
    } finally {
      streamAbort = null;
      set({ processing: false });
    }
    void total;
  },

  // --- §5.3 step 2: confirm cast edits, then re-trigger the report ---
  confirmCastEdit: async (anchors) => {
    const { conversationId } = get();
    set({ editing: null, processing: true });
    try {
      await castEdit({ conversationId, identityAnchors: anchors });
    } catch (e) {
      get().pushMessage(errorMessage(e));
      set({ processing: false });
      return;
    }
    // cast_edit returns only a status — re-trigger the report stream (§10).
    set({ processing: false });
    await get().startCastStream();
  },

  // --- §5.4: save briefing edits ---
  confirmBriefingEdit: async (card) => {
    const { conversationId } = get();
    set({ editing: null, processing: true });
    try {
      const res = await briefingEdit({ conversationId, briefingCard: card });
      get().pushMessage(assistantFromReply(res.reply));
    } catch (e) {
      get().pushMessage(errorMessage(e));
    } finally {
      set({ processing: false });
    }
  },
}));

// ---- helpers ----
const WORKFLOW_STEP_IDS = new Set<string>(WORKFLOW_STEPS.map((s) => s.id));
function isWorkflowStep(intent: string): intent is WorkflowStep {
  return WORKFLOW_STEP_IDS.has(intent);
}

// ---- builders ----
function assistantFromReply(
  reply: string,
  actions?: Action[],
  castEditData?: Record<string, string>,
  briefingEditData?: Record<string, any>,
): Message {
  return {
    id: newId(),
    role: 'assistant',
    content: reply,
    timestamp: now(),
    kind: 'markdown',
    suggestedActions: actions,
    castEditData,
    briefingEditData,
  };
}

function errorMessage(e: unknown): Message {
  const text = e instanceof Error ? e.message : typeof e === 'string' ? e : 'Something went wrong.';
  return {
    id: newId(),
    role: 'assistant',
    content: `⚠️ ${text}`,
    timestamp: now(),
    kind: 'error',
  };
}
