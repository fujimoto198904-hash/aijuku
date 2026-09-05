import { LoaderCircle } from 'lucide-react';

import { BrandMark } from '@/components/brand-mark';

export default function MyPageLoading() {
  return (
    <main
      id="main-content"
      className="grid min-h-screen place-items-center bg-paper px-5 text-ink"
    >
      <div className="soft-panel flex w-full max-w-md flex-col items-center border border-rule bg-paper-white p-9 text-center">
        <BrandMark className="size-12" />
        <LoaderCircle
          className="mt-6 size-6 animate-spin text-sapphire"
          aria-hidden="true"
        />
        <p className="mt-4 font-mincho text-2xl">マイページを準備しています</p>
        <p className="mt-3 text-sm leading-7 text-quiet">
          学習記録と投稿を読み込んでいます。
        </p>
      </div>
    </main>
  );
}
