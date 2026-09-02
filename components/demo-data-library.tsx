import {
  ArrowDownToLine,
  Check,
  Download,
  FileArchive,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  HardHat,
  House,
  MessageSquareText,
  Scissors,
  ShieldCheck,
} from 'lucide-react';

import {
  demoDataCatalog,
  type DemoDataPackage,
  type DemoIndustry,
} from '@/lib/demo-data-catalog';
import { withSiteBasePath } from '@/lib/site-paths';
import { DemoDownloadLink } from '@/components/textbook/demo-download-link';

const industryDetails: Record<
  DemoIndustry,
  {
    Icon: typeof Scissors;
    eyebrow: string;
    chooseWhen: string;
    rootFolder: string;
    color: string;
    softColor: string;
  }
> = {
  salon: {
    Icon: Scissors,
    eyebrow: '美容室',
    chooseWhen: '予約・接客・売上・SNSを試してみたい',
    rootFolder: '美容室デモデータ',
    color: 'text-human-coral',
    softColor: 'bg-human-coral-soft',
  },
  construction: {
    Icon: HardHat,
    eyebrow: '建設業',
    chooseWhen: '見積・現場・仕入・安全記録を試してみたい',
    rootFolder: '建設業デモデータ',
    color: 'text-sapphire',
    softColor: 'bg-sapphire-soft',
  },
  realestate: {
    Icon: House,
    eyebrow: '不動産会社',
    chooseWhen: '物件・内見・契約・入金・修繕を試してみたい',
    rootFolder: '不動産会社デモデータ',
    color: 'text-success',
    softColor: 'bg-future-mint-soft',
  },
};

function fileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
}

function number(value: number) {
  return new Intl.NumberFormat('ja-JP').format(value);
}

function PackageCard({ item }: { item: DemoDataPackage }) {
  const detail = industryDetails[item.industry];
  const Icon = detail.Icon;

  return (
    <article className="soft-card soft-panel-clip soft-interactive flex h-full flex-col border border-rule bg-white">
      <div className={`${detail.softColor} p-6 sm:p-7`}>
        <div className="flex items-start justify-between gap-5">
          <div>
            <p
              className={`text-xs font-semibold tracking-[0.14em] ${detail.color}`}
            >
              {detail.eyebrow}を選ぶ
            </p>
            <h3 className="mt-3 font-mincho text-2xl">{item.label}</h3>
          </div>
          <span className="soft-icon grid size-12 shrink-0 place-items-center border border-current/15 bg-white/70">
            <Icon className={`size-6 ${detail.color}`} aria-hidden="true" />
          </span>
        </div>
        <p className="mt-5 text-sm leading-7 text-quiet">
          {detail.chooseWhen}人におすすめです。
        </p>
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <dl className="grid grid-cols-2 gap-x-5 gap-y-4 text-xs">
          <div>
            <dt className="text-quiet">Excel</dt>
            <dd className="mt-1 font-semibold">
              {item.workbooks}冊・{item.sheets}シート
            </dd>
          </div>
          <div>
            <dt className="text-quiet">データ行</dt>
            <dd className="mt-1 font-semibold">{number(item.dataRows)}行</dd>
          </div>
          <div>
            <dt className="text-quiet">Word</dt>
            <dd className="mt-1 font-semibold">{item.docx}ファイル</dd>
          </div>
          <div>
            <dt className="text-quiet">PDF</dt>
            <dd className="mt-1 font-semibold">{item.pdf}ファイル</dd>
          </div>
        </dl>

        <div className="mt-6 border-y border-rule py-4">
          <p className="flex items-center gap-2 text-xs font-semibold">
            <ShieldCheck className="size-4 text-success" aria-hidden="true" />
            全部、架空の練習用データ
          </p>
          <p className="mt-2 text-xs leading-5 text-quiet">
            すぐ使える雑なメモ10個と、自分の完成品を残すフォルダも入っています。
          </p>
        </div>

        <div className="mt-auto pt-6">
          <DemoDownloadLink
            className="button-glow inline-flex min-h-12 w-full items-center justify-center gap-2 px-5 text-sm font-semibold text-white"
            href={withSiteBasePath(item.url)}
            file={item.file}
            industry={item.industry}
          >
            <Download className="size-4" aria-hidden="true" />
            この会社で練習する
          </DemoDownloadLink>
          <p className="mt-3 text-center text-xs text-quiet">
            ZIP・{fileSize(item.bytes)}・v{item.version}
          </p>
        </div>
      </div>
    </article>
  );
}

