import { useMsal } from '@azure/msal-react';
import { useChatStore } from '../store/useChatStore';
import { t } from '../i18n/strings';
import Logo from './Logo';
import LanguageToggle from './LanguageToggle';

export default function Header() {
  const isConnected = useChatStore((s) => s.isConnected);
  const language = useChatStore((s) => s.language);
  const toggleSidebar = useChatStore((s) => s.toggleSidebar);

  const { instance, accounts } = useMsal();
  const userName = accounts[0]?.name ?? accounts[0]?.username ?? '';
  const signOut = () => instance.logoutRedirect({ postLogoutRedirectUri: window.location.origin });

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="header-menu-btn"
          onClick={toggleSidebar}
          aria-label={t('previousSessions', language)}
          title={t('previousSessions', language)}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <Logo />
        <div className="header-titles">
          <h1 className="header-title">Marketing Agents</h1>
          <p className="header-subtitle">Content Briefing · Consumer Insights · Story Hooks</p>
        </div>
      </div>
      <div className="header-right">
        <div className="status">
          <span className={`status-dot ${isConnected ? 'ok' : 'err'}`} />
          {t(isConnected ? 'connected' : 'disconnected', language)}
        </div>
        <LanguageToggle />
        <div className="user-info">
          {userName && <span className="user-name" title={userName}>{userName}</span>}
          <button
            className="signout-btn"
            onClick={signOut}
            title={t('signOut', language)}
            aria-label={t('signOut', language)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
