import { useMsal } from '@azure/msal-react';
import { useChatStore } from '../store/useChatStore';
import { t } from '../i18n/strings';
import { LOGIN_SCOPES } from '../auth/msalConfig';
import Logo from './Logo';

// Shown by <UnauthenticatedTemplate> in main.tsx — the sign-in gate.
export default function LoginPage() {
  const { instance } = useMsal();
  const language = useChatStore((s) => s.language);

  return (
    <div className="login-page">
      <div className="login-card">
        <Logo />
        <h1 className="login-title">Marketing Agents</h1>
        <p className="login-sub">{t('signInPrompt', language)}</p>
        <button
          className="btn btn-primary login-btn"
          onClick={() => instance.loginRedirect({ scopes: LOGIN_SCOPES })}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>login</span>
          {t('signInButton', language)}
        </button>
      </div>
    </div>
  );
}
