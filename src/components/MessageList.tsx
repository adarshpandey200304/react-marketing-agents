import { useEffect, useRef } from 'react';
import { useChatStore } from '../store/useChatStore';
import type { Message } from '../types';
import UserBubble from './UserBubble';
import BotMessage from './BotMessage';
import FollowUpButtons from './FollowUpButtons';
import ThinkingCard from './ThinkingCard';
import CastCarousel from './CastCarousel';
import CastEditTable from './CastEditTable';
import BriefingEditTable from './BriefingEditTable';
import CreativeImageGallery from './CreativeImageGallery';

export default function MessageList() {
  const messages = useChatStore((s) => s.messages);
  const processing = useChatStore((s) => s.processing);
  const editing = useChatStore((s) => s.editing);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Auto-scroll to newest content only when a NEW message is added or the
  // generic thinking indicator toggles — NOT when an existing message mutates.
  // Otherwise streaming cast profiles (which grow the same carousel message in
  // place) would re-fire scrollIntoView on every profile, jerking the page.
  useEffect(() => {
    if (messages.length !== prevCountRef.current) {
      prevCountRef.current = messages.length;
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, processing]);

  const lastMsg = messages[messages.length - 1];
  const showGenericThinking =
    processing && (!lastMsg || lastMsg.role === 'user' || lastMsg.kind !== 'carousel');

  return (
    <div className="chat-container">
      {messages.map((m) => (
        <MessageItem key={m.id} message={m} editingId={editing?.messageId} />
      ))}

      {showGenericThinking && (
        <ThinkingCard
          title="Thinking…"
          steps={[{ label: 'Working on your request', status: 'active' }]}
        />
      )}

      <div ref={bottomRef} />
    </div>
  );
}

function MessageItem({ message, editingId }: { message: Message; editingId?: string }) {
  const editing = useChatStore((s) => s.editing);

  if (message.role === 'user') return <UserBubble message={message} />;

  // Streaming / carousel message
  if (message.kind === 'carousel') {
    const total = message.profiles?.[0]?.total ?? message.profiles?.length ?? 0;
    const remaining = message.streaming ? Math.max(0, total - (message.profiles?.length ?? 0)) : 0;
    return (
      <>
        {message.thinkingSteps && message.thinkingSteps.length > 0 && (
          <ThinkingCard
            title={message.streaming ? 'Generating cast report…' : 'Cast report ready'}
            steps={message.thinkingSteps}
            remaining={remaining}
          />
        )}
        {message.profiles && message.profiles.length > 0 && (
          <CastCarousel profiles={message.profiles} streaming={message.streaming} />
        )}
      </>
    );
  }

  // Standard markdown / error message
  const isEditingThis = editing && editingId === message.id;
  return (
    <>
      <BotMessage message={message} />
      {message.creativeImages && message.creativeImages.length > 0 && (
        <CreativeImageGallery images={message.creativeImages} />
      )}
      {message.suggestedActions && <FollowUpButtons actions={message.suggestedActions} />}
      {isEditingThis && editing.type === 'cast' && message.castEditData && (
        <CastEditTable data={message.castEditData} />
      )}
      {isEditingThis && editing.type === 'briefing' && message.briefingEditData && (
        <BriefingEditTable data={message.briefingEditData} />
      )}
    </>
  );
}
