'use client';

/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- 読み取り専用のpreをキーボードでスクロールできるようにする */

import {
  ChevronDown,
  Clipboard,
  Download,
  FileText,
  RefreshCcw,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { demoDataCatalog } from '@/lib/demo-data-catalog';
import type {
  TaskDemoDownloadFile,
  TaskDemoDownloadPlan,
} from '@/lib/textbook-demo-industry';
import { withSiteBasePath } from '@/lib/site-paths';

type TextMaterialsState =
  | { status: 'idle'; data: Record<string, string> }
  | { status: 'loading'; data: Record<string, string> }
  | { status: 'ready'; data: Record<string, string> }
  | { status: 'error'; data: Record<string, string> };

function isCopyableTextFile(file: TaskDemoDownloadFile) {
  return (
    file.originalPath.startsWith('課題/') && file.publicFile.endsWith('.txt')
  );
}

function fileExtension(file: string) {
  const extension = file.includes('.') ? file.split('.').at(-1) : null;
  return extension?.toUpperCase() ?? '資料';
}

async function loadTextMaterials(
  textFiles: readonly TaskDemoDownloadFile[],
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    textFiles.map(async (file) => {
      const response = await fetch(withSiteBasePath(file.publicUrl));
      if (!response.ok) {
        throw new Error(`Material fetch failed: ${response.status}`);
      }
      return [file.assetKey, await response.text()] as const;
    }),
  );
  return Object.fromEntries(entries);
}

type MaterialPreviewProps = {
  downloadPlan: TaskDemoDownloadPlan;
};

/**
 * 課題で必要な資料だけを1件ずつ取得できる。
 * 短いTXTはダウンロードに加え、本文の表示とコピーもできる。
 */
export function MaterialPreview({ downloadPlan }: MaterialPreviewProps) {
  const { files, industry } = downloadPlan;
  const textFiles = useMemo(() => files.filter(isCopyableTextFile), [files]);
  const [materialsState, setMaterialsState] = useState<TextMaterialsState>({
    status: textFiles.length > 0 ? 'loading' : 'idle',
    data: {},
  });
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    if (textFiles.length === 0) return;
    let cancelled = false;
    void loadTextMaterials(textFiles).then(
      (data) => {
        if (!cancelled) setMaterialsState({ status: 'ready', data });
      },
      () => {
        if (!cancelled) setMaterialsState({ status: 'error', data: {} });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [textFiles]);

  if (files.length === 0) return null;

  const selectedPackage = demoDataCatalog.packages.find(
    (item) => item.industry === industry,
  );

  function requestTextMaterials() {
    if (textFiles.length === 0) return;
    setMaterialsState({ status: 'loading', data: {} });
    void loadTextMaterials(textFiles).then(
      (data) => setMaterialsState({ status: 'ready', data }),
      () => setMaterialsState({ status: 'error', data: {} }),
    );
  }

  async function copyMemo(file: TaskDemoDownloadFile) {
    const text = materialsState.data[file.assetKey];
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(
        `「${file.originalPath.split('/').at(-1) ?? file.originalPath}」をコピーしました`,
      );
    } catch {
      setCopyStatus(
        'コピーできませんでした。文字を選択してコピーしてください。',
      );
    }
  }

  return (
    <section
      className="mt-5 border-t border-rule pt-5"
      aria-labelledby="lesson-material-files"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h5 id="lesson-material-files" className="text-sm font-semibold">
            この課題で使うファイル
          </h5>
          <p className="mt-1 text-xs leading-5 text-quiet">
            {downloadPlan.selectionKind === 'proxy' ? '仕事の流れが近い' : ''}
            {selectedPackage?.label ?? '課題に合う会社'}
            の架空データから、必要なものだけ用意しました。
          </p>
        </div>
        <span className="soft-badge border border-success/30 bg-future-mint-soft px-3 py-1.5 text-xs font-semibold text-success">
          {files.length}ファイル
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        {files.map((file) => {
          const text = materialsState.data[file.assetKey];
          const shortName =
            file.originalPath.split('/').at(-1) ?? file.originalPath;
          const isText = isCopyableTextFile(file);
          return (
            <article
              key={file.assetKey}
              className="soft-card overflow-hidden border border-success/30 bg-white"
            >
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <span className="soft-icon grid size-10 shrink-0 place-items-center bg-future-mint-soft text-success">
                  <FileText className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="soft-badge bg-paper px-2 py-1 text-[0.68rem] font-bold tracking-[0.08em] text-rust">
                      {fileExtension(file.publicFile)}
                    </span>
                    <p className="break-words text-sm font-semibold">
                      {shortName}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {isText ? (
                    <button
                      type="button"
                      className="soft-control inline-flex min-h-11 items-center gap-2 border border-success bg-white px-3 text-xs font-semibold text-success hover:bg-success hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => void copyMemo(file)}
                      disabled={!text}
                    >
                      <Clipboard className="size-4" aria-hidden="true" />
                      中身をコピー
                    </button>
                  ) : null}
                  <a
                    className="soft-button inline-flex min-h-11 items-center justify-center gap-2 bg-success px-4 text-xs font-semibold text-white"
                    href={withSiteBasePath(file.publicUrl)}
                    download={shortName}
                  >
                    <Download className="size-4" aria-hidden="true" />
                    ダウンロード
                  </a>
                </div>
              </div>

              {isText && materialsState.status === 'loading' ? (
                <output className="block border-t border-success/20 bg-future-mint-soft px-4 py-3 text-xs leading-6 text-quiet">
                  TXTの中身を読み込んでいます…
                </output>
              ) : null}

              {isText && materialsState.status === 'error' ? (
                <div
                  className="border-t border-human-coral/25 bg-human-coral-soft px-4 py-3"
                  role="alert"
                >
                  <p className="text-xs leading-6 text-quiet">
                    中身だけ表示できませんでした。上の「ダウンロード」は使えます。
                  </p>
                  <button
                    type="button"
                    className="soft-control mt-2 inline-flex min-h-10 items-center gap-2 border border-human-coral bg-white px-3 text-xs font-semibold text-human-coral"
                    onClick={requestTextMaterials}
                  >
                    <RefreshCcw className="size-4" aria-hidden="true" />
                    プレビューを再読み込み
                  </button>
                </div>
              ) : null}

              {isText && text ? (
                <details className="group border-t border-success/20 bg-future-mint-soft">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-xs font-semibold text-success [&::-webkit-details-marker]:hidden">
                    <span>TXTの中身をここで確認</span>
                    <ChevronDown
                      className="size-4 transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <section aria-label={`「${shortName}」の内容`}>
                    <pre
                      className="max-h-56 overflow-y-auto whitespace-pre-wrap border-t border-success/20 bg-white p-4 font-mono text-xs leading-5 text-ink focus:outline-2 focus:outline-offset-2 focus:outline-success"
                      tabIndex={0}
                    >
                      {text}
                    </pre>
                  </section>
                </details>
              ) : null}
            </article>
          );
        })}
      </div>

      <p
        className="mt-3 min-h-5 text-xs font-semibold text-success"
        aria-live="polite"
      >
        {copyStatus}
      </p>
    </section>
  );
}
