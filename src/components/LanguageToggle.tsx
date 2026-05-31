import { useChatStore } from '../store/useChatStore';

export default function LanguageToggle() {
  const language = useChatStore((s) => s.language);
  const setLanguage = useChatStore((s) => s.setLanguage);

  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      <button
        className={language === 'english' ? 'active' : ''}
        onClick={() => setLanguage('english')}
        aria-pressed={language === 'english'}
      >
        EN
      </button>
      <button
        className={language === 'german' ? 'active' : ''}
        onClick={() => setLanguage('german')}
        aria-pressed={language === 'german'}
      >
        DE
      </button>
    </div>
  );
}
