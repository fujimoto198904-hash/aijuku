import { ExternalLink, Video } from 'lucide-react';

import type { MemberApplicationCalendarDetails } from '@/lib/member-calendar-details';

export function MemberMeetLink({
  details,
}: {
  details: MemberApplicationCalendarDetails | null;
}) {
  if (!details) return null;

  if (details.syncStatus === 'active' && details.meetUrl) {
    return (
      <div className="soft-control mt-4 border border-sapphire/35 bg-sapphire-soft p-4">
        <p className="flex items-center gap-2 font-semibold text-sapphire">
          <Video className="size-4" aria-hidden="true" />
          オンライン授業の参加リンク
        </p>
        <a
          className="soft-button mt-3 inline-flex min-h-11 items-center gap-2 bg-sapphire px-4 text-xs font-semibold text-white"
          href={details.meetUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Google Meetを開く
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
        <p className="mt-2 text-[11px] leading-5 text-quiet">
          開始時間になったら、このボタンから参加できます。
        </p>
      </div>
    );
  }

  return (
    <output className="soft-control mt-4 block border border-human-coral/35 bg-human-coral-soft p-4 text-xs leading-6">
      Google Meetの参加リンクを確認中です。準備が整うまでお待ちください。
    </output>
  );
}
