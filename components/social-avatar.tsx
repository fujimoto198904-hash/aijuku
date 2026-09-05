import Image from 'next/image';
import madoka from '@/sozai/office-smile-woman.jpg';
import sota from '@/sozai/headset-pc-man.jpg';
import aya from '@/sozai/suit-woman-machi.jpg';
import ken from '@/sozai/suit-denwa.jpg';
import riko from '@/sozai/eigyo-tablet-machi.jpg';
import miho from '@/sozai/jimu-akarui.jpg';
import yu from '@/sozai/office-pc.jpg';
import daichi from '@/sozai/melon-house.jpg';
import takumi from '@/sozai/kinniku-pose-office.jpg';
import haruka from '@/sozai/cafe-shokuba-3nin.jpg';
const photos = {
  'office-smile-woman': madoka,
  'headset-pc-man': sota,
  'suit-woman-machi': aya,
  'suit-denwa': ken,
  'eigyo-tablet-machi': riko,
  'jimu-akarui': miho,
  'office-pc': yu,
  'melon-house': daichi,
  'kinniku-pose-office': takumi,
  'cafe-shokuba-3nin': haruka,
};
export function SocialAvatar({
  name,
  kind,
  avatar,
  large = false,
}: {
  name: string;
  kind?: string | null;
  avatar?: string | null;
  large?: boolean;
}) {
  const photo =
    avatar && avatar in photos ? photos[avatar as keyof typeof photos] : null;
  return (
    <span
      className={
        'as-social-avatar' +
        (large ? ' is-large' : '') +
        (kind === 'official' ? ' is-official' : '')
      }
      aria-hidden="true"
    >
      {kind === 'official' ? (
        <span className="as-official-monogram">
          Ai<span>✦</span>
        </span>
      ) : photo ? (
        <Image
          src={photo}
          alt=""
          width={160}
          height={160}
          sizes={large ? '144px' : '48px'}
          style={{
            objectPosition:
              avatar === 'kinniku-pose-office' || avatar === 'cafe-shokuba-3nin'
                ? '22% 25%'
                : '50% 25%',
          }}
        />
      ) : (
        <span>
          {new Intl.Segmenter('ja', { granularity: 'grapheme' })
            .segment(name)
            [Symbol.iterator]()
            .next().value?.segment || 'A'}
        </span>
      )}
    </span>
  );
}
export function AccountBadge({ kind }: { kind?: string | null }) {
  return kind === 'official' ? (
    <span className="as-account-badge">公式</span>
  ) : kind === 'official_ai' ? (
    <span className="as-account-badge is-ai">公式AI · 架空</span>
  ) : null;
}
