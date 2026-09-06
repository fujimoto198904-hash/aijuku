'use client';
import { useId, useState } from 'react';
import { CommunityBody } from '@/components/community-body';
import { communityFeedPreview } from '@/lib/community-composer';

export function FeedPostBody({ body }: { body: string }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const preview = communityFeedPreview(body);
  const collapsible = preview !== body;
  return (
    <div className="as-feed-body">
      <p id={id}>
        {collapsible && !expanded ? (
          preview + '…'
        ) : (
          <CommunityBody body={body} />
        )}
      </p>
      {collapsible && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded(!expanded)}
          className="as-feed-read-more"
        >
          {expanded ? '折りたたむ' : '続きを読む'}
        </button>
      )}
    </div>
  );
}
