import { useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { BRIEFING_FIELDS, t } from '../i18n/strings';
import type { BriefingField } from '../types';

function initialValue(raw: BriefingField | string | undefined): string {
  if (raw == null) return '';
  return typeof raw === 'string' ? raw : (raw.value ?? '');
}

/** 19 field/value rows; labels read-only, values editable (§5.4).
 *  Sends FLAT strings — the backend re-wraps each as { value, source }. */
export default function BriefingEditTable({
  data,
}: {
  data: Record<string, BriefingField | string>;
}) {
  const language = useChatStore((s) => s.language);
  const closeEdit = useChatStore((s) => s.closeEdit);
  const confirmBriefingEdit = useChatStore((s) => s.confirmBriefingEdit);
  const processing = useChatStore((s) => s.processing);

  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    for (const f of BRIEFING_FIELDS) v[f.key] = initialValue(data[f.key]);
    // include any extra keys present in the data but not in the schema
    for (const k of Object.keys(data)) if (!(k in v)) v[k] = initialValue(data[k]);
    return v;
  });

  const save = () => {
    const card: Record<string, string> = {};
    for (const [k, val] of Object.entries(values)) card[k] = val.trim();
    void confirmBriefingEdit(card);
  };

  return (
    <div className="edit-card">
      <div className="edit-head">
        <h3>{t('editBriefing', language)}</h3>
        <button className="edit-close" onClick={closeEdit} aria-label="Close">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <table className="edit-table">
        <thead>
          <tr>
            <th style={{ width: '30%' }}>{t('field', language)}</th>
            <th>{t('value', language)}</th>
          </tr>
        </thead>
        <tbody>
          {BRIEFING_FIELDS.map((f) => (
            <tr key={f.key}>
              <td className="field-label">{f.label[language]}</td>
              <td>
                <textarea
                  className="cell-input"
                  rows={1}
                  value={values[f.key] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="edit-actions">
        <button className="btn" onClick={closeEdit} disabled={processing}>
          {t('cancel', language)}
        </button>
        <button className="btn btn-primary" onClick={save} disabled={processing}>
          {t('save', language)}
        </button>
      </div>
    </div>
  );
}
