import { useRef, useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { t } from '../i18n/strings';

interface Props {
  onPickFiles: () => void;
}

export default function Composer({ onPickFiles }: Props) {
  const draft = useChatStore((s) => s.draft);
  const setDraft = useChatStore((s) => s.setDraft);
  const stagedFiles = useChatStore((s) => s.stagedFiles);
  const removeFile = useChatStore((s) => s.removeFile);
  const processing = useChatStore((s) => s.processing);
  const submit = useChatStore((s) => s.submitComposer);
  const language = useChatStore((s) => s.language);

  const taRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  }, [draft]);

  const canSend = !processing && (draft.trim().length > 0 || stagedFiles.length > 0);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) void submit();
    }
  };

  return (
    <div className="composer-wrap">
      <div className="composer">
        {stagedFiles.length > 0 && (
          <div className="staged-chips">
            {stagedFiles.map((f, i) => (
              <span className="staged-chip" key={i}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  description
                </span>
                {f.name}
                <button onClick={() => removeFile(i)} aria-label={`Remove ${f.name}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    close
                  </span>
                </button>
              </span>
            ))}
          </div>
        )}

        <div className={`composer-bar ${processing ? 'disabled' : ''}`}>
          <button
            className="composer-icon-btn"
            onClick={onPickFiles}
            disabled={processing}
            aria-label="Attach document"
          >
            <span className="material-symbols-outlined">attach_file</span>
          </button>
          <textarea
            ref={taRef}
            className="composer-input"
            rows={1}
            value={draft}
            disabled={processing}
            placeholder={processing ? t('composerBusy', language) : t('composerPlaceholder', language)}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button className="send-btn" onClick={() => void submit()} disabled={!canSend} aria-label="Send">
            {processing ? (
              <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.4)' }} />
            ) : (
              <span className="material-symbols-outlined">arrow_upward</span>
            )}
          </button>
        </div>
        <p className="composer-footnote">{t('footnote', language)}</p>
      </div>
    </div>
  );
}
