import { useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { t } from '../i18n/strings';

interface Row {
  name: string;
  anchor: string;
}

/** Editable name/anchor rows (§5.3). Editable anytime, not just the last message. */
export default function CastEditTable({ data }: { data: Record<string, string> }) {
  const language = useChatStore((s) => s.language);
  const closeEdit = useChatStore((s) => s.closeEdit);
  const confirmCastEdit = useChatStore((s) => s.confirmCastEdit);
  const processing = useChatStore((s) => s.processing);

  const [rows, setRows] = useState<Row[]>(
    Object.entries(data).map(([name, anchor]) => ({ name, anchor })),
  );

  const update = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));
  const add = () => setRows((rs) => [...rs, { name: '', anchor: '' }]);

  const confirm = () => {
    const anchors: Record<string, string> = {};
    for (const r of rows) {
      const name = r.name.trim();
      if (name) anchors[name] = r.anchor.trim();
    }
    void confirmCastEdit(anchors);
  };

  return (
    <div className="edit-card">
      <div className="edit-head">
        <h3>{t('editCastList', language)}</h3>
        <button className="edit-close" onClick={closeEdit} aria-label="Close">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <table className="edit-table">
        <thead>
          <tr>
            <th style={{ width: '35%' }}>{t('name', language)}</th>
            <th>{t('anchorUrl', language)}</th>
            <th style={{ width: 40 }} />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>
                <input
                  className="cell-input"
                  value={r.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  placeholder={t('name', language)}
                />
              </td>
              <td>
                <input
                  className="cell-input"
                  value={r.anchor}
                  onChange={(e) => update(i, { anchor: e.target.value })}
                  placeholder="https://…"
                />
              </td>
              <td>
                <button className="row-remove" onClick={() => remove(i)} aria-label="Remove">
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    close
                  </span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="add-row" onClick={add}>
        {t('addCastMember', language)}
      </button>
      <div className="edit-actions">
        <button className="btn" onClick={closeEdit} disabled={processing}>
          {t('cancel', language)}
        </button>
        <button className="btn btn-primary" onClick={confirm} disabled={processing || rows.length === 0}>
          {t('confirmGenerate', language)}
        </button>
      </div>
    </div>
  );
}
