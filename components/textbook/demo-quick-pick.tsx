import {
  ArrowDown,
  Download,
  HardHat,
  House,
  Scissors,
  ShieldCheck,
} from 'lucide-react';

import { demoDataCatalog, type DemoIndustry } from '@/lib/demo-data-catalog';
import { withSiteBasePath } from '@/lib/site-paths';
import { DemoDownloadLink } from '@/components/textbook/demo-download-link';

const industryIcons: Record<
  DemoIndustry,
  { Icon: typeof Scissors; label: string; hint: string }
> = {
  salon: { Icon: Scissors, label: '美容室', hint: '予約・接客・売上・SNS' },
  construction: {
    Icon: HardHat,
    label: '建設業',
    hint: '見積・現場・仕入・安全',
  },
  realestate: {
    Icon: House,
    label: '不動産会社',
    hint: '物件・内見・契約・入金',
  },
};

/**
 * 説明を全部読まなくても始められる、練習会社選びの短い導線。
 * 詳しい説明(中身の内訳、展開手順、3分テスト)は下の詳細セクションが担当する。
 */
export function DemoQuickPick() {
  return (
    <section
      className="border-b border-rule bg-paper-white px-5 py-10 sm:px-8 sm:py-14"
      aria-labelledby="demo-quick-heading"
    >
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-rust">
              最初に一度だけ
            </p>
            <h2
              id="demo-quick-heading"
              className="mt-3 font-mincho text-3xl leading-tight sm:text-4xl"
            >
              練習する会社を、ひとつ選ぶ。
            </h2>
          </div>
          <p className="flex items-center gap-2 text-xs leading-6 text-quiet">
            <ShieldCheck className="size-4 text-success" aria-hidden="true" />
            すべて架空の練習用データです。外部への送信はしません。
          </p>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {demoDataCatalog.packages.map((item) => {
            const detail = industryIcons[item.industry];
            const Icon = detail.Icon;
            return (
              <DemoDownloadLink
                key={item.industry}
                className="soft-card soft-interactive group flex items-center gap-4 border border-rule bg-white p-5 hover:border-sapphire"
                href={withSiteBasePath(item.url)}
                file={item.file}
                industry={item.industry}
              >
                <span className="soft-icon grid size-12 shrink-0 place-items-center bg-sapphire-soft">
                  <Icon className="size-6 text-sapphire" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {detail.label}で練習する
                  </span>
                  <span className="mt-1 block truncate text-xs text-quiet">
                    {detail.hint}
                  </span>
                </span>
                <Download
                  className="size-4 shrink-0 text-quiet transition-colors group-hover:text-sapphire"
                  aria-hidden="true"
                />
              </DemoDownloadLink>
            );
          })}
        </div>
        <p className="mt-4 flex flex-wrap items-center gap-2 text-xs leading-5 text-quiet">
          ZIP・各約8MiB。スマホの方は、ZIPなしでも課題ページからメモの中身を直接コピーして始められます。
          <a
            className="inline-flex items-center gap-1 font-semibold text-rust underline decoration-rust/35 underline-offset-4"
            href="#demo-data"
          >
            中身とZIPの開き方を詳しく見る
            <ArrowDown className="size-3" aria-hidden="true" />
          </a>
        </p>
      </div>
    </section>
  );
}
