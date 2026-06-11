import type { CreativeImage } from '../types';

/** Renders the campaign key-art generated per creative direction. Images are PNG
 *  data URIs from the backend (gpt-image-1); a null image means that direction's
 *  generation failed, shown as a small placeholder rather than dropped silently. */
export default function CreativeImageGallery({ images }: { images: CreativeImage[] }) {
  if (!images || images.length === 0) return null;

  return (
    <div className="creative-gallery">
      <div className="creative-gallery-head">Campaign Visuals</div>
      <div className="creative-gallery-grid">
        {images.map((img, i) => (
          <figure className="creative-card" key={`${img.title}-${i}`}>
            {img.image ? (
              <a href={img.image} download={`${img.title.replace(/\s+/g, '-')}.png`} title="Open / download">
                <img src={img.image} alt={img.title} loading="lazy" />
              </a>
            ) : (
              <div className="creative-card-failed">Image unavailable</div>
            )}
            <figcaption>{img.title}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
