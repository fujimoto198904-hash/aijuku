import {
  BookOpenCheck,
  BriefcaseBusiness,
  ClipboardCheck,
  MessagesSquare,
  ShieldCheck,
} from 'lucide-react';

import { sharedFees } from '@/lib/member-service-plans';
import { textbookCatalog } from '@/lib/textbook-catalog';

const allLessonDetailsPublished =
  textbookCatalog.stats.lessonDrafts === textbookCatalog.stats.total;

export const curriculumCourses = [
  {
    number: '一',
    eyebrow: 'START',
    title: 'はじめる',
    description:
      'AIに一つ頼み、出てきたものを見て、一度直してもらうところから始めます。',
    outcome: 'まず一つ、使える形にする',
    Icon: BookOpenCheck,
  },
  {
    number: '二',
    eyebrow: 'MAKE',
    title: '役立てる',
    description:
      '文章、予定、資料など、暮らしや仕事の困りごとに合わせて課題を選びます。',
    outcome: '自分の目的に合う成果物を作る',
    Icon: BriefcaseBusiness,
  },
  {
    number: '三',
    eyebrow: 'CHECK',
    title: '確かめる',
    description:
      '事実、個人情報、相手、公開範囲を人が確認してから、実際の場面で使います。',
    outcome: '安全に使える状態を確認する',
    Icon: ShieldCheck,
  },
] as const;

export const featuredMissions = [
  {
    code: 'はじめて',
    title: '5問でAI秘書を起動しよう',
    shortTitle: 'AI秘書を設定する',
    category: '教材サンプル',
    time: '自分のペース',
    plan: '収録課題',
    problem:
      '呼ばれたい名前、仕事、よく作る文章、好みの長さ、避けたい表現を伝え、次から再利用できる設定へまとめます。',
    prompt:
      '呼ばれたい名前、仕事、よく作る文章、好みの長さ、避けたい表現を一問ずつ聞いてください。答えた後、分かったこと、まだ分からないこと、今後の話し方を設定カードにまとめてください。',
    tips: [
      '答えにくい質問は飛ばしてよい',
      '個人情報や秘密は入れない',
      '合わない言い方は一度直してもらう',
    ],
    uses: ['AIを初めて使う時', '説明の難しさを調整する時'],
  },
  {
    code: '文章づくり',
    title: '乱雑なメモを送れるメールにしよう',
    shortTitle: 'メモをメールにする',
    category: '教材サンプル',
    time: '自分のペース',
    plan: '収録課題',
    problem:
      '乱雑なメモから結論、相手へのお願い、期限を整理し、送信前確認へ回せるメール草案を作ります。',
    prompt:
      'このメモだけを材料に、相手、目的、伝える事実、お願い、期限を整理してください。不足があれば勝手に補わず質問してください。その後、送信前に人が確認するメール草案へ直してください。',
    tips: [
      '顧客情報や社内秘密は架空化する',
      '元のメモにない事実を加えない',
      '宛先と内容を人が確認してから送る',
    ],
    uses: ['お礼メール', '日程確認', '社内連絡'],
  },
  {
    code: '今日の整理',
    title: '今日のメモからToDoを作ろう',
    shortTitle: 'メモをToDoにする',
    category: '教材サンプル',
    time: '自分のペース',
    plan: '収録課題',
    problem:
      '今日のメモから、やること、期限、相手、必要な準備、確認待ちを抜き出し、優先順位付きのToDo表へ整理します。',
    prompt:
      'このメモから、やること、期限、相手、必要な準備、確認待ちを抜き出し、優先順位を付けてください。曖昧な点は質問として残し、メモにない期限や担当者は作らないでください。',
    tips: [
      '緊急と重要を分ける',
      '曖昧な仕事は次の一手まで小さくする',
      '最後は自分の予定と見比べる',
    ],
    uses: ['一日の整理', '会議後の行動整理', '抜け漏れ確認'],
  },
] as const;

