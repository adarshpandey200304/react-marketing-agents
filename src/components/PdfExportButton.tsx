import { useChatStore } from '../store/useChatStore';
import { t } from '../i18n/strings';

interface Props {
  targetRef: React.RefObject<HTMLElement>;
  filename: string;
}

/** Per-message PDF export (§7). Keeps html2pdf.js as in the Streamlit app. */
export default function PdfExportButton({ targetRef, filename }: Props) {
  const language = useChatStore((s) => s.language);

  const exportPdf = async () => {
    if (!targetRef.current) return;
    const { default: html2pdf } = await import('html2pdf.js');
    html2pdf()
      .set({
        margin: 10,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(targetRef.current)
      .save();
  };

  return (
    <button className="pdf-btn" onClick={exportPdf}>
      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
        picture_as_pdf
      </span>
      {t('exportPdf', language)}
    </button>
  );
}