export function DemoDataLibrary() {
  return (
    <section
      id="demo-data"
      className="scroll-mt-20 border-b border-rule bg-paper px-5 py-16 sm:px-8 sm:py-24"
    >
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-rust">
              教科書を始める前に、一度だけ
            </p>
            <h2 className="soft-section-heading mt-5 max-w-4xl font-mincho text-[clamp(2.5rem,5vw,5rem)] font-medium leading-[1.12] tracking-[-0.04em]">
              練習する会社を、
              <br />
              ひとつ選びます。
            </h2>
          </div>
          <div className="soft-card border-l-4 border-human-coral bg-paper-white p-6 sm:p-7">
            <p className="text-xs font-semibold tracking-[0.12em] text-human-coral">
              Web教科書は、登録なしで完全無料
            </p>
            <p className="mt-3 font-mincho text-xl leading-8">
              このサイトを教科書に、今日からAIを学び始められます。
            </p>
            <p className="mt-3 text-sm leading-7 text-quiet">
              公開中のすべての課題に詳しい手順があり、資料を自分で用意しなくても大丈夫です。
              顧客、社員、取引先、売上、仕入、経理、電話、会議まで入っています。好きな業種を一つダウンロードすれば、以後の課題は同じ会社の続きとして進みます。
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {demoDataCatalog.packages.map((item) => (
            <PackageCard key={item.industry} item={item} />
          ))}
        </div>

        <div className="soft-panel soft-panel-clip mt-16 border border-rule bg-paper-white">
          <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
            <div className="bg-deep-green p-7 text-white sm:p-10">
              <p className="text-xs font-semibold tracking-[0.14em] text-future-mint">
                最初の準備
              </p>
              <h3 className="mt-5 font-mincho text-3xl leading-tight sm:text-4xl">
                最初は、メモの中身を
                <br />
                貼るだけで大丈夫です。
              </h3>
              <p className="mt-6 text-sm leading-7 text-white/70">
                フォルダの場所やファイル名を、AIへ正確に入力する必要はありません。短いメモは開いて中身をコピーし、ChatGPTへ貼るのがいちばん簡単です。
              </p>
            </div>

            <ol className="grid sm:grid-cols-2">
              {[
                {
                  Icon: ArrowDownToLine,
                  title: '好きな会社をダウンロード',
                  body: 'パソコンの「ダウンロード」フォルダにZIPを保存します。',
                },
                {
                  Icon: FileArchive,
                  title: 'ZIPを展開する',
                  body: 'ZIPを開き、表示された「展開」「解凍」を選びます。Windowsなら右クリック、Macならダブルクリックが目印です。',
                },
                {
                  Icon: FolderOpen,
                  title: '「課題」フォルダを開く',
                  body: '展開した会社フォルダの中から「課題」を開き、「01メール.txt」を開きます。',
                },
                {
                  Icon: MessageSquareText,
                  title: '中身をコピーして貼る',
                  body: 'メモの中身を全部コピーしてChatGPTへ貼り、その下に課題の一言を続けます。',
                },
              ].map(({ Icon, title, body }, index) => (
                <li
                  key={title}
                  className="border-b border-rule p-6 last:border-b-0 sm:p-8 sm:odd:border-r sm:[&:nth-last-child(-n+2)]:border-b-0"
                >
                  <div className="flex items-center justify-between gap-4">
                    <Icon className="size-5 text-rust" aria-hidden="true" />
                    <span className="numeric-text text-xs text-quiet">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <p className="mt-5 text-sm font-semibold">{title}</p>
                  <p className="mt-2 text-xs leading-6 text-quiet">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="soft-card mt-8 border-2 border-success bg-future-mint-soft p-6 sm:p-8">
          <div className="grid gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-success">
                まず3分で、最初の返答を見る
              </p>
              <h3 className="mt-3 font-mincho text-3xl leading-tight">
                雑なメモがメールになるのを、
                <br />
                すぐ試してみます。
              </h3>
              <p className="mt-4 text-sm leading-7 text-quiet">
                「01メール.txt」の中身を入力欄へ貼ってから、下の一言を続けて送ります。
              </p>
            </div>
            <div>
              <p className="soft-control border-l-4 border-success bg-white p-5 font-mono text-xs leading-7 sm:p-6">
                これ、相手に返すメールにして。ちょっと急ぎ。あんまり堅くしないで。まだ送らないで。
              </p>
              <ul className="mt-5 grid gap-3 text-sm leading-7">
                <li className="flex gap-3">
                  <Check
                    className="mt-1 size-4 shrink-0 text-success"
                    aria-hidden="true"
                  />
                  件名と本文がある、送信前のメール下書きができた
                </li>
                <li className="flex gap-3">
                  <Check
                    className="mt-1 size-4 shrink-0 text-success"
                    aria-hidden="true"
                  />
                  メモにない約束や名前が、勝手に足されていない
                </li>
                <li className="flex gap-3">
                  <Check
                    className="mt-1 size-4 shrink-0 text-success"
                    aria-hidden="true"
                  />
                  下書きをコピーして、テキストかWordへ保存し、もう一度開けた
                </li>
              </ul>
              <p className="mt-5 border-t border-success/25 pt-4 text-xs leading-6 text-quiet">
                3分は、メモを貼って最初のメール案を見る目安です。保存して開き直すまでのLv.05全体は5〜10分ほど。ここまでできたら同じ内容を最初からやり直す必要はありません。
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <div className="soft-card border border-rule bg-white p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <MessageSquareText
                className="size-5 text-rust"
                aria-hidden="true"
              />
              <h3 className="font-mincho text-2xl">短いメモを渡す時</h3>
            </div>
            <p className="mt-6 text-sm leading-7 text-quiet">
              中身をコピーして貼るのがおすすめです。ファイル名を打ったり、毎回Workを開いたりしなくて大丈夫です。
            </p>
            <p className="mt-5 border-t border-rule pt-4 text-xs font-semibold leading-6 text-rust">
              メール、新聞、商談、定期発行など、短いメモから始まる課題はこの方法です。
            </p>
          </div>

          <div className="soft-card border border-rule bg-white p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <FileSpreadsheet
                className="size-5 text-sapphire"
                aria-hidden="true"
              />
              <h3 className="font-mincho text-2xl">表や見た目を渡す時</h3>
            </div>
            <p className="mt-6 text-sm leading-7 text-quiet">
              Excel、PDF、Word、画像は、必要なファイルだけをChatGPTの入力欄へドラッグします。難しければクリップやファイル選択から添付します。名前が見えたことを確認してから課題の一言を送ります。
            </p>
            <p className="mt-5 border-t border-rule pt-4 text-xs font-semibold leading-6 text-sapphire">
              見積書の課題では、見積メモの中身を貼り、料金表PDFだけを添付します。
            </p>
          </div>

          <div className="soft-card border border-rule bg-white p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <FolderOpen
                className="size-5 text-human-coral"
                aria-hidden="true"
              />
              <h3 className="font-mincho text-2xl">実ファイルを作る画面</h3>
            </div>
            <p className="mt-6 text-sm leading-7 text-quiet">
              Excel、PowerPoint、ホームページ、アプリなどの実ファイルを作り、何度も直す時はWorkが便利です。Workの入力欄にも、短文を貼ったり資料を添付したりできます。
            </p>
            <p className="mt-5 border-t border-rule pt-4 text-xs font-semibold leading-6 text-human-coral">
              Workが表示されなければ、Chatへ短文を貼り、書式資料だけを添付して進めても構いません。
            </p>
          </div>
        </div>

        <div className="soft-card mt-5 border border-rule bg-paper-white p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div className="flex items-center gap-3">
              <FileText
                className="size-5 text-human-coral"
                aria-hidden="true"
              />
              <h3 className="font-mincho text-2xl">どの環境でも進められます</h3>
            </div>
            <div>
              <p className="text-sm leading-7 text-quiet">
                パソコンでもスマホでも、ブラウザでもデスクトップアプリでも進められます。ZIPは端末に表示された「展開」「解凍」を選びます。WindowsやMacでボタンの名前が少し違っても、課題の中身と完成条件は同じです。
              </p>
              <p className="mt-4 text-xs leading-6 text-quiet">
                Chatや添付で作った物はダウンロードするか、本文をコピーして自分で「完成」フォルダへ保存します。Workで作った物はAIへ保存を頼み、最後は必ずファイル管理画面から実物を開いて確かめます。
              </p>
              <a
                className="mt-5 inline-flex text-xs font-semibold text-rust underline decoration-rust/35 underline-offset-4"
                href="https://learn.chatgpt.com/docs/use-chatgpt"
                target="_blank"
                rel="noreferrer"
              >
                OpenAI公式のChatGPTの使い方を見る
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
