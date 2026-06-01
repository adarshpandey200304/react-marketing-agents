import type { Intent, Language, WorkflowStep } from '../types';

// Bilingual UI copy (port of the Streamlit `_T` dict, frontend-migration.md §7).
type Dict = Record<string, { english: string; german: string }>;

const T: Dict = {
  connected: { english: 'Connected', german: 'Verbunden' },
  disconnected: { english: 'Disconnected', german: 'Getrennt' },
  heroTitle: {
    english: 'How can I help with your campaign today?',
    german: 'Wie kann ich heute bei deiner Kampagne helfen?',
  },
  heroSub: {
    english: 'Start a new briefing or explore insights below.',
    german: 'Starte ein neues Briefing oder entdecke Insights.',
  },
  composerPlaceholder: {
    english: 'Ask anything, or attach a document…',
    german: 'Frag etwas oder hänge ein Dokument an…',
  },
  composerBusy: {
    english: 'Generating report… please wait',
    german: 'Bericht wird erstellt… bitte warten',
  },
  footnote: {
    english: 'Marketing Agents can make mistakes. Consider verifying important information.',
    german: 'Marketing Agents kann Fehler machen. Bitte wichtige Informationen prüfen.',
  },
  suggestions: { english: 'Suggestions', german: 'Vorschläge' },
  dropHere: { english: 'Drop your file here', german: 'Datei hier ablegen' },
  cancel: { english: 'Cancel', german: 'Abbrechen' },
  save: { english: 'Save', german: 'Speichern' },
  confirmGenerate: { english: 'Confirm & Generate', german: 'Bestätigen & Erstellen' },
  editCastList: { english: 'Edit Cast List', german: 'Cast-Liste bearbeiten' },
  editBriefing: { english: 'Edit Briefing Card', german: 'Briefing bearbeiten' },
  addCastMember: { english: '+ Add cast member', german: '+ Person hinzufügen' },
  name: { english: 'Name', german: 'Name' },
  anchorUrl: { english: 'Identity Anchor (URL)', german: 'Identitätsanker (URL)' },
  field: { english: 'Field', german: 'Feld' },
  value: { english: 'Value', german: 'Wert' },
  exportPdf: { english: 'Export PDF', german: 'PDF exportieren' },
  newChat: { english: 'New Chat', german: 'Neuer Chat' },

  // Auth + sidebar
  signInPrompt: {
    english: 'Sign in with your organization account to continue.',
    german: 'Melde dich mit deinem Firmenkonto an, um fortzufahren.',
  },
  signInButton: { english: 'Sign in with Microsoft', german: 'Mit Microsoft anmelden' },
  signOut: { english: 'Sign out', german: 'Abmelden' },
  previousSessions: { english: 'Previous sessions', german: 'Frühere Sitzungen' },
  noSessions: { english: 'No previous sessions', german: 'Keine früheren Sitzungen' },

  // Guided workflow stepper
  workflowTitle: { english: 'Your campaign workflow', german: 'Dein Kampagnen-Workflow' },
  workflowSub: {
    english: 'Follow the steps in order — each one builds on the last.',
    german: 'Folge den Schritten der Reihe nach — jeder baut auf dem vorigen auf.',
  },
  stepDone: { english: 'Done', german: 'Erledigt' },
  stepStart: { english: 'Start', german: 'Starten' },
  stepNext: { english: 'Next up', german: 'Als Nächstes' },
  stepLocked: { english: 'Finish the previous step first', german: 'Zuerst den vorigen Schritt abschließen' },
  stepRedo: { english: 'Redo', german: 'Erneut' },
  workflowComplete: {
    english: 'All steps complete — nice work! 🎉',
    german: 'Alle Schritte abgeschlossen — super! 🎉',
  },
};

export function t(key: keyof typeof T, lang: Language): string {
  return T[key]?.[lang] ?? T[key]?.english ?? String(key);
}

// Welcome feature cards (the 3 cards + their modal copy).
export interface FeatureCopy {
  id: 'content_briefing' | 'consumer_insights' | 'qa' | 'cast_research' | 'creative_ideation';
  icon: string; // material symbol name
  title: { english: string; german: string };
  blurb: { english: string; german: string };
  upload: { english: string; german: string };
  output: { english: string; german: string };
  tip: { english: string; german: string };
  trigger: string; // phrase sent to /api/message when the card is used
}

