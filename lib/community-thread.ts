import type { CommunityReply } from '@/db/community';

export type CommunityThread = {
  replies: (CommunityReply & { canDelete: boolean })[];
  replyCount: number;
  page: number;
  pages: number;
  canReply: boolean;
  isStaff: boolean;
  publicProfile: { name: string; handle: string } | null;
  defaultNickname: string;
  notice: string;
  needsLogin: boolean;
  needsConsent: boolean;
};
