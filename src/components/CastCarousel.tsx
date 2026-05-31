import { useState } from 'react';
import type { CastProfile as Profile } from '../types';
import CastProfile from './CastProfile';

interface Props {
  profiles: Profile[];
  streaming?: boolean;
}

export default function CastCarousel({ profiles, streaming }: Props) {
  // The carousel does NOT auto-advance as profiles stream in — it stays on the
  // current card and the user navigates manually with the prev/next controls.
  const [index, setIndex] = useState(0);

  if (profiles.length === 0) return null;
  const safeIndex = Math.min(index, profiles.length - 1);
  const total = profiles[safeIndex]?.total ?? profiles.length;

  return (
    <div className="cc-wrap">
      <div className="cc-header">
        <strong style={{ fontSize: 14 }}>Cast Profiles</strong>
        <span className="cc-counter">
          {safeIndex + 1} / {streaming ? total : profiles.length}
        </span>
      </div>
      <div className="cc-body">
        <button
          className="cc-nav"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={safeIndex === 0}
          aria-label="Previous"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <div className="cc-card">
          <CastProfile profile={profiles[safeIndex]} />
        </div>
        <button
          className="cc-nav"
          onClick={() => setIndex((i) => Math.min(profiles.length - 1, i + 1))}
          disabled={safeIndex >= profiles.length - 1}
          aria-label="Next"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
