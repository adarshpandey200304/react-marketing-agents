import { useChatStore } from '../store/useChatStore';
import { t } from '../i18n/strings';
import Logo from './Logo';
import LanguageToggle from './LanguageToggle';

export default function Header() {
  const isConnected = useChatStore((s) => s.isConnected);
  const language = useChatStore((s) => s.language);
  const newConversation = useChatStore((s) => s.newConversation);
  const processing = useChatStore((s) => s.processing);

  return (
    <header className="header">
      <div className="header-left">
        <Logo />
        <div className="header-titles">
          <h1 className="header-title">Marketing Agents</h1>
          <p className="header-subtitle">Content Briefing · Consumer Insights · Story Hooks</p>
        </div>
      </div>
      <div className="header-right">
        <button
          className="new-chat-btn"
          onClick={newConversation}
          disabled={processing}
          title={t('newChat', language)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            add
          </span>
          {t('newChat', language)}
        </button>
        <div className="status">
          <span className={`status-dot ${isConnected ? 'ok' : 'err'}`} />
          {t(isConnected ? 'connected' : 'disconnected', language)}
        </div>
        <LanguageToggle />
      </div>
    </header>
  );
}
