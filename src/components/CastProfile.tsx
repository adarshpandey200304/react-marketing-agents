import DOMPurify from 'dompurify';
import type { CastProfile as Profile } from '../types';

/** Renders one cast member. Prefers structured fields (§7); falls back to the
 *  server's pre-rendered `profileHtml` (sanitized before injection, §3). */
export default function CastProfile({ profile }: { profile: Profile }) {
  const hasStructured = profile.age || profile.marketingRole || profile.publicNarrative || profile.socialMedia;

  return (
    <div className="cp">
      <div className="cp-head">
        <div className="cp-avatar">
          {profile.image ? (
            <img
              className="cp-avatar-img"
              src={profile.image}
              alt={profile.name}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Hide a broken image so the icon-less circle stays clean.
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>
              person
            </span>
          )}
        </div>
        <h3 className="cp-name">{profile.name}</h3>
        <div className="cp-meta">
          {profile.age != null && <span>Age: {profile.age}</span>}
          {profile.profession && <span>{profile.profession}</span>}
          {profile.knownFrom && <span>Known from: {profile.knownFrom}</span>}
        </div>
      </div>

      {hasStructured ? (
        <div className="cp-sections">
          {profile.marketingRole && (
            <div className="cp-section">
              <h4>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  campaign
                </span>
                Marketing Role
              </h4>
              <p>{profile.marketingRole}</p>
            </div>
          )}
          {profile.publicNarrative && (
            <div className="cp-section">
              <h4>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  record_voice_over
                </span>
                Public Narrative
              </h4>
              <p>{profile.publicNarrative}</p>
            </div>
          )}
          {profile.socialMedia && Object.keys(profile.socialMedia).length > 0 && (
            <div className="cp-section">
              <h4>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  share
                </span>
                Social Media
              </h4>
              <div className="cp-social">
                {Object.entries(profile.socialMedia).map(([platform, info]) => (
                  <span key={platform}>
                    {platform}: {info.handle ?? ''} {info.followers ? `· ${info.followers}` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
          {profile.contentStyle && (
            <div className="cp-section">
              <h4>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  palette
                </span>
                Content Style
              </h4>
              <p>{profile.contentStyle}</p>
            </div>
          )}
        </div>
      ) : profile.profileHtml ? (
        <div
          className="cp-html md"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(profile.profileHtml) }}
        />
      ) : null}
    </div>
  );
}
