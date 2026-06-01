import { useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { t } from '../i18n/strings';
import type { Language } from '../types';

function relativeTime(iso: string, lang: Language): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return '';
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return lang === 'german' ? 'gerade' : 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function Sidebar() {
  const conversations = useChatStore((s) => s.conversations);
  const conversationId = useChatStore((s) => s.conversationId);
  const language = useChatStore((s) => s.language);
  const processing = useChatStore((s) => s.processing);
  const sidebarOpen = useChatStore((s) => s.sidebarOpen);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const loadConversation = useChatStore((s) => s.loadConversation);
  const newConversation = useChatStore((s) => s.newConversation);
  const closeSidebar = useChatStore((s) => s.closeSidebar);

  // Refresh the list whenever the drawer opens (and once on mount).
  useEffect(() => {
    if (sidebarOpen) void fetchConversations();
  }, [sidebarOpen, fetchConversations]);

  const handleNew = () => {
    newConversation();
    closeSidebar();
  };
  const handleSelect = (id: string) => {
    void loadConversation(id);
    closeSidebar();
  };

  return (
    <>
      {sidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar} />}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`} aria-hidden={!sidebarOpen}>
        <div className="sidebar-header">
          <button
            className="new-chat-btn sidebar-new"
            onClick={handleNew}
            disabled={processing}
            title={t('newChat', language)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            {t('newChat', language)}
          </button>
          <button className="sidebar-close" onClick={closeSidebar} aria-label="Close" title="Close">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>
        <div className="sidebar-label">{t('previousSessions', language)}</div>
        <nav className="sidebar-list">
          {conversations.length === 0 ? (
            <p className="sidebar-empty">{t('noSessions', language)}</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.conversation_id}
                className={`sidebar-item${c.conversation_id === conversationId ? ' active' : ''}`}
                onClick={() => handleSelect(c.conversation_id)}
                disabled={processing}
                title={c.title}
              >
                <span className="sidebar-item-title">{c.title}</span>
                <span className="sidebar-item-time">{relativeTime(c.updated_at, language)}</span>
              </button>
            ))
          )}
        </nav>
      </aside>
    </>
  );
}
