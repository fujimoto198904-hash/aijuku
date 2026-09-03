import type { ReactNode } from 'react';

export function SectionIntro({
  index,
  label,
  title,
  body,
  light = false,
}: {
  index?: string;
  label: string;
  title: ReactNode;
  body?: ReactNode;
  light?: boolean;
}) {
  return (
    <div className="desktop-compact-section-intro grid gap-6 border-t border-current/20 pt-6 md:grid-cols-[180px_1fr] md:gap-10">
      <p
        className={`text-xs font-semibold tracking-[0.16em] ${light ? 'text-future-mint' : 'text-sapphire'}`}
      >
        {index ? `${index} / ` : ''}
        {label}
      </p>
      <div>
        <h2 className="soft-section-heading font-mincho text-[clamp(2rem,4.6vw,4.1rem)] font-medium leading-[1.22] tracking-[-0.035em]">
          {title}
        </h2>
        {body ? (
          <div
            className={`mt-6 max-w-3xl text-base leading-8 sm:text-lg sm:leading-9 ${light ? 'text-white/70' : 'text-quiet'}`}
          >
            {body}
          </div>
        ) : null}
      </div>
    </div>
  );
}
