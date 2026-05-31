import { useChatStore } from '../store/useChatStore';
import { t } from '../i18n/strings';

export default function DropOverlay() {
  const language = useChatStore((s) => s.language);
  return (
    <div className="drop-overlay">
      <div className="drop-inner">
        <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>
          upload_file
        </span>
        {t('dropHere', language)}
      </div>
    </div>
  );
}
