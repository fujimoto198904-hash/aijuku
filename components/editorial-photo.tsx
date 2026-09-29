import Image from 'next/image';
import {
  editorialPhotoPath,
  type EditorialPhoto,
} from '@/lib/editorial-photos';
import { withSiteBasePath } from '@/lib/site-paths';

export function EditorialPhotoImage({
  photo,
  compact = false,
  decorative = false,
}: {
  photo: EditorialPhoto;
  compact?: boolean;
  decorative?: boolean;
}) {
  const sizes = compact
    ? '(min-width:1050px) 280px, 33vw'
    : '(min-width:1050px) 580px, 100vw';
  return (
    <picture>
      {!compact && (
        <source
          type="image/webp"
          srcSet={`${withSiteBasePath(editorialPhotoPath(photo, true))} 480w, ${withSiteBasePath(editorialPhotoPath(photo))} 960w`}
          sizes={sizes}
        />
      )}
      <Image
        src={withSiteBasePath(editorialPhotoPath(photo, compact))}
        alt={decorative ? '' : `${photo.alt}。投稿内容を伝えるイメージ写真。`}
        fill
        sizes={sizes}
        loading="lazy"
        decoding="async"
        unoptimized
        style={{
          objectFit: 'cover',
          objectPosition:
            compact && photo.key === 'cafe-shokuba-3nin'
              ? '20% 50%'
              : photo.position,
        }}
      />
    </picture>
  );
}

export function EditorialPhotoView({ photo }: { photo: EditorialPhoto }) {
  return (
    <figure
      className="as-post-photo as-editorial-photo"
      data-editorial-photo={photo.key}
    >
      <EditorialPhotoImage photo={photo} />
      <figcaption className="as-editorial-photo-note">イメージ写真</figcaption>
    </figure>
  );
}
