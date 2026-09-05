import Image from 'next/image';

import { withSiteBasePath } from '@/lib/site-paths';

type BrandMarkProps = {
  className?: string;
  framed?: boolean;
};

export function BrandMark({
  className = 'size-10',
  framed = false,
}: BrandMarkProps) {
  return (
    <span
      className={`${className} shrink-0 ${framed ? 'soft-icon grid place-items-center bg-paper-white p-1.5' : 'inline-block'}`}
      aria-hidden="true"
    >
      <Image
        className="size-full"
        src={withSiteBasePath('/brand/aistock-mark.svg')}
        alt=""
        width={64}
        height={64}
      />
    </span>
  );
}
