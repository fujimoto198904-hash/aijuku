'use client';

import { useEffect, useState, type ReactNode } from 'react';

import type { DemoIndustry } from '@/lib/demo-data-catalog';

const STORAGE_KEY = 'aijuku-demo-industry';
const CHANGE_EVENT = 'aijuku-demo-industry-change';

type DemoDownloadLinkProps = {
  children: ReactNode;
  className: string;
  file: string;
  href: string;
  industry: DemoIndustry;
};

function selectedIndustryFromPage(): DemoIndustry | null {
  const fromUrl = new URL(window.location.href).searchParams.get('demo');
  if (
    fromUrl === 'salon' ||
    fromUrl === 'construction' ||
    fromUrl === 'realestate'
  ) {
    return fromUrl;
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'salon' ||
      stored === 'construction' ||
      stored === 'realestate'
      ? stored
      : null;
  } catch {
    return null;
  }
}

/**
 * ZIP取得と「この会社で練習する」の選択を同じ操作にする。
 * 選択はこの端末とURLへ残し、本文内の短文プレビューへ即時通知する。
 */
export function DemoDownloadLink({
  children,
  className,
  file,
  href,
  industry,
}: DemoDownloadLinkProps) {
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    const sync = () => setSelected(selectedIndustryFromPage() === industry);
    sync();
    window.addEventListener('popstate', sync);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, [industry]);

  function rememberSelection() {
    try {
      window.localStorage.setItem(STORAGE_KEY, industry);
    } catch {
      // 保存できない環境でも、今回の画面内ではURLとイベントで選択を伝える。
    }
    const url = new URL(window.location.href);
    url.searchParams.set('demo', industry);
    window.history.replaceState(null, '', url);
    window.dispatchEvent(
      new CustomEvent<DemoIndustry>(CHANGE_EVENT, { detail: industry }),
    );
    setSelected(true);
  }

  return (
    <a
      className={`${className} ${selected ? 'ring-2 ring-sapphire ring-offset-2' : ''}`}
      href={href}
      download={file}
      data-demo-selected={selected ? 'true' : 'false'}
      onClick={rememberSelection}
    >
      {children}
      {selected ? (
        <span className="shrink-0 rounded-full bg-sapphire-soft px-2 py-1 text-xs font-semibold text-sapphire">
          選択中
        </span>
      ) : null}
    </a>
  );
}
