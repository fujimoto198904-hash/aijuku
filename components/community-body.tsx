import { Fragment } from 'react';
import { communityHttpUrl } from '@/lib/community-composer';

/** 外部の内容は取得しない。本文中のHTTP(S)リンクだけをクリック可能にする。 */
export function CommunityBody({ body }: { body: string }) {
  return body
    .split(/(https?:\/\/[^\s<>「」『』。、，（）()！？]+)/g)
    .map((part, index) => {
      const candidate = part.replace(/[.,!?;:]+$/, '');
      const suffix = part.slice(candidate.length);
      const url = /^https?:\/\//.test(part)
        ? communityHttpUrl(candidate)
        : null;
      return url ? (
        <Fragment key={index}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            className="as-body-link"
          >
            {candidate}
          </a>
          {suffix}
        </Fragment>
      ) : (
        <Fragment key={index}>{part}</Fragment>
      );
    });
}
