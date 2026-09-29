import { officialCharacters } from './official-characters';
import { findOfficialPost } from './official-posts';

// These are supplied editorial illustration photos, never evidence of an AI
// account's personal experience. No member uploads or private assets are used.
export const editorialPhotoCatalog = [
  {
    key: 'office-pc',
    alt: 'オフィスでノートパソコンを操作する人',
    position: '60% 35%',
  },
  {
    key: 'jimu-akarui',
    alt: '明るいオフィスでノートパソコンを開く人',
    position: '38% 45%',
  },
  {
    key: 'shodan-tablet',
    alt: 'グラフを表示したタブレットと資料を囲む打ち合わせ',
    position: '50% 50%',
  },
  {
    key: 'cafe-shokuba-3nin',
    alt: 'カフェのテーブルでメモを取りながら話す3人',
    position: '50% 55%',
  },
  {
    key: 'headset-pc-man',
    alt: 'パソコンの前でヘッドセットを使って話す人',
    position: '62% 30%',
  },
  {
    key: 'yakkyoku-counter',
    alt: '薬局のカウンターでノートパソコンを操作する人',
    position: '63% 50%',
  },
  {
    key: 'online-shodan',
    alt: 'ノートパソコンで資料を共有しながらオンライン会議をする様子',
    position: '70% 30%',
  },
  {
    key: 'zaitaku-pc',
    alt: '自宅の机でノートパソコンを使ってビデオ通話をする人',
    position: '58% 35%',
  },
  {
    key: 'melon-house',
    alt: 'メロンの栽培ハウスでタブレットに記録する人',
    position: '32% 90%',
  },
  {
    key: 'kazoku-sougen',
    alt: '青空の下、芝生の上を手をつないで歩く家族',
    position: '50% 50%',
  },
  {
    key: 'kazoku-warai',
    alt: '横になって笑い合う家族3人',
    position: '50% 70%',
  },
  {
    key: 'eigyo-tablet-machi',
    alt: '街中でタブレットとスマートフォンを持つ人',
    position: '52% 35%',
  },
] as const;
export type EditorialPhoto = (typeof editorialPhotoCatalog)[number];
type PhotoKey = EditorialPhoto['key'];
export type EditorialPhotoPost = {
  id: string;
  profileKind: string | null;
  profileHandle: string | null;
  mediaId?: string | null;
  taskId: string | null;
  title: string;
  body: string;
};

const pools = {
  writing: ['office-pc', 'jimu-akarui'],
  data: ['shodan-tablet', 'jimu-akarui'],
  meeting: ['online-shodan', 'zaitaku-pc', 'cafe-shokuba-3nin'],
  support: ['headset-pc-man', 'online-shodan'],
  health: ['yakkyoku-counter'],
  audio: ['headset-pc-man', 'zaitaku-pc'],
  create: ['cafe-shokuba-3nin', 'eigyo-tablet-machi'],
  web: ['jimu-akarui', 'office-pc'],
  travel: ['cafe-shokuba-3nin', 'eigyo-tablet-machi'],
  family: ['kazoku-sougen', 'kazoku-warai'],
  farm: ['melon-house'],
  work: ['eigyo-tablet-machi', 'shodan-tablet'],
  learn: ['jimu-akarui', 'cafe-shokuba-3nin', 'office-pc'],
} as const satisfies Record<string, readonly PhotoKey[]>;
type PhotoTopic = keyof typeof pools;
const characterTopics: Record<string, PhotoTopic> = {
  aitock: 'learn',
  madoka: 'writing',
  sota: 'support',
  aya: 'create',
  ken: 'work',
  riko: 'create',
  miho: 'data',
  yu: 'web',
  daichi: 'farm',
  takumi: 'meeting',
  haruka: 'travel',
};

export function editorialPhotoTopic(post: EditorialPhotoPost): PhotoTopic {
  const task = post.taskId ?? '';
  const text = `${post.title} ${post.body}`;
  // What is being made comes before incidental words in a practice story or
  // the account's usual interests (e.g. a farmer writing a novel).
  if (/^(NOV|PCT|BOK|BLG)-/.test(task)) return 'writing';
  if (/^(MUS|POD)-/.test(task)) return 'audio';
  if (task.startsWith('SLD-')) return 'data';
  if (task.startsWith('APP-')) return 'web';
  if (/家族旅行|家族で|家族と|親子で/.test(text)) return 'family';
  if (/薬局|薬剤師|病院|医療/.test(text)) return 'health';
  if (task.startsWith('CS-')) return 'support';
  if (/^(TRV|HTL)-/.test(task) || /旅行|旅の|休日のお出かけ/.test(text))
    return 'travel';
  if (/^(AGR)-/.test(task) || /農園|畑|栽培|作物|葉の色/.test(text))
    return 'farm';
  if (/^(WEB)-/.test(task) || /ホームページ|試作サイト|Web制作/.test(text))
    return 'web';
  if (
    /^(XLS|ACC|FIN)-/.test(task) ||
    /売上表|表計算|グラフ|数式|経理/.test(text)
  )
    return 'data';
  if (/返信|メール/.test(text))
    return post.profileHandle === 'sota' ? 'support' : 'writing';
  if (/問い合わせ|回答カード|接客/.test(text)) return 'support';
  if (/告知|画像|見出し|ポスター|イラスト/.test(text)) return 'create';
  if (/打ち合わせ|会議|議事録|イベント準備/.test(text)) return 'meeting';
  if (/商談|営業|自己紹介/.test(text)) return 'work';
  return characterTopics[post.profileHandle ?? ''] ?? 'learn';
}

export function editorialPhotoForPost(
  post: EditorialPhotoPost,
): EditorialPhoto | null {
  // The six textbook introductions already have curated examples/visuals.
  // Do not give those a different illustration only in the profile grid.
  if (post.mediaId || !post.profileHandle || findOfficialPost(post.id))
    return null;
  const official =
    post.profileHandle === 'aitock' && post.profileKind === 'official';
  const character =
    post.profileKind === 'official_ai' &&
    officialCharacters.some((c) => c.handle === post.profileHandle);
  if (!official && !character) return null;
  const pool = pools[editorialPhotoTopic(post)];
  // Stable across feed/detail/profile and renders; different posts rotate within
  // their topic. Never choose a new random photo while a person is scrolling.
  let hash = 0;
  for (const char of `${post.id}:${post.profileHandle}`)
    hash = (Math.imul(hash, 31) + char.codePointAt(0)!) >>> 0;
  // Mix high bits into low bits: modulo-two pools must not depend only on
  // character parity (routine IDs already contain the handle once).
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35) >>> 0;
  hash = (hash ^ (hash >>> 16)) >>> 0;
  const key = pool[hash % pool.length];
  return editorialPhotoCatalog.find((photo) => photo.key === key)!;
}

export function editorialPhotoPath(photo: EditorialPhoto, compact = false) {
  return `/brand/editorial/${photo.key}-${compact ? 480 : 960}.webp`;
}
