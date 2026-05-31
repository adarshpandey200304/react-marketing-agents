import { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '../types';
import PdfExportButton from './PdfExportButton';

export default function BotMessage({ message }: { message: Message }) {
  const ref = useRef<HTMLDivElement>(null);
  const isError = message.kind === 'error' || message.content.trimStart().startsWith('⚠️');
  const hasTable = message.content.includes('|') && message.content.includes('---');

  return (
    <div className="msg-row assistant">
      <div ref={ref} className={`bubble-bot md ${hasTable ? 'has-table' : ''} ${isError ? 'error' : ''}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="msg-meta">{message.timestamp}</span>
        {!isError && message.content.length > 80 && (
          <PdfExportButton targetRef={ref} filename={`marketing-agents-${message.timestamp.replace(':', '')}.pdf`} />
        )}
      </div>
    </div>
  );
}
