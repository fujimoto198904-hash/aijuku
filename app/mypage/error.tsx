"use client";

import { CircleAlert, RotateCcw } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";

export default function MyPageError({ reset }: { reset: () => void }) {
  return (
    <main
      id="main-content"
      className="grid min-h-screen place-items-center bg-paper px-5 text-ink"
    >
      <section className="soft-panel w-full max-w-xl border border-rule bg-paper-white p-8 sm:p-10">
        <div className="flex items-center justify-between gap-4">
          <BrandMark className="size-11" />
          <CircleAlert className="size-7 text-human-coral" aria-hidden="true" />
        </div>
        <h1 className="mt-6 font-mincho text-3xl">読み込みに失敗しました</h1>
        <p className="mt-4 text-sm leading-7 text-quiet">
          一時的な通信またはデータ保存基盤の問題が考えられます。再試行しても直らない場合は、登録メールアドレスから
          info@mon-ai.jp へご連絡ください。電話受付は行いません。
        </p>
        <Button
          className="mt-7 min-h-11 bg-sapphire text-white"
          onClick={reset}
          type="button"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          再試行する
        </Button>
      </section>
    </main>
  );
}
