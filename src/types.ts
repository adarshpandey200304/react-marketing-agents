// Domain types — modelled on frontend-migration.md §4.

export type Language = 'english' | 'german';

/** The 4 ordered stages of the guided marketing workflow (the stepper). */
export type WorkflowStep =
  | 'content_briefing'
  | 'cast_research'
  | 'consumer_insights'
  | 'creative_ideation';

export type Intent =
  | 'pdf_upload'
  | 'content_briefing'
  | 'regenerate_briefing'
  | 'consumer_insights'
  | 'creative_ideation'
  | 'cast_research'
  | 'cast_report'
  | 'qa'
  | 'greeting'
  // client-only pseudo-intents (never sent to the server)
  | '_cast_edit'
  | '_briefing_edit';

export interface Action {
  title: string;
  value: string;
  intent: Intent;
}

/** Briefing field value as returned by the server: { value, source }. */
export interface BriefingField {
  value: string;
  source?: string;
}

/** Structured cast profile (frontend-migration.md §7). All fields optional —
 *  the server may also send pre-rendered `profileHtml` instead. */
export interface CastProfile {
  name: string;
  index?: number;
  total?: number;
  image?: string; // Wikipedia thumbnail URL for the avatar (empty if none found)
  profileHtml?: string; // pre-rendered HTML fallback (sanitized before injecting)
  age?: string | number;
  profession?: string;
  knownFrom?: string;
  marketingRole?: string;
  basicIdentity?: string;
  previousWork?: string;
  socialMedia?: Record<string, { handle?: string; followers?: string; url?: string }>;
  contentStyle?: string;
  amplificationChannels?: string;
  publicNarrative?: string;
  promotionalLeverage?: string;
}

export type MessageKind = 'markdown' | 'carousel' | 'error';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string; // markdown (assistant) or plain text (user)
  timestamp: string; // "HH:MM"
  kind?: MessageKind;
  attachmentNames?: string[];
  suggestedActions?: Action[];
  castEditData?: Record<string, string>; // { name: anchorUrl }
  briefingEditData?: Record<string, BriefingField | string>;
  profiles?: CastProfile[]; // carousel messages
  streaming?: boolean; // carousel still receiving chunks
  thinkingSteps?: ThinkingStep[]; // live progress for streaming/processing
}

export interface ThinkingStep {
  label: string;
  status: 'done' | 'active' | 'pending';
}

export interface EditingState {
  type: 'cast' | 'briefing';
  messageId: string;
}

/** A past session shown in the sidebar (GET /api/conversations). */
export interface ConversationSummary {
  conversation_id: string;
  title: string;
  updated_at: string;
  created_at: string;
}

// ----- SSE chunk shapes (frontend-migration.md §3 / §6) -----
export type CastChunk =
  | { type: 'status'; message: string }
  | {
      type: 'profile';
      profile_html?: string;
      image?: string; // Wikipedia thumbnail URL
      name: string;
      index: number;
      total: number;
      // optional structured fields if the backend is upgraded (§7)
      profile?: Partial<CastProfile>;
    }
  | {
      type: 'complete';
      overview_table: string;
      report_name: string;
      suggested_actions?: Action[];
    }
  | { type: 'error'; message: string };