export const FEATURES: FeatureCopy[] = [
  {
    id: 'content_briefing',
    icon: 'description',
    title: { english: 'Content Briefing', german: 'Content Briefing' },
    blurb: {
      english: 'Generate a structured content briefing from uploaded documents.',
      german: 'Erstelle ein strukturiertes Content Briefing aus hochgeladenen Dokumenten.',
    },
    upload: {
      english: 'Upload a campaign brief, press kit or format deck (PDF, DOCX, PPTX).',
      german: 'Lade ein Kampagnen-Brief, Presseheft oder Format-Deck hoch (PDF, DOCX, PPTX).',
    },
    output: {
      english: 'A structured briefing card you can review and edit field by field.',
      german: 'Eine strukturierte Briefing-Karte, die du Feld für Feld bearbeiten kannst.',
    },
    tip: {
      english: 'Tip: attach the document first, then add any extra instructions.',
      german: 'Tipp: Hänge zuerst das Dokument an und ergänze dann Anweisungen.',
    },
    trigger: 'Generate a content briefing card',
  },
  {
    id: 'consumer_insights',
    icon: 'analytics',
    title: { english: 'Consumer Insights', german: 'Consumer Insights' },
    blurb: { english: 'Audience and trend analysis.', german: 'Zielgruppen- und Trendanalyse.' },
    upload: {
      english: 'No upload needed — just describe the audience or topic.',
      german: 'Kein Upload nötig — beschreibe einfach Zielgruppe oder Thema.',
    },
    output: {
      english: 'Audience segments, trends and talking points.',
      german: 'Zielgruppen-Segmente, Trends und Talking Points.',
    },
    tip: {
      english: 'Tip: name the show or format for sharper insights.',
      german: 'Tipp: Nenne Show oder Format für präzisere Insights.',
    },
    trigger: 'Give me consumer insights',
  },
  {
    id: 'cast_research',
    icon: 'person_search',
    title: { english: 'Cast Research', german: 'Cast-Recherche' },
    blurb: {
      english: "Research a show's cast and build marketing-ready talent profiles.",
      german: 'Recherchiere die Besetzung einer Show und erstelle marketingfähige Talent-Profile.',
    },
    upload: {
      english: 'No upload needed — name the show or paste the cast list.',
      german: 'Kein Upload nötig — nenne die Show oder füge die Besetzungsliste ein.',
    },
    output: {
      english:
        'A reviewable, editable cast list, then a streamed profile per member: bio, social media, marketing role and public narrative.',
      german:
        'Eine prüfbare, bearbeitbare Besetzungsliste, dann ein gestreamtes Profil pro Person: Bio, Social Media, Marketing-Rolle und öffentliches Narrativ.',
    },
    tip: {
      english: 'Tip: edit or trim the cast list before generating the full streamed report.',
      german: 'Tipp: Bearbeite oder kürze die Besetzungsliste, bevor du den vollständigen Bericht erstellst.',
    },
    trigger: 'Research the cast for a show',
  },
  {
    id: 'creative_ideation',
    icon: 'auto_awesome',
    title: { english: 'Creative Ideation', german: 'Kreative Ideenfindung' },
    blurb: {
      english: 'Generate creative campaign concepts, angles and content ideas.',
      german: 'Erstelle kreative Kampagnenkonzepte, Ansätze und Content-Ideen.',
    },
    upload: {
      english: 'No upload needed — describe the show, goal or audience.',
      german: 'Kein Upload nötig — beschreibe Show, Ziel oder Zielgruppe.',
    },
    output: {
      english: 'A set of creative directions, campaign hooks and format ideas you can build on.',
      german: 'Eine Reihe kreativer Richtungen, Kampagnen-Hooks und Format-Ideen zum Weiterentwickeln.',
    },
    tip: {
      english: 'Tip: combine it with a content briefing for sharper, on-brief ideas.',
      german: 'Tipp: Kombiniere es mit einem Content Briefing für treffsicherere Ideen.',
    },
    trigger: 'Give me creative campaign ideas',
  },
  {
    id: 'qa',
    icon: 'lightbulb',
    title: { english: 'Q&A / Story Hooks', german: 'Q&A / Story Hooks' },
    blurb: {
      english: 'Ask questions and get creative story hooks.',
      german: 'Stelle Fragen und erhalte kreative Story Hooks.',
    },
    upload: {
      english: 'No upload needed — just ask.',
      german: 'Kein Upload nötig — frag einfach.',
    },
    output: {
      english: 'Direct answers and a set of story hook ideas.',
      german: 'Direkte Antworten und eine Reihe von Story-Hook-Ideen.',
    },
    tip: {
      english: 'Tip: ask for hooks in a specific tone or channel.',
      german: 'Tipp: Frag nach Hooks in einem bestimmten Ton oder Kanal.',
    },
    trigger: 'Suggest some story hooks',
  },
];

