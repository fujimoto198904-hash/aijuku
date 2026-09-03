import {
  ChevronDown,
  Download,
  FileArchive,
  HardHat,
  House,
  Scissors,
  ShieldCheck,
} from 'lucide-react';

import {
  demoDataCatalog,
  type DemoDataPackage,
  type DemoIndustry,
} from '@/lib/demo-data-catalog';
import { withSiteBasePath } from '@/lib/site-paths';

const industryDetails: Record<
  DemoIndustry,
  { Icon: typeof Scissors; hint: string }
> = {
  salon: {
    Icon: Scissors,
    hint: '予約・接客・売上・SNSの架空データ',
  },
  construction: {
    Icon: HardHat,
    hint: '見積・現場・仕入・安全記録の架空データ',
  },
  realestate: {
    Icon: House,
    hint: '物件・内見・契約・入金の架空データ',
  },
};

function fileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
}

function PackageCard({ item }: { item: DemoDataPackage }) {
  const detail = industryDetails[item.industry];
  const Icon = detail.Icon;

  return (
    <article className="soft-card flex h-full flex-col border border-rule bg-white p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <span className="soft-icon grid size-11 shrink-0 place-items-center bg-paper text-rust">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="font-mincho text-xl">{item.label}</h3>
          <p className="mt-1 text-xs leading-5 text-quiet">{detail.hint}</p>
        </div>
      </div>
      <a
        className="soft-control mt-5 inline-flex min-h-11 items-center justify-center gap-2 border border-rule px-4 text-xs font-semibold text-deep-green hover:border-sapphire hover:text-sapphire"
        href={withSiteBasePath(item.url)}
        download={item.file}
      >
        <Download className="size-4" aria-hidden="true" />
        会社データ一式をZIPで取得
      </a>
      <p className="mt-2 text-center text-[0.68rem] text-quiet">
        {fileSize(item.bytes)}・v{item.version}
      </p>
    </article>
  );
}

export function DemoDataLibrary() {
  return (
    <section
      id="demo-data"
      className="scroll-mt-20 border-b border-rule bg-paper px-5 py-14 sm:px-8 sm:py-20"
    >
      <div className="mx-auto w-full max-w-[1240px]">
        <div className="soft-panel grid gap-7 border border-success/30 bg-paper-white p-7 sm:p-9 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <span className="soft-icon grid size-14 place-items-center bg-future-mint-soft text-success">
            <Download className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-success">
              練習データ
            </p>
            <h2 className="mt-3 font-mincho text-3xl leading-tight sm:text-4xl">
              必要なファイルは、課題ページから。
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-quiet">
              使う資料だけ表示します。TXTはコピー、ほかのファイルはその場でダウンロードできます。
            </p>
            <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-success">
              <ShieldCheck className="size-4" aria-hidden="true" />
              人物・会社・金額はすべて架空の練習用です。
            </p>
          </div>
        </div>

        <details className="soft-control group mt-6 overflow-hidden border border-rule bg-paper-white">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-5 text-xs font-semibold [&::-webkit-details-marker]:hidden">
            <FileArchive
              className="size-4 shrink-0 text-rust"
              aria-hidden="true"
            />
            <span>会社データをまとめてダウンロード（必要な方のみ）</span>
            <span className="ml-auto hidden text-quiet sm:inline">
              通常は取得不要
            </span>
            <ChevronDown
              className="ml-auto size-4 shrink-0 transition-transform group-open:rotate-180 sm:ml-0"
              aria-hidden="true"
            />
          </summary>
          <div className="border-t border-rule p-5 sm:p-7">
            <p className="text-xs leading-6 text-quiet">
              複数の課題を同じ会社で試したい時だけ使います。通常は必要ありません。
            </p>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {demoDataCatalog.packages.map((item) => (
                <PackageCard key={item.industry} item={item} />
              ))}
            </div>
          </div>
        </details>
      </div>
    </section>
  );
}
