// ProSieben "7" logo — white SVG path on a slate rounded square (§2).
// Path from client.py:107 / 774.
export default function Logo() {
  return (
    <div className="logo" aria-label="ProSieben logo">
      <svg viewBox="0 0 100 100" role="img" aria-hidden="true">
        <path d="M12 8 L88 8 L88 32 L52 92 L28 92 L60 38 L12 38 Z" />
      </svg>
    </div>
  );
}
