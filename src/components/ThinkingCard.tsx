import type { ThinkingStep } from '../types';

interface Props {
  title: string;
  steps: ThinkingStep[];
  remaining?: number;
}

/** Drives both standard "thinking" and streaming progress (§7). */
export default function ThinkingCard({ title, steps, remaining }: Props) {
  return (
    <div className="thinking-box">
      <div className="thinking-title">
        <span className="spinner" />
        {title}
      </div>
      {steps.map((s, i) => (
        <div className="t-step" key={i}>
          {s.status === 'done' && (
            <span className="material-symbols-outlined step-icon-done" style={{ fontSize: 18 }}>
              check_circle
            </span>
          )}
          {s.status === 'active' && <span className="spinner" />}
          {s.status === 'pending' && (
            <span className="material-symbols-outlined step-icon-pending" style={{ fontSize: 18 }}>
              radio_button_unchecked
            </span>
          )}
          {s.label}
        </div>
      ))}
      {remaining != null && remaining > 0 && (
        <div className="gen-line">{remaining} profile{remaining === 1 ? '' : 's'} remaining</div>
      )}
    </div>
  );
}
