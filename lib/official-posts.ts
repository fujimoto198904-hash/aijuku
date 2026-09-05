export type OfficialPost = {
  id: string;
  title: string;
  body: string;
  topic: string;
  taskId: string;
  startTaskId: string;
  level: string;
  visual: 'email' | 'image' | 'meeting' | 'travel' | 'sheet' | 'web';
  tip: string;
  legacyId?: string;
};
// Editorial introductions, not learner posts or tested AI outputs.
export const officialPosts: OfficialPost[] = [
  {
    id: 'official-email',
    title: '走り書きが、相手に伝わるメールに。',
    body: '言いたいことはあるのに、書き出せない。そんなときは、メモから送信前の下書きを作ってみよう。',
    topic: '仕事',
    taskId: 'Lv.05',
    startTaskId: 'Lv.05',
    level: 'はじめてでも',
    visual: 'email',
    tip: '日時や約束は、自分の目で確認。',
    legacyId: 'demo-post-3',
  },
  {
    id: 'official-image',
    title: 'お店のお知らせ、AIと一枚にしてみる。',
    body: '色や雰囲気を言葉にして、告知用の画像に。準備の課題から進めると、作りたいものが見えてきます。',
    topic: 'つくる',
    taskId: 'Lv.16',
    startTaskId: 'Lv.11',
    level: '準備する教材あり',
    visual: 'image',
    tip: '元の素材と、使ってよい範囲を確かめよう。',
  },
  {
    id: 'official-meeting',
    title: '長い会話を、振り返れる一枚へ。',
    body: '目的・話したこと・結論・未決。長いメモを4つに整理して、もう一度読み返したい一枚を目指します。',
    topic: '仕事',
    taskId: 'Lv.33',
    startTaskId: 'Lv.31',
    level: '準備する教材あり',
    visual: 'meeting',
    tip: '決まっていないことは、決定事項にしない。',
    legacyId: 'demo-post-1',
  },
  {
    id: 'official-travel',
    title: 'みんなの「行きたい」を、旅の予定に。',
    body: '家族旅行も、一人旅も。予算や移動の条件を整理して、自分たちに合う旅の計画を育てよう。',
    topic: '暮らし',
    taskId: 'TRV-03',
    startTaskId: 'TRV-01',
    level: '準備する教材あり',
    visual: 'travel',
    tip: '営業時間や料金は、予約前に公式情報で確認。',
  },
  {
    id: 'official-sheet',
    title: '数字を入れたら、売れた商品が見えてくる。',
    body: '練習用の売上データを使って、合計やグラフが更新されるExcelを作る課題。実際のお客様情報は使いません。',
    topic: '仕事',
    taskId: 'XLS-01',
    startTaskId: 'XLS-01',
    level: '練習データあり',
    visual: 'sheet',
    tip: '答えの数字は、元の表と照らし合わせよう。',
    legacyId: 'demo-post-4',
  },
  {
    id: 'official-web',
    title: 'ホームページの最初の顔、三つ並べて。',
    body: '最初に見せる画面を3案で比べる課題。誰に何を伝えるか、準備の課題から考えていきます。',
    topic: 'つくる',
    taskId: 'WEB-03',
    startTaskId: 'WEB-01',
    level: '準備する教材あり',
    visual: 'web',
    tip: '見た目だけでなく、次の行動が分かるかを確認。',
  },
];
export const findOfficialPost = (id: string) =>
  officialPosts.find((post) => post.id === id);
