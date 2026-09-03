import type { ServiceType } from '@/db/membership';

export const memberServicePlans: ReadonlyArray<{
  id: ServiceType;
  number: string;
  name: string;
  price: string;
  area: string;
  summary: string;
  nextStep: string;
}> = [
  {
    id: 'in-person-tutor',
    number: '01',
    name: '家庭教師型（対面）',
    price: '10,000円 / 60分',
    area: '東京23区内',
    summary:
      '講師が伺い、Web教科書を見ながら一緒に進めます。企業は1回5人まで受講できます。',
    nextStep:
      '2026年10月1日以降の希望日時と場所を確認し、講師の日程を調整します。',
  },
  {
    id: 'online-tutor',
    number: '02',
    name: '家庭教師型（オンライン）',
    price: '4,000円 / 50分',
    area: '全国対応',
    summary: 'Google Meetで同じ画面を見ながら、止まった所から一緒に進めます。',
    nextStep:
      '日時が決まると専用のGoogle Meetを作り、マイページへ表示します。',
  },
  {
    id: 'self-study',
    number: '03',
    name: '対面・教科書自習式',
    price: '月額 10,000円',
    area: '東京23区内',
    summary: '毎日17:00〜21:00。自分で進め、わからない所だけ講師に聞けます。',
    nextStep:
      '2026年11月1日以降の開始月を確認し、通い方と会場をお知らせします。',
  },
];

export const sharedFees = {
  entrance: '0円',
  entranceCampaign: 'OPEN記念・先着1,000名まで',
  entranceRegular: '通常10,000円',
  entranceCondition:
    '有料受講の入会申込受付順に適用し、定員に達し次第終了します。',
  webTextbook: 'Web教科書は完全無料',
  printedTextbook: '希望者のみ・1冊2,000円前後',
} as const;

export function findMemberServicePlan(id: string | null | undefined) {
  return memberServicePlans.find((plan) => plan.id === id) ?? null;
}

export const applicationStatusLabels = {
  received: '受付済み',
  reviewing: '内容確認中',
  confirmed: '申込確定',
  cancelled: '取消済み',
} as const;

export const applicationStatusGuidance = {
  received:
    '受付は完了しています。運営が希望内容を確認するまでお待ちください。送信だけでは予約・契約・決済は確定していません。',
  reviewing:
    '運営が内容と日程を確認しています。追加確認が必要な場合は、登録メールまたはマイページでご案内します。',
  confirmed:
    '担当・日時・実施方法が確定しています。下に表示される案内を確認してください。',
  cancelled:
    'この申込希望は取り消されています。必要な場合は、新しい内容で改めて申し込めます。',
} as const;