export const learningPrinciples = [
  {
    title: '作りたいものから選ぶ',
    description:
      '全員が同じ順番ではなく、暮らしや仕事の困りごとから課題を選びます。',
    Icon: BookOpenCheck,
  },
  {
    title: '教科書で自分の手を動かす',
    description: '講義を聞くだけで終わらず、毎回ひとつの成果物を作ります。',
    Icon: ClipboardCheck,
  },
  {
    title: '詰まった所を講師に聞く',
    description:
      '当日の担当講師が、いま分からない所と次の一手を一緒に確認します。',
    Icon: MessagesSquare,
  },
  {
    title: '使う前に人が確認する',
    description:
      'AIの出力をそのまま送信・公開せず、事実、相手、公開範囲を確かめます。',
    Icon: ShieldCheck,
  },
] as const;

export const faqItems = [
  {
    label: 'はじめて',
    question: 'AIもパソコンも、ほぼ初めてです。相談できますか？',
    answer: allLessonDetailsPublished
      ? 'はい。文字の入力やChatGPTの開き方から始められます。教材には、使う材料と手順が書いてあります。'
      : 'はい。文字の入力やChatGPTの開き方から始められます。詳しい手順がある教材から選べます。',
  },
  {
    label: '始める場所',
    question: '教材は、全部を順番に進めるのですか？',
    answer:
      'いいえ。最初から順番でも、作りたいものからでも大丈夫です。画像、資料、Excel、Webなど、好きな分野だけでも学べます。',
  },
  {
    label: '授業',
    question: '対面やオンラインの授業でも、教科書を使いますか？',
    answer:
      'はい。すべての授業でWeb教科書を使います。自分で進め、わからない所だけ講師に聞きます。紙の教科書はなくても大丈夫です。',
  },
  {
    label: '無料',
    question: 'このサイトだけで、本当に無料で学べますか？',
    answer: `はい。Web教科書は、登録も購入もいりません。${allLessonDetailsPublished ? '' : '詳しい手順は順番に公開します。'}講師へ質問したいときだけ、有料の授業を選べます。`,
  },
  {
    label: '無料会員',
    question: '無料会員になると、何ができますか？',
    answer:
      'やりたい課題、終えた課題、作ったものをマイページに残せます。登録だけで料金はかかりません。',
  },
  {
    label: '開講時間',
    question: '毎日、授業があるのですか？',
    answer:
      '月額の対面自習は、2026年11月1日から毎日17:00〜21:00に始める予定です。休みの日や会場は、申込前に案内します。',
  },
  {
    label: '料金',
    question: '料金はいくらですか？',
    answer: `${sharedFees.entranceCampaign}、入会金は${sharedFees.entrance}です（${sharedFees.entranceRegular}）。${sharedFees.entranceCondition}家庭教師型の対面は東京23区内・10,000円 / 60分で、企業も1回5人まで受講できます。オンラインは全国対応・4,000円 / 50分です。対面・教科書自習式は通い放題・月額10,000円です。税込・税別、支払い、変更・キャンセル条件は確定後に案内します。`,
  },
  {
    label: '会場',
    question: '会場はどこですか？',
    answer:
      '東京23区内です。予約人数に合わせて毎回会場を決め、参加する方へ場所と持ち物を案内します。',
  },
  {
    label: '講師',
    question: '藤本さん以外が教えることはありますか？',
    answer:
      'はい。藤本亮志を中心に、内容に合う講師が担当します。前回の続きから学べるよう、質問した内容を引き継ぎます。',
  },
  {
    label: '紙の教科書',
    question: '紙の教科書を買う必要はありますか？',
    answer:
      'いいえ。Web教科書は無料です。紙で読みたい方だけ、1冊2,000円前後で購入できる形を予定しています。',
  },
  {
    label: '学習記録',
    question: 'AI実学パスポートは資格として使えますか？',
    answer:
      '資格ではありません。作ったものと、講師が確認したことを分けて残す学習記録です。仕事や転職で「これができます」と説明するときに使えます。',
  },
] as const;
