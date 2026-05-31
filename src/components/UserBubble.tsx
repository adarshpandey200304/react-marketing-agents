import type { Message } from '../types';

export default function UserBubble({ message }: { message: Message }) {
  return (
    <div className="msg-row user">
      <div className="bubble-user">
        {message.content}
        {message.attachmentNames && message.attachmentNames.length > 0 && (
          <div className="attachment-names">
            {message.attachmentNames.map((n, i) => (
              <span key={i}>📎 {n}</span>
            ))}
          </div>
        )}
      </div>
      <span className="msg-meta">{message.timestamp}</span>
    </div>
  );
}
