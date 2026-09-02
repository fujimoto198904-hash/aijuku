import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const BUILD_ROOT = path.resolve(
  process.env.AIJUKU_DEMO_BUILD_ROOT ??
    path.join(REPO_ROOT, 'tmp/demo-data-build'),
);
const CONFIGURED_ARTIFACT_TOOL_ENTRY = process.env.OAI_ARTIFACT_TOOL_ENTRY;

let artifactTool;
if (CONFIGURED_ARTIFACT_TOOL_ENTRY) {
  artifactTool = await import(
    pathToFileURL(CONFIGURED_ARTIFACT_TOOL_ENTRY).href
  );
} else {
  try {
    artifactTool = await import('@oai/artifact-tool');
  } catch (error) {
    throw new Error(
      '@oai/artifact-toolを読み込めません。依存関係として利用できる環境で実行するか、OAI_ARTIFACT_TOOL_ENTRYへartifact_tool.mjsの絶対パスを設定してください。',
      { cause: error },
    );
  }
}

const { SpreadsheetFile, Workbook } = artifactTool;

const NOTICE = '練習用・すべて架空・外部送信禁止';
const VERSION = '1.1.2';
const GENERATED_AT = '2026-09-02';
const PERIOD_START = '2024-09-01';
const PERIOD_END = '2026-08-31';

const industries = [
  {
    key: 'salon',
    seed: 1103,
    zipBase: '美容室_練習用デモデータ_FULL_v1',
    rootName: '美容室デモデータ',
    shortName: 'ひだまり美容室',
    company: '株式会社ひだまりデモサロン（架空）',
    business: '美容室2店舗の運営、予約、施術、物販、集客',
    locations: ['中央店（架空）', '南店（架空）'],
    departments: ['店舗運営', '予約受付', '集客', '経理', '採用', '業務改善'],
    roles: ['店長', 'スタイリスト', 'アシスタント', '受付', '経理', '広報'],
    customerWord: 'お客様',
    projectWord: '改善案件',
    domainPrefix: 'SAL',
    theme: '#A94B3A',
    starter: {
      email:
        '昨日の予約変更の人\n土曜の10時は無理\n11時半ならいける\n担当はいつもの人で\n一回確認のメール返したい。まだ確定じゃない',
      news: '美容室の経営に関係あるニュース\n豊田市まわり\nAIとか人手不足も気になる\n朝3分くらい。難しいのは無理',
      image:
        '秋の予約キャンペーンの画像ほしい\n落ち着く感じ。でも地味すぎるのは嫌\nインスタと店のサイトで使う\n文字はあとでもいいかも',
      quote:
        'カット 2人\nカラー 1人\nヘッドスパつけるかも\n一旦だいたいの見積ほしい\n税込で見たい',
      slides:
        '来月の店の話\n売上どうだったか\n予約の空き\nインスタもう少しやりたい\nスタッフに5分くらいで話す',
      website:
        '静かに相談できる店って伝えたい\n値段と場所と予約方法はいる\n写真はあとで\nスマホでかっこよく見えるやつ',
      call: 'さっき電話の人\nカラーしたい。金曜夕方希望\n今の色が暗いらしい\n料金も聞かれた\n一回空き確認して折り返すって言った',
      morning:
        '毎朝6時\n美容業界、豊田市、AI活用\n大事なの3つだけ\n店に関係ある理由も短く\n日曜はいらないかも',
      app: '自分だけで使う開店チェック\n掃除、レジ、予約、在庫\n押したら終わったの分かる\n毎朝戻ってほしい',
      ops: 'AIが作った予約返信に、資料にない割引が入ってた\n送る前に気づいた\n誰が何を見ればいいか決まってない\n次から同じこと起きないようにしたい',
    },
  },
  {
    key: 'construction',
    seed: 2207,
    zipBase: '建設業_練習用デモデータ_FULL_v1',
    rootName: '建設業デモデータ',
    shortName: '青空デモ建設',
    company: '株式会社青空デモ建設（架空）',
    business: '住宅改修、店舗改修、小規模新築、外構工事',
    locations: ['本社（架空）', '東営業所（架空）', '資材センター（架空）'],
    departments: ['営業', '積算', '工務', '安全品質', '購買', '経理'],
    roles: [
      '営業担当',
      '現場監督',
      '積算担当',
      '安全担当',
      '購買担当',
      '経理担当',
    ],
    customerWord: '発注者',
    projectWord: '工事案件',
    domainPrefix: 'CON',
    theme: '#345FE7',
    starter: {
      email:
        '昨日の打合せの件\nキッチンの色まだ決まってない\n見積はA案で一旦進める感じ\n工期は確認中\nお客さんに認識合ってるかメールしたい',
      news: '建設業に関係あるニュース\n資材、人手、補助金とか\n愛知の話があれば優先\n朝3分で読めるくらい',
      image:
        '会社案内の表紙に使う画像\n現場っぽいけど怖くない\nちゃんとしてる感じ\n青系かな。細かい色は任せる',
      quote:
        '店舗の床張り替え\nだいたい50平米\n夜間工事になるかも\n養生と廃材処分も\nまず概算でいい',
      slides:
        '来週の全体会議\n動いてる現場\n遅れそうなところ\n安全の話\n社長が5分で話す',
      website:
        '小さい工事も相談できる会社\n施工例と流れと問い合わせ\n古い感じにしたくない\nスマホで見やすく',
      call: 'さっきの電話\n雨漏りっぽい。2階の窓の近く\n明日の午後なら家にいる\n写真送れるって\n現場の人に確認して折り返す',
      morning:
        '平日朝6時\n建設、資材価格、愛知、AI活用\n重要なの3つ\n現場と経営にどう関係するかも',
      app: '自分用の現場チェック\n朝礼、写真、日報、戸締り\n現場ごとに見たい\nスマホだけで使う',
      ops: 'AIが古い図面を見て数量を出してた\n発注前に気づいた\n最新版の見分け方が人によって違う\n止め方と確認の流れを作りたい',
    },
  },
  {
    key: 'realestate',
    seed: 3301,
    zipBase: '不動産会社_練習用デモデータ_FULL_v1',
    rootName: '不動産会社デモデータ',
    shortName: 'まちかどデモ不動産',
    company: '株式会社まちかどデモ不動産（架空）',
    business: '賃貸仲介、売買仲介、賃貸管理、修繕受付',
    locations: ['中央店（架空）', '駅前店（架空）', '管理センター（架空）'],
    departments: ['賃貸営業', '売買営業', '管理', '修繕', '集客', '経理'],
    roles: [
      '営業担当',
      '管理担当',
      '修繕担当',
      '広告担当',
      '契約担当',
      '経理担当',
    ],
    customerWord: 'お客様',
    projectWord: '契約・管理案件',
    domainPrefix: 'REA',
    theme: '#2E765D',
    starter: {
      email:
        '昨日内見した人\n駅前の1LDK気に入ってた\n夜道が暗くない方が大事らしい\n予算は管理費込みか聞けてない\n似てるの3件送るメール作りたい',
      news: '不動産と地域のニュース\n金利、制度、豊田市あたり\nAI活用も少し\n朝3分。売買と賃貸どっちも',
      image:
        '新しい物件紹介の画像\n明るくて住みたくなる感じ\nでも嘘っぽく盛らない\nインスタの正方形と横長',
      quote:
        '入居前の初期費用\n家賃8万くらい\n敷金1、礼金1\n仲介と保険もある\n分かりやすい表にしたい',
      slides:
        '今月の店舗会議\n反響と内見と契約\n広告費も\n来月やること\n社長に5分で見せる',
      website:
        '相談しやすい不動産屋って感じ\n賃貸、売買、管理\n物件検索っぽい入口もほしい\nスマホで今っぽく',
      call: '修理の電話\n洗面の下から水っぽい\n今は止めてるらしい\n今日18時以降なら家にいる\n業者とオーナーに確認が必要',
      morning:
        '平日朝6時\n不動産、金利、地域、AI活用\n大事なの3つだけ\n仕事への影響を一言',
      app: '自分用の追客チェック\n今日連絡する人、内見、書類\n終わったら消える感じ\nスマホだけで使いたい',
      ops: 'AIが成約済み物件をおすすめに入れた\n送る前に気づいた\n公開中かどうかの確認が抜けた\n次からの確認手順を決めたい',
    },
  },
];

const workbookFiles = [
  ['00_最初に見る', '00_ファイル早見表.xlsx', 'ファイル早見表'],
  ['10_会社まるごと/01_会社と人', '01_会社_社員_勤怠.xlsx', '会社・社員・勤怠'],
  ['10_会社まるごと/02_顧客と営業', '02_顧客_営業.xlsx', '顧客・営業'],
  [
    '10_会社まるごと/03_売上と入金',
    '03_売上_請求_入金.xlsx',
    '売上・請求・入金',
  ],
  [
    '10_会社まるごと/04_仕入と在庫',
    '04_仕入_取引先_在庫.xlsx',
    '仕入・取引先・在庫',
  ],
  ['10_会社まるごと/05_経理', '05_経理_予算_月次.xlsx', '経理・予算・月次'],
  [
    '10_会社まるごと/06_問い合わせと電話',
    '06_問い合わせ_電話_ToDo.xlsx',
    '問い合わせ・電話・ToDo',
  ],
  [
    '10_会社まるごと/07_会議と進捗',
    '07_会議_案件_進捗.xlsx',
    '会議・案件・進捗',
  ],
  ['10_会社まるごと/08_集客', '08_集客_SNS_Web.xlsx', '集客・SNS・Web'],
  ['10_会社まるごと/09_業種別', '09_業種別業務.xlsx', '業種別業務'],
];

