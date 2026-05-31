import { useState } from 'react';
import { FEATURES, t } from '../i18n/strings';
import type { FeatureCopy } from '../i18n/strings';
import type { Intent } from '../types';
import { useChatStore } from '../store/useChatStore';
import FeatureModal from './FeatureModal';

const INTENT_MAP: Record<FeatureCopy['id'], Intent> = {
  content_briefing: 'content_briefing',
  consumer_insights: 'consumer_insights',
  qa: 'qa',
  cast_research: 'cast_research',
  creative_ideation: 'creative_ideation',
};

interface Props {
  /** Opens the file picker (used by the Content Briefing card, §5.2). */
  onPickFiles: () => void;
}

export default function WelcomeHero({ onPickFiles }: Props) {
  const language = useChatStore((s) => s.language);
  const handleAction = useChatStore((s) => s.handleAction);
  const [active, setActive] = useState<FeatureCopy | null>(null);

  const start = (feature: FeatureCopy) => {
    setActive(null);
    if (feature.id === 'content_briefing') {
      // Content briefing wants a document first — open the picker (§5.2).
      onPickFiles();
      return;
    }
    void handleAction({
      title: feature.title[language],
      value: feature.trigger,
      intent: INTENT_MAP[feature.id],
    });
  };

  return (
    <div className="hero">
      <h2>{t('heroTitle', language)}</h2>
      <p className="sub">{t('heroSub', language)}</p>
      <div className="feature-grid">
        {FEATURES.map((f) => (
          <button key={f.id} className="feature-card" onClick={() => setActive(f)}>
            <span className="feature-icon material-symbols-outlined icon-filled">{f.icon}</span>
            <h3>{f.title[language]}</h3>
            <p>{f.blurb[language]}</p>
          </button>
        ))}
      </div>

      {active && <FeatureModal feature={active} onClose={() => setActive(null)} onStart={() => start(active)} />}
    </div>
  );
}
