import type { Action } from '../types';
import { useChatStore } from '../store/useChatStore';
import { t } from '../i18n/strings';

export default function FollowUpButtons({ actions }: { actions: Action[] }) {
  const handleAction = useChatStore((s) => s.handleAction);
  const processing = useChatStore((s) => s.processing);
  const editing = useChatStore((s) => s.editing);
  const language = useChatStore((s) => s.language);

  // Hidden while an edit table is open or while processing (§7).
  if (!actions.length || processing || editing) return null;

  return (
    <div className="followups">
      <div className="followup-header">{t('suggestions', language)}</div>
      <div className="chip-grid">
        {actions.map((a, i) => (
          <button key={i} className="chip" onClick={() => handleAction(a)}>
            {a.title}
          </button>
        ))}
      </div>
    </div>
  );
}