function rng(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(random, values) {
  return values[Math.floor(random() * values.length)];
}

function int(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function pad(value, length = 4) {
  return String(value).padStart(length, '0');
}

function isoDay(index) {
  const start = Date.UTC(2024, 8, 1);
  return new Date(start + (index % 730) * 86400000).toISOString().slice(0, 10);
}

function isoTime(index, hour = 9) {
  return `${isoDay(index)}T${String((hour + index) % 24).padStart(2, '0')}:${String((index * 7) % 60).padStart(2, '0')}:00+09:00`;
}

function money(random, min = 1000, max = 500000) {
  return Math.round(int(random, min, max) / 100) * 100;
}

function customerId(index) {
  return `CUS-${pad(index, 6)}`;
}

function employeeId(index) {
  return `EMP-${pad(index, 4)}`;
}

function vendorId(index) {
  return `VEN-${pad(index, 4)}`;
}

function projectId(config, index) {
  return `${config.domainPrefix}-PRJ-${pad(index, 5)}`;
}

function toColumnName(columnIndex) {
  let number = columnIndex + 1;
  let result = '';
  while (number > 0) {
    const remainder = (number - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    number = Math.floor((number - 1) / 26);
  }
  return result;
}

function buildCommonData(config) {
  const random = rng(config.seed);
  const employeesCount = config.key === 'salon' ? 18 : 48;
  const employees = Array.from({ length: employeesCount }, (_, index) => {
    const number = index + 1;
    return [
      employeeId(number),
      `デモ社員${pad(number, 3)}`,
      config.locations[index % config.locations.length],
      config.departments[index % config.departments.length],
      config.roles[index % config.roles.length],
      isoDay(number * 11),
      number % 11 === 0 ? '休職中' : '在籍',
      `emp${pad(number, 4)}@example.invalid`,
      `000-0000-${pad(number, 4)}`,
      `DEMO-SKILL-${pad((number % 12) + 1, 2)}`,
    ];
  });

  const attendance = Array.from({ length: 12000 }, (_, index) => {
    const emp = (index % employeesCount) + 1;
    const overtime =
      index % 17 === 0 ? int(random, 45, 180) : int(random, 0, 35);
    return [
      `ATT-${pad(index + 1, 7)}`,
      employeeId(emp),
      isoDay(index),
      `${String(8 + (index % 3)).padStart(2, '0')}:${String((index * 5) % 60).padStart(2, '0')}`,
      `${String(17 + (index % 4)).padStart(2, '0')}:${String((index * 11) % 60).padStart(2, '0')}`,
      60,
      overtime,
      index % 29 === 0 ? '未承認' : '承認済み',
      projectId(config, (index % 300) + 1),
    ];
  });

  const customers = Array.from({ length: 2000 }, (_, index) => {
    const number = index + 1;
    return [
      customerId(number),
      `デモ${config.customerWord}${pad(number, 4)}`,
      pick(random, ['20代', '30代', '40代', '50代', '60代以上', '法人']),
      `架空県サンプル市デモ町${(number % 20) + 1}-${(number % 50) + 1}`,
      `000-1000-${pad(number, 4)}`,
      `customer${pad(number, 5)}@example.invalid`,
      isoDay(number * 3),
      employeeId((number % employeesCount) + 1),
      pick(random, ['見込み', '継続', '休眠', '要確認']),
      pick(random, ['メール', '電話', 'どちらでも', '夕方のみ']),
    ];
  });

  const contacts = Array.from({ length: 5000 }, (_, index) => {
    const cus = (index % customers.length) + 1;
    return [
      `CNT-${pad(index + 1, 7)}`,
      customerId(cus),
      isoTime(index, 8),
      pick(random, ['電話', 'メール', 'Web', '来店', 'LINE想定']),
      pick(random, [
        '相談があった',
        '料金を確認したい',
        '日程を変えたい',
        '資料を送りたい',
        '一度考えたい',
      ]),
      index % 23 === 0 ? '' : `次は${isoDay(index + 4)}ごろ確認`,
      employeeId((index % employeesCount) + 1),
      index % 31 === 0
        ? '期限超過'
        : pick(random, ['対応済み', '返信待ち', '確認中']),
    ];
  });

  const opportunities = Array.from({ length: 1200 }, (_, index) => {
    const number = index + 1;
    const expected = money(
      random,
      20000,
      config.key === 'construction' ? 30000000 : 5000000,
    );
    return [
      `OPP-${pad(number, 6)}`,
      customerId((number % customers.length) + 1),
      `${config.projectWord}${pad(number, 4)}（架空）`,
      isoDay(number * 2),
      expected,
      pick(random, ['初回相談', '提案中', '見積確認中', '受注', '見送り']),
      employeeId((number % employeesCount) + 1),
      isoDay(number * 2 + 7),
      projectId(config, (number % 300) + 1),
    ];
  });

  const sales = Array.from({ length: 6000 }, (_, index) => {
    const number = index + 1;
    const subtotal = money(
      random,
      3000,
      config.key === 'construction' ? 12000000 : 800000,
    );
    const discount = index % 19 === 0 ? Math.round(subtotal * 0.05) : 0;
    const tax = Math.floor((subtotal - discount) * 0.1);
    return [
      `SAL-${pad(number, 7)}`,
      isoDay(number),
      customerId((number % customers.length) + 1),
      projectId(config, (number % 300) + 1),
      subtotal,
      discount,
      tax,
      subtotal - discount + tax,
      employeeId((number % employeesCount) + 1),
      pick(random, ['計上済み', '確認中', '取消']),
    ];
  });

  const salesLines = Array.from({ length: 12000 }, (_, index) => {
    const quantity = int(random, 1, 8);
    const unitPrice = money(
      random,
      500,
      config.key === 'construction' ? 500000 : 80000,
    );
    return [
      `SLN-${pad(index + 1, 8)}`,
      `SAL-${pad((index % sales.length) + 1, 7)}`,
      `商品・作業${pad((index % 300) + 1, 3)}（架空）`,
      quantity,
      unitPrice,
      null,
      index % 37 === 0 ? '金額要確認' : '',
    ];
  });

  const invoices = Array.from({ length: 3000 }, (_, index) => {
    const amount = sales[index * 2][7];
    return [
      `INV-${pad(index + 1, 7)}`,
      sales[index * 2][0],
      customerId(((index * 2) % customers.length) + 1),
      isoDay(index * 2),
      isoDay(index * 2 + 30),
      amount,
      index % 41 === 0 ? amount - 1000 : amount,
      index % 41 === 0 ? 1000 : 0,
      index % 41 === 0 ? '一部未入金' : '入金済み',
    ];
  });

  const vendors = Array.from({ length: 80 }, (_, index) => {
    const number = index + 1;
    return [
      vendorId(number),
      `デモ取引先${pad(number, 3)}株式会社（架空）`,
      pick(random, [
        '材料',
        '外注',
        '設備',
        '広告',
        'システム',
        '専門サービス',
      ]),
      `000-2000-${pad(number, 4)}`,
      `vendor${pad(number, 4)}@example.invalid`,
      pick(random, ['月末締翌月末', '都度', '20日締翌月10日']),
      int(random, 2, 21),
      number % 17 === 0 ? '要確認' : '取引中',
    ];
  });

  const items = Array.from({ length: 300 }, (_, index) => {
    const number = index + 1;
    return [
      `ITM-${pad(number, 5)}`,
      `デモ品目${pad(number, 3)}`,
      pick(random, ['材料', '消耗品', '販売品', '備品', '外注作業']),
      pick(random, ['個', '箱', '本', '式', 'm', 'kg']),
      vendorId((number % vendors.length) + 1),
      money(random, 100, 120000),
      int(random, 5, 100),
      int(random, 2, 20),
    ];
  });

  const purchaseOrders = Array.from({ length: 2000 }, (_, index) => {
    const number = index + 1;
    const subtotal = money(random, 2000, 2500000);
    return [
      `PO-${pad(number, 7)}`,
      vendorId((number % vendors.length) + 1),
      isoDay(number),
      isoDay(number + int(random, 2, 14)),
      projectId(config, (number % 300) + 1),
      subtotal,
      Math.floor(subtotal * 0.1),
      subtotal + Math.floor(subtotal * 0.1),
      employeeId((number % employeesCount) + 1),
      number % 29 === 0
        ? '未承認'
        : pick(random, ['発注済み', '入荷済み', '一部入荷']),
    ];
  });

  const purchaseLines = Array.from({ length: 6000 }, (_, index) => {
    const quantity = int(random, 1, 60);
    const unitPrice = items[index % items.length][5];
    return [
      `POL-${pad(index + 1, 8)}`,
      `PO-${pad((index % purchaseOrders.length) + 1, 7)}`,
      `ITM-${pad((index % items.length) + 1, 5)}`,
      quantity,
      unitPrice,
      null,
      index % 97 === 0 ? Math.max(0, quantity - 1) : quantity,
      index % 97 === 0 ? '数量差あり' : '一致',
    ];
  });

  const inventoryMoves = Array.from({ length: 10000 }, (_, index) => {
    const quantity = int(random, 1, 20) * (index % 3 === 0 ? -1 : 1);
    return [
      `MOV-${pad(index + 1, 8)}`,
      isoTime(index, 7),
      `ITM-${pad((index % items.length) + 1, 5)}`,
      config.locations[index % config.locations.length],
      pick(random, ['入荷', '使用', '販売', '移動', '棚卸調整']),
      quantity,
      index % 97 === 0 ? '' : `REF-${pad(index + 1, 7)}`,
      employeeId((index % employeesCount) + 1),
    ];
  });

  const accounts = [
    ['100', '現金', '資産'],
    ['110', '普通預金デモ', '資産'],
    ['120', '売掛金', '資産'],
    ['200', '買掛金', '負債'],
    ['300', '資本金デモ', '純資産'],
    ['400', '売上高', '収益'],
    ['500', '仕入高', '費用'],
    ['510', '人件費', '費用'],
    ['520', '広告費', '費用'],
    ['530', '地代家賃', '費用'],
    ['540', '水道光熱費', '費用'],
    ['550', '消耗品費', '費用'],
    ['560', '外注費', '費用'],
    ['570', '通信費', '費用'],
    ['580', '雑費', '費用'],
  ].map(([id, name, type]) => [`ACC-${id}`, name, type, '課税区分は練習用']);

  const journals = Array.from({ length: 2500 }, (_, index) => [
    `JNL-${pad(index + 1, 7)}`,
    isoDay(index),
    `デモ取引 ${index + 1}`,
    pick(random, ['売上', '仕入', '経費', '入金', '支払']),
    `SRC-${pad(index + 1, 7)}`,
    index % 43 === 0 ? '確認中' : '承認済み',
  ]);

  const journalLines = Array.from({ length: 5000 }, (_, index) => {
    const amount = money(random, 500, 900000);
    const first = index % 2 === 0;
    return [
      `JLL-${pad(index + 1, 8)}`,
      `JNL-${pad(Math.floor(index / 2) + 1, 7)}`,
      accounts[(index * 3) % accounts.length][0],
      first ? amount : 0,
      first ? 0 : amount,
      projectId(config, (index % 300) + 1),
      config.departments[index % config.departments.length],
    ];
  });

  const expenses = Array.from({ length: 1800 }, (_, index) => {
    const amount = money(random, 300, 180000);
    return [
      `EXP-${pad(index + 1, 7)}`,
      isoDay(index),
      employeeId((index % employeesCount) + 1),
      pick(random, [
        '交通費',
        '消耗品',
        '会議費',
        '通信費',
        '外注費',
        '広告費',
      ]),
      `デモ経費 ${index + 1}`,
      amount,
      pick(random, ['立替', '会社カードDEMO', '振込DEMO']),
      `90_PDF練習/領収書/領収書_${pad(index + 1, 4)}.pdf`,
      index % 37 === 0 ? '金額要確認' : '承認済み',
    ];
  });

  const budgets = Array.from({ length: 720 }, (_, index) => [
    `BGT-${pad(index + 1, 6)}`,
    `${2024 + Math.floor((index % 24) / 12)}-${pad((index % 12) + 1, 2)}`,
    config.departments[index % config.departments.length],
    accounts[index % accounts.length][0],
    money(random, 50000, 5000000),
    index % 11 === 0 ? '修正版' : '当初',
  ]);

  const monthly = Array.from({ length: 24 }, (_, index) => {
    const revenue = money(
      random,
      5000000,
      config.key === 'construction' ? 60000000 : 24000000,
    );
    const costs = Math.floor(revenue * (0.45 + random() * 0.2));
    const payroll = Math.floor(revenue * (0.18 + random() * 0.08));
    const other = Math.floor(revenue * (0.08 + random() * 0.06));
    return [
      `${2024 + Math.floor((index + 8) / 12)}-${pad(((index + 8) % 12) + 1, 2)}`,
      revenue,
      costs,
      payroll,
      other,
      null,
      index % 7 === 0 ? '要因確認中' : '確認済み',
    ];
  });

  const inquiries = Array.from({ length: 1000 }, (_, index) => [
    `INQ-${pad(index + 1, 7)}`,
    customerId((index % customers.length) + 1),
    isoTime(index, 8),
    pick(random, ['電話', 'Web', 'メール', '来店']),
    pick(random, [
      '料金を聞きたい',
      '空きを知りたい',
      '内容を確認したい',
      '変更したい',
      '困っている',
    ]),
    employeeId((index % employeesCount) + 1),
    isoDay(index + 2),
    index % 29 === 0
      ? '期限超過'
      : pick(random, ['対応中', '返信待ち', '完了']),
    projectId(config, (index % 300) + 1),
  ]);

  const callLines = Array.from({ length: 5000 }, (_, index) => [
    `CALL-${pad(Math.floor(index / 5) + 1, 6)}`,
    `INQ-${pad((Math.floor(index / 5) % inquiries.length) + 1, 7)}`,
    index % 5,
    index % 2 === 0 ? '相手' : '担当',
    pick(random, [
      'ちょっと確認したくて',
      'たぶん前に聞いた件',
      '日程はまだ決まってない',
      '一回見てもらえますか',
      '分かりました。確認して返します',
    ]),
    index % 17 === 0 ? '聞き取り不明' : '文字起こし済み',
  ]);

  const todos = Array.from({ length: 1400 }, (_, index) => [
    `TODO-${pad(index + 1, 7)}`,
    pick(random, ['問い合わせ', '電話', '会議', '案件']),
    `INQ-${pad((index % inquiries.length) + 1, 7)}`,
    pick(random, [
      '折り返す',
      '資料を確認する',
      '日程候補を出す',
      '見積を確認する',
      '責任者に聞く',
    ]),
    employeeId((index % employeesCount) + 1),
    isoDay(index + 3),
    pick(random, ['高', '中', '低']),
    index % 31 === 0 ? '期限超過' : pick(random, ['未着手', '進行中', '完了']),
  ]);

  const calendarEvents = Array.from({ length: 800 }, (_, index) => [
    `EVT-${pad(index + 1, 6)}`,
    `TODO-${pad((index % todos.length) + 1, 7)}`,
    `デモ予定 ${index + 1}`,
    isoTime(index + 5, 10),
    isoTime(index + 5, 11),
    employeeId((index % employeesCount) + 1),
    index % 17 === 0 ? '候補・未登録' : '登録済み',
  ]);

  const projects = Array.from({ length: 300 }, (_, index) => {
    const number = index + 1;
    return [
      projectId(config, number),
      `${config.projectWord}${pad(number, 4)}（架空）`,
      customerId((number % customers.length) + 1),
      isoDay(number * 2),
      isoDay(number * 2 + 45 + (number % 90)),
      employeeId((number % employeesCount) + 1),
      money(random, 50000, config.key === 'construction' ? 50000000 : 8000000),
      pick(random, ['相談中', '進行中', '確認待ち', '完了', '保留']),
      number % 23 === 0 ? '期限に注意' : '',
    ];
  });

  const meetings = Array.from({ length: 120 }, (_, index) => [
    `MTG-${pad(index + 1, 6)}`,
    isoTime(index * 5, 9),
    pick(random, ['店舗会議', '営業会議', '月次会議', '案件会議', '改善会議']),
    projectId(config, (index % projects.length) + 1),
    employeeId((index % employeesCount) + 1),
    `話したこと：${pick(random, ['進み具合', '売上', '困りごと', 'お客様対応', '来月の予定'])}`,
    index % 13 === 0 ? '決まっていないことあり' : '記録済み',
  ]);

  const decisions = Array.from({ length: 500 }, (_, index) => [
    `DEC-${pad(index + 1, 7)}`,
    `MTG-${pad((index % meetings.length) + 1, 6)}`,
    pick(random, [
      '一旦この案で進める',
      '次回までに確認する',
      '担当者へ聞く',
      '見積を取り直す',
    ]),
    index % 17 === 0 ? '' : employeeId((index % employeesCount) + 1),
    isoDay(index + 7),
    index % 17 === 0 ? '担当未定' : '確認済み',
  ]);

  const projectTasks = Array.from({ length: 2000 }, (_, index) => [
    `TSK-${pad(index + 1, 7)}`,
    projectId(config, (index % projects.length) + 1),
    `作業${pad(index + 1, 4)}：${pick(random, ['資料確認', '連絡', '見積', '現地確認', '社内確認'])}`,
    employeeId((index % employeesCount) + 1),
    isoDay(index + 5),
    int(random, 0, 100),
    index % 43 === 0 ? '遅れ' : pick(random, ['未着手', '進行中', '完了']),
    `DEC-${pad((index % decisions.length) + 1, 7)}`,
  ]);

  const risks = Array.from({ length: 400 }, (_, index) => [
    `RSK-${pad(index + 1, 6)}`,
    projectId(config, (index % projects.length) + 1),
    pick(random, [
      '日程が未確定',
      '金額が変わるかも',
      '返事待ち',
      '人が足りないかも',
      '資料の版に注意',
    ]),
    pick(random, ['低', '中', '高候補']),
    employeeId((index % employeesCount) + 1),
    isoDay(index + 10),
    index % 19 === 0 ? '未対応' : '対応中',
  ]);

  const campaigns = Array.from({ length: 100 }, (_, index) => [
    `CAM-${pad(index + 1, 5)}`,
    `${pick(random, ['春', '夏', '秋', '冬', '地域', '新規'])}キャンペーン${index + 1}（架空）`,
    pick(random, ['問い合わせ', '予約', '認知', '再来', '資料請求']),
    isoDay(index * 7),
    isoDay(index * 7 + 30),
    money(random, 30000, 500000),
    index % 13 === 0 ? '案' : '実施済み',
  ]);

  const posts = Array.from({ length: 700 }, (_, index) => [
    `POST-${pad(index + 1, 6)}`,
    `CAM-${pad((index % campaigns.length) + 1, 5)}`,
    pick(random, ['Instagram', 'ブログ', 'メール', 'Webお知らせ']),
    isoDay(index),
    pick(random, [
      'スタッフ紹介',
      '仕事の流れ',
      'よくある質問',
      '事例',
      'お知らせ',
    ]),
    `デモ投稿案です。${NOTICE}`,
    index % 17 === 0 ? '権利確認待ち' : '確認済み',
    pick(random, ['下書き', '確認待ち', '公開済みデモ']),
  ]);

  const adMetrics = Array.from({ length: 1500 }, (_, index) => {
    const views = int(random, 100, 20000);
    const clicks = int(random, 1, Math.max(2, Math.floor(views * 0.12)));
    return [
      `ADM-${pad(index + 1, 7)}`,
      `CAM-${pad((index % campaigns.length) + 1, 5)}`,
      isoDay(index),
      money(random, 300, 30000),
      views,
      clicks,
      int(random, 0, Math.max(1, Math.floor(clicks * 0.2))),
      money(random, 0, 300000),
    ];
  });

  const webMetrics = Array.from({ length: 2000 }, (_, index) => [
    isoDay(index),
    pick(random, ['/', '/service', '/price', '/case', '/contact', '/faq']),
    int(random, 10, 2500),
    int(random, 15, 240),
    int(random, 0, 80),
    int(random, 0, 40),
  ]);

  return {
    employees,
    attendance,
    customers,
    contacts,
    opportunities,
    sales,
    salesLines,
    invoices,
    vendors,
    items,
    purchaseOrders,
    purchaseLines,
    inventoryMoves,
    accounts,
    journals,
    journalLines,
    expenses,
    budgets,
    monthly,
    inquiries,
    callLines,
    todos,
    calendarEvents,
    projects,
    meetings,
    decisions,
    projectTasks,
    risks,
    campaigns,
    posts,
    adMetrics,
    webMetrics,
  };
}

function buildDomainData(config, common) {
  const random = rng(config.seed + 9000);
  if (config.key === 'salon') {
    const services = Array.from({ length: 52 }, (_, index) => [
      `SVC-${pad(index + 1, 3)}`,
      pick(random, ['カット', 'カラー', 'ケア', 'スパ', 'セット']),
      `デモメニュー${pad(index + 1, 2)}`,
      int(random, 30, 180),
      money(random, 2000, 30000),
      money(random, 500, 9000),
      config.locations[index % config.locations.length],
      '提供中',
    ]);
    const reservations = Array.from({ length: 12000 }, (_, index) => [
      `RSV-${pad(index + 1, 7)}`,
      customerId((index % common.customers.length) + 1),
      config.locations[index % config.locations.length],
      `SVC-${pad((index % services.length) + 1, 3)}`,
      employeeId((index % common.employees.length) + 1),
      isoTime(index, 9),
      pick(random, ['Web', '電話', '来店', 'LINE想定']),
      index % 13 === 0
        ? 'キャンセル'
        : pick(random, ['来店済み', '予約中', '変更']),
      index % 13 === 0
        ? pick(random, ['予定変更', '体調都合', '理由なし', '別日に変更'])
        : '',
    ]);
    const visits = Array.from({ length: 9000 }, (_, index) => [
      `VIS-${pad(index + 1, 7)}`,
      `RSV-${pad((index % reservations.length) + 1, 7)}`,
      customerId((index % common.customers.length) + 1),
      isoTime(index, 9),
      isoTime(index, 11),
      employeeId((index % common.employees.length) + 1),
      index % 19 === 0 ? '' : isoDay(index + 60),
      '施術完了',
    ]);
    const serviceLines = Array.from({ length: 15000 }, (_, index) => {
      const service = services[index % services.length];
      return [
        `SVL-${pad(index + 1, 8)}`,
        `VIS-${pad((index % visits.length) + 1, 7)}`,
        service[0],
        employeeId((index % common.employees.length) + 1),
        1,
        service[4],
        index % 37 === 0 ? 500 : 0,
        null,
        service[3],
      ];
    });
    const careNotes = Array.from({ length: 9000 }, (_, index) => [
      `NOTE-${pad(index + 1, 7)}`,
      `VIS-${pad(index + 1, 7)}`,
      pick(random, [
        '短め希望',
        '落ち着いた色',
        '扱いやすさ優先',
        '相談しながら決めたい',
      ]),
      pick(random, ['カット実施', 'カラー調整', 'ケア説明', '次回相談']),
      `DEMO-COLOR-${pad((index % 30) + 1, 2)}`,
      pick(random, [
        '2か月後に確認',
        '次回カラー相談',
        'ホームケア案内',
        '特になし',
      ]),
      '公開不可・練習用',
    ]);
    return {
      sheets: [
        [
          'サービス',
          [
            'SERVICE_ID',
            '分類',
            '名称_架空',
            '所要分',
            '価格_円',
            '原価目安_円',
            '対象店舗',
            '状態',
          ],
          services,
        ],
        [
          '予約',
          [
            'RESERVATION_ID',
            'CUSTOMER_ID',
            '店舗',
            'SERVICE_ID',
            'EMPLOYEE_ID',
            '予約日時',
            '経路',
            '状態',
            '取消理由',
          ],
          reservations,
        ],
        [
          '来店',
          [
            'VISIT_ID',
            'RESERVATION_ID',
            'CUSTOMER_ID',
            '受付日時',
            '退店日時',
            '担当EMPLOYEE_ID',
            '次回候補日',
            '状態',
          ],
          visits,
        ],
        [
          '施術明細',
          [
            'SERVICE_LINE_ID',
            'VISIT_ID',
            'SERVICE_ID',
            '担当EMPLOYEE_ID',
            '数量',
            '定価_円',
            '値引_円',
            '金額_円',
            '所要分',
          ],
          serviceLines,
          { 7: '=RC[-3]-RC[-2]' },
        ],
        [
          '施術メモ',
          [
            'NOTE_ID',
            'VISIT_ID',
            '要望_架空',
            '実施内容_架空',
            '薬剤コード_DEMO',
            '次回提案_架空',
            '取扱',
          ],
          careNotes,
        ],
      ],
      story: '予約→来店→施術→売上を同じIDでたどれます。',
    };
  }

  if (config.key === 'construction') {
    const sites = Array.from({ length: 180 }, (_, index) => [
      projectId(config, index + 1),
      `デモ現場${pad(index + 1, 3)}（架空）`,
      customerId((index % common.customers.length) + 1),
      `架空県サンプル市工事町${(index % 30) + 1}-${(index % 50) + 1}`,
      pick(random, [
        '住宅改修',
        '店舗改修',
        '事務所改修',
        '外構',
        '小規模新築',
      ]),
      isoDay(index * 3),
      isoDay(index * 3 + 90),
      employeeId((index % common.employees.length) + 1),
      pick(random, ['見積中', '施工中', '検査中', '完了', '保留']),
    ]);
    const estimates = Array.from({ length: 500 }, (_, index) => [
      `EST-${pad(index + 1, 6)}`,
      projectId(config, (index % sites.length) + 1),
      `v${(index % 3) + 1}`,
      isoDay(index),
      isoDay(index + 30),
      index % 17 === 0 ? '未承認' : '確認済み',
      `DOC-EST-${pad(index + 1, 6)}`,
    ]);
    const estimateLines = Array.from({ length: 4000 }, (_, index) => {
      const quantity = int(random, 1, 120);
      const unitPrice = money(random, 500, 800000);
      return [
        `ELN-${pad(index + 1, 7)}`,
        `EST-${pad((index % estimates.length) + 1, 6)}`,
        pick(random, ['仮設', '解体', '木工', '内装', '電気', '設備', '外構']),
        `デモ工事項目${pad((index % 120) + 1, 3)}`,
        quantity,
        pick(random, ['式', 'm', '㎡', '個', '人工']),
        unitPrice,
        null,
        index % 83 === 0 ? '単位要確認' : '',
      ];
    });
    const dailyReports = Array.from({ length: 5000 }, (_, index) => [
      `DR-${pad(index + 1, 7)}`,
      projectId(config, (index % sites.length) + 1),
      isoDay(index),
      pick(random, ['晴れ', '曇り', '雨', '小雨']),
      employeeId((index % common.employees.length) + 1),
      pick(random, ['内装作業', '設備工事', '材料搬入', '検査', '片付け']),
      int(random, 2, 18),
      index % 47 === 0 ? '図面確認待ち' : '',
      pick(random, ['予定どおり', '少し遅れ', '確認待ち']),
    ]);
    const safety = Array.from({ length: 1500 }, (_, index) => [
      `SAFE-${pad(index + 1, 7)}`,
      projectId(config, (index % sites.length) + 1),
      isoDay(index),
      pick(random, ['足場', '開口部', '電動工具', '搬入', '高所', '火気']),
      pick(random, ['低候補', '中候補', '高候補']),
      pick(random, [
        '養生を確認',
        '立入範囲を確認',
        '工具点検',
        '誘導員配置候補',
      ]),
      employeeId((index % common.employees.length) + 1),
      index % 29 === 0 ? '未対応' : '確認済み',
      '安全可否は人が判断',
    ]);
    const subcontract = Array.from({ length: 2500 }, (_, index) => [
      `SUB-${pad(index + 1, 7)}`,
      projectId(config, (index % sites.length) + 1),
      vendorId((index % common.vendors.length) + 1),
      isoDay(index),
      pick(random, ['内装', '電気', '設備', '塗装', '外構']),
      int(random, 1, 12),
      money(random, 20000, 1500000),
      index % 53 === 0 ? '請求未確認' : '確認済み',
    ]);
    return {
      sheets: [
        [
          '工事案件',
          [
            'PROJECT_ID',
            '現場名_架空',
            'CUSTOMER_ID',
            '住所_架空',
            '工事種別',
            '開始予定日',
            '完了予定日',
            '責任者EMPLOYEE_ID',
            '状態',
          ],
          sites,
        ],
        [
          '見積',
          [
            'ESTIMATE_ID',
            'PROJECT_ID',
            '版',
            '作成日',
            '有効期限',
            '承認状態',
            'DOC_ID',
          ],
          estimates,
        ],
        [
          '見積明細',
          [
            'ESTIMATE_LINE_ID',
            'ESTIMATE_ID',
            '工種',
            '項目_架空',
            '数量',
            '単位',
            '単価_円',
            '金額_円',
            '注意',
          ],
          estimateLines,
          { 7: '=RC[-3]*RC[-1]' },
        ],
        [
          '工事日報',
          [
            'DAILY_REPORT_ID',
            'PROJECT_ID',
            '日付',
            '天気',
            '報告EMPLOYEE_ID',
            '作業内容_架空',
            '作業人数',
            '問題_架空',
            '進み具合',
          ],
          dailyReports,
        ],
        [
          '安全記録',
          [
            'SAFETY_ID',
            'PROJECT_ID',
            '日付',
            '危険候補',
            '重要度候補',
            '対策候補',
            '担当EMPLOYEE_ID',
            '状態',
            '人の判断',
          ],
          safety,
        ],
        [
          '協力会社作業',
          [
            'SUBCONTRACT_ID',
            'PROJECT_ID',
            'VENDOR_ID',
            '日付',
            '工種',
            '人数',
            '金額_円',
            '状態',
          ],
          subcontract,
        ],
      ],
      story: '顧客→工事→見積→日報→安全→原価を同じPROJECT_IDでたどれます。',
    };
  }

  const properties = Array.from({ length: 600 }, (_, index) => [
    `PROP-${pad(index + 1, 6)}`,
    `デモ物件${pad(index + 1, 4)}（架空）`,
    pick(random, [
      '賃貸マンション',
      '賃貸アパート',
      '戸建',
      '売買マンション',
      '土地',
    ]),
    `架空県サンプル市まちかど町${(index % 40) + 1}-${(index % 60) + 1}`,
    pick(random, ['1K', '1LDK', '2LDK', '3LDK', '土地']),
    int(random, 20, 120),
    money(random, 50000, 50000000),
    employeeId((index % common.employees.length) + 1),
    index % 17 === 0
      ? '募集停止'
      : pick(random, ['募集中', '管理中', '成約済み']),
  ]);
  const leads = Array.from({ length: 3000 }, (_, index) => [
    `LEAD-${pad(index + 1, 7)}`,
    customerId((index % common.customers.length) + 1),
    `PROP-${pad((index % properties.length) + 1, 6)}`,
    isoTime(index, 9),
    pick(random, ['Web', '電話', '来店', '紹介']),
    pick(random, [
      '駅近希望',
      '予算優先',
      '広さ優先',
      '夜道が安心な所',
      'ペット相談',
    ]),
    employeeId((index % common.employees.length) + 1),
    index % 31 === 0
      ? '返信期限超過'
      : pick(random, ['対応中', '内見候補', '見送り']),
  ]);
  const viewings = Array.from({ length: 2000 }, (_, index) => [
    `VIEW-${pad(index + 1, 7)}`,
    `LEAD-${pad((index % leads.length) + 1, 7)}`,
    `PROP-${pad((index % properties.length) + 1, 6)}`,
    isoTime(index + 3, 10),
    employeeId((index % common.employees.length) + 1),
    index % 13 === 0 ? 'キャンセル' : '実施',
    pick(random, ['明るさが良い', '場所が良い', '少し狭い', '予算確認が必要']),
    isoDay(index + 5),
  ]);
  const applications = Array.from({ length: 800 }, (_, index) => [
    `APP-${pad(index + 1, 6)}`,
    `VIEW-${pad((index % viewings.length) + 1, 7)}`,
    customerId((index % common.customers.length) + 1),
    `PROP-${pad((index % properties.length) + 1, 6)}`,
    isoDay(index),
    pick(random, ['受付', '書類待ち', '人の確認中', '取下げ', '契約準備']),
    index % 19 === 0 ? '本人確認書類未受領' : '',
    employeeId((index % common.employees.length) + 1),
  ]);
  const leases = Array.from({ length: 500 }, (_, index) => [
    `LEASE-${pad(index + 1, 6)}`,
    `APP-${pad((index % applications.length) + 1, 6)}`,
    `PROP-${pad((index % properties.length) + 1, 6)}`,
    customerId((index % common.customers.length) + 1),
    isoDay(index),
    isoDay(index + 730),
    money(random, 50000, 180000),
    money(random, 2000, 20000),
    pick(random, ['契約中', '更新確認中', '解約予定']),
    '教材用・未締結・法的効力なし',
  ]);
  const rentPayments = Array.from({ length: 6000 }, (_, index) => {
    const lease = leases[index % leases.length];
    const billed = lease[6] + lease[7];
    const paid = index % 43 === 0 ? billed - 1000 : billed;
    return [
      `RENT-${pad(index + 1, 7)}`,
      lease[0],
      isoDay(index),
      billed,
      paid,
      billed - paid,
      index % 43 === 0 ? '差額あり' : '一致',
      employeeId((index % common.employees.length) + 1),
    ];
  });
  const repairs = Array.from({ length: 1600 }, (_, index) => [
    `REP-${pad(index + 1, 7)}`,
    `PROP-${pad((index % properties.length) + 1, 6)}`,
    `LEASE-${pad((index % leases.length) + 1, 6)}`,
    isoTime(index, 8),
    pick(random, [
      '水漏れかも',
      'エアコンが動かない',
      '鍵をなくした',
      '照明が切れた',
      '音が気になる',
    ]),
    pick(random, ['高候補', '中候補', '低候補']),
    vendorId((index % common.vendors.length) + 1),
    money(random, 3000, 300000),
    index % 29 === 0 ? '承認待ち' : pick(random, ['受付', '手配中', '完了']),
    '緊急度は人が最終判断',
  ]);
  return {
    sheets: [
      [
        '物件',
        [
          'PROPERTY_ID',
          '物件名_架空',
          '区分',
          '住所_架空',
          '間取り',
          '面積_㎡',
          '賃料または価格_円',
          '担当EMPLOYEE_ID',
          '状態',
        ],
        properties,
      ],
      [
        '反響',
        [
          'LEAD_ID',
          'CUSTOMER_ID',
          'PROPERTY_ID',
          '受付日時',
          '入口',
          '希望メモ_架空',
          '担当EMPLOYEE_ID',
          '状態',
        ],
        leads,
      ],
      [
        '内見',
        [
          'VIEWING_ID',
          'LEAD_ID',
          'PROPERTY_ID',
          '予定日時',
          '担当EMPLOYEE_ID',
          '状態',
          'メモ_架空',
          '次回連絡日',
        ],
        viewings,
      ],
      [
        '申込',
        [
          'APPLICATION_ID',
          'VIEWING_ID',
          'CUSTOMER_ID',
          'PROPERTY_ID',
          '申込日',
          '状態',
          '不足_架空',
          '担当EMPLOYEE_ID',
        ],
        applications,
      ],
      [
        '賃貸契約',
        [
          'LEASE_ID',
          'APPLICATION_ID',
          'PROPERTY_ID',
          'CUSTOMER_ID',
          '開始日',
          '終了日',
          '賃料_円',
          '管理費_円',
          '状態',
          '注意',
        ],
        leases,
      ],
      [
        '家賃入金',
        [
          'RENT_PAYMENT_ID',
          'LEASE_ID',
          '対象日',
          '請求額_円',
          '入金額_円',
          '差額_円',
          '照合状態',
          '確認EMPLOYEE_ID',
        ],
        rentPayments,
      ],
      [
        '修繕',
        [
          'REPAIR_ID',
          'PROPERTY_ID',
          'LEASE_ID',
          '受付日時',
          '内容_架空',
          '優先度候補',
          'VENDOR_ID',
          '見積額_円',
          '状態',
          '人の判断',
        ],
        repairs,
      ],
    ],
    story: '顧客→反響→内見→申込→契約→入金→修繕を同じIDでたどれます。',
  };
}

function sheet(name, headers, rows, formulas) {
  return { name, headers, rows, formulas };
}

function workbookDefinitions(config, common, domain) {
  const fileRows = workbookFiles.map(
    ([folder, fileName, description], index) => [
      `FILE-${pad(index + 1, 3)}`,
      folder,
      fileName,
      description,
      index === 0 ? '最初に見る' : '課題で指定された時だけ開く',
      NOTICE,
    ],
  );
  const lessonFileNames = [
    '01メール.txt',
    '02新聞.txt',
    '03画像.txt',
    '04見積.txt',
    '05資料.txt',
    '06HP.txt',
    '07商談.txt',
    '08朝新聞.txt',
    '09アプリ.txt',
    '10AI安全.txt',
    '11会社.pdf',
    '12料金.pdf',
    '13組織.pdf',
    '14AIルール.docx',
  ];
  const starterRows = lessonFileNames.map((fileName, index) => {
    const isShortText = fileName.endsWith('.txt');
    return [
      index + 1,
      `課題/${fileName}`,
      isShortText
        ? '中身をコピーしてチャットへ貼る（おすすめ）'
        : 'ファイルをチャットへ添付する',
      index < 10
        ? '貼ったメモについて、課題ページの一言を送る'
        : '指定された課題だけで使う補助資料',
    ];
  });
  const idRows = [
    ['EMP', '社員', 'EMP-0001'],
    ['CUS', config.customerWord, 'CUS-000001'],
    ['VEN', '取引先', 'VEN-0001'],
    [config.domainPrefix, config.projectWord, projectId(config, 1)],
    ['INV', '請求', 'INV-0000001'],
    ['INQ', '問い合わせ', 'INQ-0000001'],
    ['TODO', 'やること', 'TODO-0000001'],
    ['MTG', '会議', 'MTG-000001'],
  ];
  return [
    {
      folder: workbookFiles[0][0],
      fileName: workbookFiles[0][1],
      title: `${config.shortName}｜まず開くファイル早見表`,
      sheets: [
        sheet(
          'ここから',
          ['順番', 'すること', '説明'],
          [
            [
              1,
              'このExcelだけ先に見る',
              '大量の資料を全部開かなくて大丈夫です。',
            ],
            [
              2,
              '短いTXTは中身を貼る',
              '中身をコピーしてチャットへ貼るのがおすすめです。',
            ],
            [
              3,
              '書式資料は添付する',
              'PDF・Word・Excelは、ファイルのままチャットへ添付します。',
            ],
            [
              4,
              '作業場所を選ぶ',
              '一回の文章づくりはChat、実ファイルを作って何度も直す時はWorkを使います。Workでも貼付と添付ができます。',
            ],
            [
              5,
              '読めない時は渡し方を変える',
              '短文は貼り直し、書式資料は添付へ切り替え、AIに推測させません。',
            ],
            [6, '実在データを混ぜない', NOTICE],
          ],
        ),
        sheet(
          '入っているもの',
          ['FILE_ID', 'フォルダ', 'ファイル名', '内容', 'いつ使う', '注意'],
          fileRows,
        ),
        sheet(
          '課題ファイル',
          ['番号', 'ファイル', '入れ方', '始め方'],
          starterRows,
        ),
        sheet('IDの見方', ['接頭辞', '意味', '例'], idRows),
        sheet(
          'この会社',
          ['会社名', '業種', '対象期間', '拠点', 'データ状態'],
          [
            [
              config.company,
              config.business,
              `${PERIOD_START}〜${PERIOD_END}`,
              config.locations.join(' / '),
              NOTICE,
            ],
          ],
        ),
      ],
    },
    {
      folder: workbookFiles[1][0],
      fileName: workbookFiles[1][1],
      title: `${config.shortName}｜会社・社員・勤怠`,
      sheets: [
        sheet(
          '会社',
          [
            'COMPANY_ID',
            '会社名_架空',
            '事業',
            '対象期間',
            '住所_架空',
            '電話_架空',
            'メール_架空',
            '状態',
          ],
          [
            [
              'CMP-0001',
              config.company,
              config.business,
              `${PERIOD_START}〜${PERIOD_END}`,
              '架空県サンプル市デモ町1-2-3',
              '000-0000-0000',
              'info@example.invalid',
              NOTICE,
            ],
          ],
        ),
        sheet(
          '拠点',
          [
            'LOCATION_ID',
            '拠点名_架空',
            '住所_架空',
            '責任者EMPLOYEE_ID',
            '状態',
          ],
          config.locations.map((name, index) => [
            `LOC-${pad(index + 1, 3)}`,
            name,
            `架空県サンプル市拠点町${index + 1}-1`,
            employeeId(index + 1),
            '稼働中',
          ]),
        ),
        sheet(
          '社員',
          [
            'EMPLOYEE_ID',
            '表示名_架空',
            '拠点',
            '部署',
            '役割',
            '入社日',
            '状態',
            'メール_架空',
            '電話_架空',
            'スキルコード_DEMO',
          ],
          common.employees,
        ),
        sheet(
          '勤怠',
          [
            'ATTENDANCE_ID',
            'EMPLOYEE_ID',
            '日付',
            '出勤',
            '退勤',
            '休憩分',
            '残業分',
            '承認状態',
            'PROJECT_ID',
          ],
          common.attendance,
        ),
      ],
    },
    {
      folder: workbookFiles[2][0],
      fileName: workbookFiles[2][1],
      title: `${config.shortName}｜顧客・営業`,
      sheets: [
        sheet(
          '顧客',
          [
            'CUSTOMER_ID',
            '表示名_架空',
            '年代・区分',
            '住所_架空',
            '電話_架空',
            'メール_架空',
            '登録日',
            '担当EMPLOYEE_ID',
            '状態',
            '連絡希望',
          ],
          common.customers,
        ),
        sheet(
          'やり取り',
          [
            'CONTACT_ID',
            'CUSTOMER_ID',
            '日時',
            '方法',
            '内容要約_架空',
            '次にすること_架空',
            '担当EMPLOYEE_ID',
            '状態',
          ],
          common.contacts,
        ),
        sheet(
          '商談・相談',
          [
            'OPPORTUNITY_ID',
            'CUSTOMER_ID',
            '件名_架空',
            '開始日',
            '見込額_円',
            '段階',
            '担当EMPLOYEE_ID',
            '次回日',
            'PROJECT_ID',
          ],
          common.opportunities,
        ),
      ],
    },
    {
      folder: workbookFiles[3][0],
      fileName: workbookFiles[3][1],
      title: `${config.shortName}｜売上・請求・入金`,
      sheets: [
        sheet(
          '売上',
          [
            'SALES_ID',
            '日付',
            'CUSTOMER_ID',
            'PROJECT_ID',
            '小計_円',
            '値引_円',
            '税_円',
            '合計_円',
            '担当EMPLOYEE_ID',
            '状態',
          ],
          common.sales,
        ),
        sheet(
          '売上明細',
          [
            'SALES_LINE_ID',
            'SALES_ID',
            '項目_架空',
            '数量',
            '単価_円',
            '金額_円',
            '注意',
          ],
          common.salesLines,
          { 5: '=RC[-2]*RC[-1]' },
        ),
        sheet(
          '請求と入金',
          [
            'INVOICE_ID',
            'SALES_ID',
            'CUSTOMER_ID',
            '請求日',
            '支払期限',
            '請求額_円',
            '入金額_円',
            '残額_円',
            '状態',
          ],
          common.invoices,
        ),
      ],
    },
    {
      folder: workbookFiles[4][0],
      fileName: workbookFiles[4][1],
      title: `${config.shortName}｜仕入・取引先・在庫`,
      sheets: [
        sheet(
          '取引先',
          [
            'VENDOR_ID',
            '会社名_架空',
            '区分',
            '電話_架空',
            'メール_架空',
            '支払条件_DEMO',
            '標準納期日',
            '状態',
          ],
          common.vendors,
        ),
        sheet(
          '品目',
          [
            'ITEM_ID',
            '品名_架空',
            '分類',
            '単位',
            'VENDOR_ID',
            '仕入単価_円',
            '発注点',
            '納期日',
          ],
          common.items,
        ),
        sheet(
          '発注',
          [
            'PURCHASE_ORDER_ID',
            'VENDOR_ID',
            '発注日',
            '納期',
            'PROJECT_ID',
            '小計_円',
            '税_円',
            '合計_円',
            '申請EMPLOYEE_ID',
            '状態',
          ],
          common.purchaseOrders,
        ),
        sheet(
          '発注明細',
          [
            'PURCHASE_LINE_ID',
            'PURCHASE_ORDER_ID',
            'ITEM_ID',
            '発注数',
            '単価_円',
            '金額_円',
            '入荷数',
            '照合',
          ],
          common.purchaseLines,
          { 5: '=RC[-2]*RC[-1]' },
        ),
        sheet(
          '在庫の動き',
          [
            'MOVE_ID',
            '日時',
            'ITEM_ID',
            '拠点',
            '種類',
            '数量',
            '参照ID',
            '担当EMPLOYEE_ID',
          ],
          common.inventoryMoves,
        ),
      ],
    },
    {
      folder: workbookFiles[5][0],
      fileName: workbookFiles[5][1],
      title: `${config.shortName}｜経理・予算・月次`,
      sheets: [
        sheet(
          '勘定科目',
          ['ACCOUNT_ID', '科目名', '区分', '注意'],
          common.accounts,
        ),
        sheet(
          '仕訳',
          ['JOURNAL_ID', '日付', '摘要_架空', '種類', '元資料ID', '承認状態'],
          common.journals,
        ),
        sheet(
          '仕訳明細',
          [
            'JOURNAL_LINE_ID',
            'JOURNAL_ID',
            'ACCOUNT_ID',
            '借方_円',
            '貸方_円',
            'PROJECT_ID',
            '部署',
          ],
          common.journalLines,
        ),
        sheet(
          '経費',
          [
            'EXPENSE_ID',
            '日付',
            'EMPLOYEE_ID',
            '費目',
            '内容_架空',
            '金額_円',
            '支払方法_DEMO',
            '領収書ファイル',
            '状態',
          ],
          common.expenses,
        ),
        sheet(
          '予算',
          ['BUDGET_ID', '年月', '部署', 'ACCOUNT_ID', '予算額_円', '版'],
          common.budgets,
        ),
        sheet(
          '月次',
          [
            '年月',
            '売上_円',
            '原価_円',
            '人件費_円',
            'その他経費_円',
            '営業利益_円',
            '状態',
          ],
          common.monthly,
          { 5: '=RC[-4]-RC[-3]-RC[-2]-RC[-1]' },
        ),
      ],
    },
    {
      folder: workbookFiles[6][0],
      fileName: workbookFiles[6][1],
      title: `${config.shortName}｜問い合わせ・電話・ToDo`,
      sheets: [
        sheet(
          '問い合わせ',
          [
            'INQUIRY_ID',
            'CUSTOMER_ID',
            '受付日時',
            '方法',
            '原文要約_架空',
            '担当EMPLOYEE_ID',
            '期限',
            '状態',
            'PROJECT_ID',
          ],
          common.inquiries,
        ),
        sheet(
          '電話の発言',
          ['CALL_ID', 'INQUIRY_ID', '順番', '話者', '発言_架空', '状態'],
          common.callLines,
        ),
        sheet(
          'ToDo',
          [
            'TODO_ID',
            '元種別',
            '元ID',
            '内容_架空',
            '担当EMPLOYEE_ID',
            '期限',
            '優先度',
            '状態',
          ],
          common.todos,
        ),
        sheet(
          'カレンダー候補',
          [
            'EVENT_ID',
            'TODO_ID',
            '件名_架空',
            '開始',
            '終了',
            '担当EMPLOYEE_ID',
            '登録状態',
          ],
          common.calendarEvents,
        ),
      ],
    },
    {
      folder: workbookFiles[7][0],
      fileName: workbookFiles[7][1],
      title: `${config.shortName}｜会議・案件・進捗`,
      sheets: [
        sheet(
          '案件',
          [
            'PROJECT_ID',
            '件名_架空',
            'CUSTOMER_ID',
            '開始予定日',
            '終了予定日',
            '責任者EMPLOYEE_ID',
            '金額目安_円',
            '状態',
            '注意',
          ],
          common.projects,
        ),
        sheet(
          '会議',
          [
            'MEETING_ID',
            '日時',
            '会議名',
            'PROJECT_ID',
            '主催EMPLOYEE_ID',
            '話したこと_架空',
            '状態',
          ],
          common.meetings,
        ),
        sheet(
          '決まったこと',
          [
            'DECISION_ID',
            'MEETING_ID',
            '内容_架空',
            '担当EMPLOYEE_ID',
            '期限',
            '状態',
          ],
          common.decisions,
        ),
        sheet(
          'やること',
          [
            'TASK_ID',
            'PROJECT_ID',
            '内容_架空',
            '担当EMPLOYEE_ID',
            '期限',
            '進捗率',
            '状態',
            'DECISION_ID',
          ],
          common.projectTasks,
        ),
        sheet(
          '気になること',
          [
            'RISK_ID',
            'PROJECT_ID',
            '内容_架空',
            '重要度候補',
            '担当EMPLOYEE_ID',
            '確認日',
            '状態',
          ],
          common.risks,
        ),
      ],
    },
    {
      folder: workbookFiles[8][0],
      fileName: workbookFiles[8][1],
      title: `${config.shortName}｜集客・SNS・Web`,
      sheets: [
        sheet(
          'キャンペーン',
          [
            'CAMPAIGN_ID',
            '名称_架空',
            '目的',
            '開始日',
            '終了日',
            '予算_円',
            '状態',
          ],
          common.campaigns,
        ),
        sheet(
          '投稿',
          [
            'POST_ID',
            'CAMPAIGN_ID',
            '媒体',
            '投稿日',
            'テーマ',
            '原稿_架空',
            '権利状態',
            '状態',
          ],
          common.posts,
        ),
        sheet(
          '広告実績',
          [
            'AD_METRIC_ID',
            'CAMPAIGN_ID',
            '日付',
            '費用_円',
            '表示',
            'クリック',
            '問い合わせ',
            '売上候補_円',
          ],
          common.adMetrics,
        ),
        sheet(
          'Web実績',
          ['日付', 'ページ', '閲覧', '平均秒', '問い合わせ', '申込・予約'],
          common.webMetrics,
        ),
      ],
    },
    {
      folder: workbookFiles[9][0],
      fileName: workbookFiles[9][1],
      title: `${config.shortName}｜${domain.story}`,
      sheets: domain.sheets.map(([name, headers, rows, formulas]) =>
        sheet(name, headers, rows, formulas),
      ),
    },
  ];
}

function starterFiles(config) {
  const items = [
    ['01メール.txt', config.starter.email],
    ['02新聞.txt', config.starter.news],
    ['03画像.txt', config.starter.image],
    ['04見積.txt', config.starter.quote],
    ['05資料.txt', config.starter.slides],
    ['06HP.txt', config.starter.website],
    ['07商談.txt', config.starter.call],
    ['08朝新聞.txt', config.starter.morning],
    ['09アプリ.txt', config.starter.app],
    ['10AI安全.txt', config.starter.ops],
  ];
  return items.map(([name, body]) => [
    name,
    `${NOTICE}\n会社：${config.company}\n\n${body}\n\n※これは言い切っていない、練習用の雑なメモです。`,
  ]);
}

function numberFormatForHeader(header) {
  if (/日時$/.test(header) || header === '開始' || header === '終了')
    return 'yyyy-mm-dd hh:mm';
  if (/(円|金額|単価|売上|原価|予算|入金|請求|費用|税|残額)/.test(header))
    return '#,##0';
  if (/(率|進捗)/.test(header)) return '0';
  return null;
}

function applyTargetedSheetLayout(worksheet, definition, sheetDef, totalRows) {
  const dataLastRow = Math.max(5, totalRows);
  const setColumn = (header, { width, wrap = false }) => {
    const columnIndex = sheetDef.headers.indexOf(header);
    if (columnIndex < 0) return;
    const range = worksheet.getRangeByIndexes(0, columnIndex, dataLastRow, 1);
    if (width) range.format.columnWidth = width;
    if (wrap && sheetDef.rows.length > 0) {
      worksheet.getRangeByIndexes(
        4,
        columnIndex,
        sheetDef.rows.length,
        1,
      ).format.wrapText = true;
    }
  };
  const setDataRowHeight = (height) => {
    if (sheetDef.rows.length === 0) return;
    worksheet.getRange(
      `A5:${toColumnName(sheetDef.headers.length - 1)}${totalRows}`,
    ).format.rowHeight = height;
  };

  if (definition.fileName === '00_ファイル早見表.xlsx') {
    if (sheetDef.name === 'IDの見方') {
      // The merged title needs a little more total width than the three short columns provide.
      setColumn('例', { width: 28 });
    } else if (sheetDef.name === 'ここから') {
      setColumn('説明', { width: 34, wrap: true });
      setDataRowHeight(36);
    } else if (sheetDef.name === 'この会社') {
      setColumn('業種', { width: 38, wrap: true });
      setColumn('拠点', { width: 38, wrap: true });
      setColumn('データ状態', { width: 34, wrap: true });
      setDataRowHeight(52);
    } else if (sheetDef.name === '課題ファイル') {
      setColumn('始め方', { width: 36, wrap: true });
      setDataRowHeight(36);
    } else if (sheetDef.name === '入っているもの') {
      setColumn('フォルダ', { width: 36, wrap: true });
      setColumn('内容', { width: 24, wrap: true });
      setColumn('注意', { width: 34, wrap: true });
      setDataRowHeight(36);
    }
  }

  if (
    definition.fileName === '01_会社_社員_勤怠.xlsx' &&
    sheetDef.name === '会社'
  ) {
    setColumn('事業', { width: 38, wrap: true });
    setColumn('状態', { width: 34, wrap: true });
    setDataRowHeight(42);
  }

  if (definition.fileName === '01_会社_社員_勤怠.xlsx') {
    if (sheetDef.name === '拠点') setColumn('拠点名_架空', { width: 24 });
    if (sheetDef.name === '社員') setColumn('拠点', { width: 24 });
  }

  if (definition.fileName === '04_仕入_取引先_在庫.xlsx') {
    if (sheetDef.name === '取引先') setColumn('会社名_架空', { width: 30 });
    if (sheetDef.name === '在庫の動き') setColumn('拠点', { width: 24 });
  }

  if (
    definition.fileName === '06_問い合わせ_電話_ToDo.xlsx' &&
    sheetDef.name === '電話の発言'
  ) {
    setColumn('発言_架空', { width: 36 });
  }

  if (definition.fileName === '07_会議_案件_進捗.xlsx') {
    if (sheetDef.name === '会議') setColumn('状態', { width: 26 });
    if (sheetDef.name === '決まったこと') setColumn('内容_架空', { width: 28 });
    if (sheetDef.name === '気になること') setColumn('内容_架空', { width: 24 });
  }

  if (
    definition.fileName === '08_集客_SNS_Web.xlsx' &&
    sheetDef.name === 'キャンペーン'
  ) {
    setColumn('名称_架空', { width: 28 });
  }

  if (definition.fileName === '09_業種別業務.xlsx') {
    if (sheetDef.name === '賃貸契約') setColumn('注意', { width: 24 });
    if (sheetDef.name === '申込') setColumn('不足_架空', { width: 24 });
    if (sheetDef.name === '修繕') {
      setColumn('内容_架空', { width: 24 });
      setColumn('人の判断', { width: 22 });
    }
    if (sheetDef.name === '安全記録') setColumn('人の判断', { width: 24 });
    if (sheetDef.name === '施術メモ') {
      setColumn('要望_架空', { width: 26 });
      setColumn('取扱', { width: 18 });
    }
  }
}

async function buildWorkbook(config, definition, packageRoot, qaRoot) {
  const workbook = Workbook.create();
  const report = {
    file: path.join(definition.folder, definition.fileName),
    sheets: [],
    rows: 0,
    formulaErrors: [],
  };

  for (const sheetDef of definition.sheets) {
    const worksheet = workbook.worksheets.add(sheetDef.name.slice(0, 31));
    const columnCount = sheetDef.headers.length;
    const lastColumn = toColumnName(columnCount - 1);
    const totalRows = sheetDef.rows.length + 4;
    worksheet.showGridLines = false;
    worksheet.getRange(`A1:${lastColumn}1`).merge();
    worksheet.getRange('A1').values = [[definition.title]];
    worksheet.getRange(`A2:${lastColumn}2`).merge();
    worksheet.getRange('A2').values = [[`${NOTICE}｜基準日 ${GENERATED_AT}`]];
    worksheet.getRangeByIndexes(
      3,
      0,
      sheetDef.rows.length + 1,
      columnCount,
    ).values = [sheetDef.headers, ...sheetDef.rows];

    if (sheetDef.formulas && sheetDef.rows.length > 0) {
      for (const [columnIndexText, formula] of Object.entries(
        sheetDef.formulas,
      )) {
        const columnIndex = Number(columnIndexText);
        const columnName = toColumnName(columnIndex);
        worksheet.getRange(`${columnName}5`).formulasR1C1 = [[formula]];
        if (sheetDef.rows.length > 1) {
          worksheet
            .getRange(`${columnName}5:${columnName}${totalRows}`)
            .fillDown();
        }
      }
    }

    const title = worksheet.getRange(`A1:${lastColumn}1`);
    title.format.fill = '#102A36';
    title.format.font = {
      bold: true,
      color: '#FFFFFF',
      size: 15,
      name: 'Yu Gothic',
    };
    title.format.rowHeight = 30;
    title.format.verticalAlignment = 'center';

    const notice = worksheet.getRange(`A2:${lastColumn}2`);
    notice.format.fill = '#FFF0EC';
    notice.format.font = {
      bold: true,
      color: '#8A382D',
      size: 9,
      name: 'Yu Gothic',
    };
    notice.format.rowHeight = 23;

    const header = worksheet.getRange(`A4:${lastColumn}4`);
    header.format.fill = config.theme;
    header.format.font = {
      bold: true,
      color: '#FFFFFF',
      size: 9,
      name: 'Yu Gothic',
    };
    header.format.wrapText = true;
    header.format.rowHeight = 30;
    header.format.borders = { preset: 'all', style: 'thin', color: '#DCE3E5' };

    const body = worksheet.getRange(
      `A5:${lastColumn}${Math.max(5, totalRows)}`,
    );
    body.format.font = { color: '#17212B', size: 9, name: 'Yu Gothic' };
    body.format.rowHeight = 19;
    body.format.verticalAlignment = 'center';

    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const sample = sheetDef.rows
        .slice(0, 120)
        .map((row) => String(row[columnIndex] ?? ''));
      const width = Math.min(
        34,
        Math.max(
          10,
          sheetDef.headers[columnIndex].length * 1.8,
          ...sample.map((value) => Math.min(30, value.length * 1.15)),
        ),
      );
      worksheet.getRangeByIndexes(
        0,
        columnIndex,
        Math.max(5, totalRows),
        1,
      ).format.columnWidth = width;
      const format = numberFormatForHeader(sheetDef.headers[columnIndex]);
      if (format && sheetDef.rows.length > 0) {
        worksheet.getRangeByIndexes(
          4,
          columnIndex,
          sheetDef.rows.length,
          1,
        ).format.numberFormat = format;
      }
    }
    applyTargetedSheetLayout(worksheet, definition, sheetDef, totalRows);
    worksheet.freezePanes.freezeRows(4);

    const previewRows = Math.min(totalRows, 28);
    const preview = await workbook.render({
      sheetName: worksheet.name,
      range: `A1:${lastColumn}${previewRows}`,
      scale: 1,
      format: 'png',
    });
    const previewDir = path.join(
      qaRoot,
      definition.fileName.replace(/\.xlsx$/i, ''),
    );
    await fs.mkdir(previewDir, { recursive: true });
    const previewPath = path.join(previewDir, `${worksheet.name}.png`);
    await fs.writeFile(
      previewPath,
      new Uint8Array(await preview.arrayBuffer()),
    );

    report.rows += sheetDef.rows.length;
    report.sheets.push({
      name: worksheet.name,
      rows: sheetDef.rows.length,
      columns: columnCount,
      preview: path.relative(BUILD_ROOT, previewPath),
    });
  }

  const formulaErrors = await workbook.inspect({
    kind: 'match',
    searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
    options: { useRegex: true, maxResults: 300 },
    maxChars: 6000,
  });
  report.formulaErrors = formulaErrors.ndjson
    ? formulaErrors.ndjson.trim().split('\n').filter(Boolean)
    : [];

  const outputDir = path.join(packageRoot, definition.folder);
  await fs.mkdir(outputDir, { recursive: true });
  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(path.join(outputDir, definition.fileName));
  return report;
}

async function buildIndustry(config) {
  const industryBuildRoot = path.join(BUILD_ROOT, config.key);
  const packageRoot = path.join(industryBuildRoot, config.rootName);
  const qaRoot = path.join(BUILD_ROOT, 'qa/xlsx', config.key);
  await fs.rm(industryBuildRoot, { recursive: true, force: true });
  await fs.rm(qaRoot, { recursive: true, force: true });
  await fs.mkdir(packageRoot, { recursive: true });
  await fs.mkdir(path.join(packageRoot, '課題'), { recursive: true });
  await fs.mkdir(path.join(packageRoot, '99_データ辞書'), { recursive: true });

  for (const [fileName, content] of starterFiles(config)) {
    await fs.writeFile(
      path.join(packageRoot, '課題', fileName),
      `${content}\n`,
      'utf8',
    );
  }

  const common = buildCommonData(config);
  const domain = buildDomainData(config, common);
  const definitions = workbookDefinitions(config, common, domain);
  const workbookReports = [];
  for (const definition of definitions) {
    workbookReports.push(
      await buildWorkbook(config, definition, packageRoot, qaRoot),
    );
  }

  const summary = {
    datasetVersion: VERSION,
    generatedAt: GENERATED_AT,
    notice: NOTICE,
    industry: config.key,
    company: config.company,
    shortName: config.shortName,
    business: config.business,
    period: { start: PERIOD_START, end: PERIOD_END },
    packageRoot,
    zipBase: config.zipBase,
    rootName: config.rootName,
    starterFiles: starterFiles(config).map(([name]) => `課題/${name}`),
    workbookReports,
    workbookCount: workbookReports.length,
    workbookSheetCount: workbookReports.reduce(
      (sum, report) => sum + report.sheets.length,
      0,
    ),
    workbookDataRows: workbookReports.reduce(
      (sum, report) => sum + report.rows,
      0,
    ),
    expectedDocxCount: 30,
    expectedPdfCount: 100,
    idRules: [
      '人物名はデモ社員・デモ顧客の連番だけを使用',
      '住所は架空県・サンプル市・デモ町だけを使用',
      'メールはexample.invalidだけを使用',
      '電話は000番号だけを使用',
      '契約・法務・税務・安全の最終判断は人が行う',
    ],
  };
  await fs.writeFile(
    path.join(industryBuildRoot, 'dataset-summary.json'),
    `${JSON.stringify(summary, null, 2)}\n`,
    'utf8',
  );
  return summary;
}

await fs.mkdir(BUILD_ROOT, { recursive: true });
const summaries = [];
for (const config of industries) {
  console.log(`[demo-data] building ${config.key}`);
  summaries.push(await buildIndustry(config));
  console.log(`[demo-data] finished ${config.key}`);
}

const manifest = {
  version: VERSION,
  generatedAt: GENERATED_AT,
  buildRoot: BUILD_ROOT,
  packages: summaries.map((summary) => ({
    industry: summary.industry,
    company: summary.company,
    rootName: summary.rootName,
    zipBase: summary.zipBase,
    workbooks: summary.workbookCount,
    sheets: summary.workbookSheetCount,
    dataRows: summary.workbookDataRows,
    docxExpected: summary.expectedDocxCount,
    pdfExpected: summary.expectedPdfCount,
  })),
};
await fs.writeFile(
  path.join(BUILD_ROOT, 'xlsx-build-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8',
);

const digest = crypto
  .createHash('sha256')
  .update(JSON.stringify(manifest))
  .digest('hex');
console.log(`[demo-data] xlsx complete sha256=${digest}`);
