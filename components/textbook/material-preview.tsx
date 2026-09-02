'use client';

/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- 読み取り専用のpreをキーボードでスクロールできるようにする */

import { ChevronDown, Clipboard, Download, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

import { demoDataCatalog, type DemoIndustry } from '@/lib/demo-data-catalog';
import { withSiteBasePath } from '@/lib/site-paths';

const industryLabels: Record<DemoIndustry, string> = {
  salon: '美容室',
  construction: '建設業',
  realestate: '不動産会社',
};

const industryOrder: readonly DemoIndustry[] = [
  'salon',
  'construction',
  'realestate',
];

const demoIndustryChangeEvent = 'aijuku-demo-industry-change';

type MaterialsData = Record<DemoIndustry, Record<string, string>>;

type MaterialsPayload = { materials: MaterialsData };

type MaterialsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: MaterialsData }
  | { status: 'error' };

let materialsPromise: Promise<MaterialsData> | null = null;

function loadMaterials(): Promise<MaterialsData> {
  if (!materialsPromise) {
    materialsPromise = fetch(
      withSiteBasePath('/downloads/demo-data/task-materials.generated.json'),
      { cache: 'no-store' },
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Material fetch failed: ${response.status}`);
        }
        return response.json() as Promise<MaterialsPayload>;
      })
      .then((payload) => payload.materials)
      .catch((error: unknown) => {
        // 失敗したPromiseを保持すると「再読み込み」も同じ失敗を返すためリセットする。
        materialsPromise = null;
        throw error;
      });
  }
  return materialsPromise;
}

function isDemoIndustry(value: unknown): value is DemoIndustry {
  return (
    value === 'salon' || value === 'construction' || value === 'realestate'
  );
}

function readInitialIndustry(): DemoIndustry {
  try {
    const requested = new URL(window.location.href).searchParams.get('demo');
    if (isDemoIndustry(requested)) return requested;

    const stored = window.localStorage.getItem('aijuku-demo-industry');
    if (isDemoIndustry(stored)) return stored;
  } catch {
    /* URLや保存領域を読めない環境では既定の美容室を使う */
  }
  return 'salon';
}

/**
 * 課題/*.txt の短いメモは直接コピーでき、それ以外の資料は
 * 選択中の架空会社ZIPから取得できる。
 */
export function MaterialPreview({ files }: { files: readonly string[] }) {
  const textFiles = files.filter(
    (file) => file.startsWith('課題/') && file.endsWith('.txt'),
  );
  const hasTextFiles = textFiles.length > 0;
  const hasFilesToAttach = files.some((file) => !textFiles.includes(file));
  const [materialsState, setMaterialsState] = useState<MaterialsState>(() =>
    hasTextFiles ? { status: 'loading' } : { status: 'idle' },
  );
  const [industry, setIndustry] = useState<DemoIndustry>('salon');
  const [copyStatus, setCopyStatus] = useState('');
  const [open, setOpen] = useState(hasTextFiles);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) setIndustry(readInitialIndustry());
    });

    function handleIndustryChange(event: Event) {
      if (!(event instanceof CustomEvent)) return;
      if (isDemoIndustry(event.detail)) setIndustry(event.detail);
    }

    window.addEventListener(demoIndustryChangeEvent, handleIndustryChange);
    return () => {
      cancelled = true;
      window.removeEventListener(demoIndustryChangeEvent, handleIndustryChange);
    };
  }, []);

  useEffect(() => {
    if (!hasTextFiles) return;
    let cancelled = false;
    void loadMaterials().then(
      (data) => {
        if (!cancelled) setMaterialsState({ status: 'ready', data });
      },
      () => {
        if (!cancelled) setMaterialsState({ status: 'error' });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [hasTextFiles]);

  if (files.length === 0) return null;

  const selectedPackage = demoDataCatalog.packages.find(
    (item) => item.industry === industry,
  );

  function requestMaterials() {
    if (textFiles.length === 0) return;
    setMaterialsState({ status: 'loading' });
    void loadMaterials().then(
      (data) => setMaterialsState({ status: 'ready', data }),
      () => setMaterialsState({ status: 'error' }),
    );
  }

  function changeIndustry(next: DemoIndustry) {
    setIndustry(next);
    setCopyStatus('');
    try {
      window.localStorage.setItem('aijuku-demo-industry', next);
    } catch {
      /* 保存できない環境では表示中の選択だけを使う */
    }
    const url = new URL(window.location.href);
    url.searchParams.set('demo', next);
    window.history.replaceState(null, '', url);
    window.dispatchEvent(
      new CustomEvent<DemoIndustry>(demoIndustryChangeEvent, { detail: next }),
    );
  }

  async function copyMemo(file: string) {
    if (materialsState.status !== 'ready') return;
    const text = materialsState.data[industry]?.[file];
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(
        `${industryLabels[industry]}の「${file.split('/')[1]}」をコピーしました`,
      );
    } catch {
      setCopyStatus(
        'コピーできませんでした。文字を選択してコピーしてください。',
      );
    }
  }

  return (
    <details
      className="soft-control mt-4 overflow-hidden border border-success/40 bg-future-mint-soft"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-xs font-semibold text-success [&::-webkit-details-marker]:hidden">
        <span>
          {textFiles.length > 0
            ? hasFilesToAttach
              ? 'この課題のTXTと練習用ZIP'
              : 'この課題のTXTをコピー'
            : 'この課題の練習用ZIP'}
        </span>
        <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
      </summary>
      <div className="flex flex-col border-t border-success/25 p-4">
        <p className="text-xs leading-5 text-quiet">
          練習する架空会社を選ぶと、表示する材料が切り替わります。
        </p>
        <fieldset
          className="mt-3 flex flex-wrap gap-2 border-0 p-0"
          aria-label="練習する会社"
        >
          {industryOrder.map((candidate) => (
            <button
              key={candidate}
              type="button"
              aria-pressed={industry === candidate}
              className={`soft-badge border px-3 py-1.5 text-xs font-semibold ${industry === candidate ? 'border-success bg-success text-white' : 'border-rule bg-white text-quiet'}`}
              onClick={() => changeIndustry(candidate)}
            >
              {industryLabels[candidate]}
            </button>
          ))}
        </fieldset>

        {textFiles.length > 0 && materialsState.status === 'loading' ? (
          <output className="mt-4 block text-xs leading-6 text-quiet">
            短いメモを読み込んでいます…
          </output>
        ) : null}

        {textFiles.length > 0 && materialsState.status === 'error' ? (
          <div
            className="mt-4 border border-human-coral/40 bg-human-coral-soft p-4"
            role="alert"
          >
            <p className="text-sm font-semibold text-human-coral">
              短いメモを読み込めませんでした。
            </p>
            <p className="mt-2 text-xs leading-6 text-quiet">
              通信状況を確かめて再読み込みするか、ZIPを取得してメモを開いてください。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="soft-control inline-flex min-h-10 items-center gap-2 border border-human-coral bg-white px-4 text-xs font-semibold text-human-coral"
                onClick={requestMaterials}
              >
                <RefreshCcw className="size-4" aria-hidden="true" />
                メモを再読み込み
              </button>
              {selectedPackage ? (
                <a
                  className="soft-control inline-flex min-h-10 items-center gap-2 border border-rule bg-white px-4 text-xs font-semibold text-deep-green"
                  href={withSiteBasePath(selectedPackage.url)}
                  download={selectedPackage.file}
                >
                  <Download className="size-4" aria-hidden="true" />
                  代わりにZIPを取得
                </a>
              ) : null}
            </div>
          </div>
        ) : null}

        {materialsState.status === 'ready'
          ? textFiles.map((file) => {
              const memo = materialsState.data[industry]?.[file];
              const shortName = file.split('/').at(-1) ?? file;
              return (
                <div key={file} className="mt-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-xs font-semibold">
                      {file}
                    </p>
                    <button
                      type="button"
                      className="soft-control inline-flex min-h-11 shrink-0 items-center gap-1.5 border border-success px-3 text-xs font-semibold text-success hover:bg-success hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => void copyMemo(file)}
                      disabled={!memo}
                    >
                      <Clipboard className="size-3.5" aria-hidden="true" />
                      このTXTをコピー
                    </button>
                  </div>
                  <section
                    aria-label={`${industryLabels[industry]}の「${shortName}」の内容`}
                  >
                    <pre
                      className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap border border-rule bg-white p-3 font-mono text-xs leading-5 text-ink focus:outline-2 focus:outline-offset-2 focus:outline-success"
                      tabIndex={0}
                    >
                      {memo ??
                        'このメモは直接表示できません。上のZIPから開いてください。'}
                    </pre>
                  </section>
                </div>
              );
            })
          : null}
        <p className="mt-2 min-h-4 text-xs text-success" aria-live="polite">
          {copyStatus}
        </p>

        {selectedPackage && hasFilesToAttach ? (
          <div className="soft-card mt-4 border border-success/35 bg-white p-4">
            <p className="text-sm font-semibold">
              {industryLabels[industry]}の練習用ZIP
            </p>
            <p className="mt-2 text-xs leading-6 text-quiet">
              すべて架空の練習データです。必要な資料名は上の「今回使う材料」で確認できます。
            </p>
            <a
              className="soft-button mt-3 inline-flex min-h-11 items-center justify-center gap-2 bg-success px-4 text-xs font-semibold text-white"
              href={withSiteBasePath(selectedPackage.url)}
              download={selectedPackage.file}
            >
              <Download className="size-4" aria-hidden="true" />
              {industryLabels[industry]}のZIPを取得
            </a>
          </div>
        ) : null}
      </div>
    </details>
  );
}
