import type { FeatureCopy } from '../i18n/strings';
import { t } from '../i18n/strings';
import { useChatStore } from '../store/useChatStore';

interface Props {
  feature: FeatureCopy;
  onClose: () => void;
  onStart: () => void;
}

export default function FeatureModal({ feature, onClose, onStart }: Props) {
  const language = useChatStore((s) => s.language);

  return (
    <div className="fm-overlay" onClick={onClose}>
      <div className="fm-box" onClick={(e) => e.stopPropagation()}>
        <button className="fm-close" onClick={onClose} aria-label="Close">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h3>{feature.title[language]}</h3>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>{feature.blurb[language]}</p>

        <div className="fm-section">
          <h4>{language === 'german' ? 'Was hochladen' : 'What to upload'}</h4>
          <p>{feature.upload[language]}</p>
        </div>
        <div className="fm-section">
          <h4>{language === 'german' ? 'Ergebnis' : 'Output'}</h4>
          <p>{feature.output[language]}</p>
        </div>
        <div className="fm-tip">{feature.tip[language]}</div>

        <div className="edit-actions">
          <button className="btn" onClick={onClose}>
            {t('cancel', language)}
          </button>
          <button className="btn btn-primary" onClick={onStart}>
            {language === 'german' ? 'Loslegen' : 'Start'}
          </button>
        </div>
      </div>
    </div>
  );
}