// 19-field briefing schema with EN/DE labels (frontend-migration.md §5.4).
export interface BriefingFieldDef {
  key: string;
  label: { english: string; german: string };
}

// Exact schema/order from client_new.py `_schema` (briefing editor block).
// Keys MUST match what /api/briefing_edit expects; labels are EN/DE.
export const BRIEFING_FIELDS: BriefingFieldDef[] = [
  { key: 'title', label: { english: 'Title', german: 'Titel' } },
  { key: 'sub_genre', label: { english: 'Sub-Genre', german: 'Sub-Genre' } },
  { key: 'mini_synopsis', label: { english: 'Mini Synopsis / Logline', german: 'Mini-Synopsis / Logline' } },
  { key: 'theme', label: { english: 'Theme', german: 'Thema' } },
  { key: 'motives', label: { english: 'Motives', german: 'Motive' } },
  { key: 'mood', label: { english: 'Mood', german: 'Stimmung' } },
  { key: 'episode_scope', label: { english: 'Episode Scope', german: 'Episodenumfang' } },
  { key: 'platform', label: { english: 'Platform / Environment', german: 'Plattform / Umfeld' } },
  { key: 'core_mechanics', label: { english: 'Core Mechanics', german: 'Kernmechaniken' } },
  { key: 'unique_elements', label: { english: 'Unique Elements', german: 'Besondere Elemente' } },
  { key: 'setting', label: { english: 'Setting', german: 'Setting' } },
  { key: 'celebrities', label: { english: 'Cast Members', german: 'Besetzung' } },
  { key: 'known_talent', label: { english: 'Hosts', german: 'Moderator:in' } },
  { key: 'production_company', label: { english: 'Production Company', german: 'Produktionsfirma' } },
  { key: 'broadcast_rhythm', label: { english: 'Broadcast Rhythm', german: 'Ausstrahlungsrhythmus' } },
  { key: 'moderation', label: { english: 'Moderation', german: 'Moderation' } },
  { key: 'notable_history', label: { english: 'Notable History', german: 'Bemerkenswerte Historie' } },
  { key: 'context_note', label: { english: 'Context Note', german: 'Kontext-Hinweis' } },
];

// ----- Guided workflow stepper -----
// The 4 ordered stages the stepper walks the user through. `trigger`/`intent`
// mirror the matching FEATURES entry so a step dispatches the same action.
export interface WorkflowStepDef {
  id: WorkflowStep;
  intent: Intent;
  icon: string; // material symbol
  label: { english: string; german: string };
  hint: { english: string; german: string };
  trigger: string;
}

export const WORKFLOW_STEPS: WorkflowStepDef[] = [
  {
    id: 'content_briefing',
    intent: 'content_briefing',
    icon: 'description',
    label: { english: 'Content Briefing', german: 'Content Briefing' },
    hint: {
      english: 'Upload a brief to build the briefing card.',
      german: 'Lade ein Brief hoch, um die Briefing-Karte zu erstellen.',
    },
    trigger: 'Generate a content briefing card',
  },
  {
    id: 'cast_research',
    intent: 'cast_research',
    icon: 'person_search',
    label: { english: 'Cast Research', german: 'Cast-Recherche' },
    hint: {
      english: 'Research the show’s cast and build talent profiles.',
      german: 'Recherchiere die Besetzung und erstelle Talent-Profile.',
    },
    trigger: 'Research the cast for a show',
  },
  {
    id: 'consumer_insights',
    intent: 'consumer_insights',
    icon: 'analytics',
    label: { english: 'Consumer Insights', german: 'Consumer Insights' },
    hint: {
      english: 'Surface audience segments and trends.',
      german: 'Finde Zielgruppen-Segmente und Trends.',
    },
    trigger: 'Give me consumer insights',
  },
  {
    id: 'creative_ideation',
    intent: 'creative_ideation',
    icon: 'auto_awesome',
    label: { english: 'Creative Ideation', german: 'Kreative Ideenfindung' },
    hint: {
      english: 'Turn it all into campaign concepts and hooks.',
      german: 'Mach daraus Kampagnenkonzepte und Hooks.',
    },
    trigger: 'Give me creative campaign ideas',
  },
];
