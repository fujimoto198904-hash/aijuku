"use client";

import { RotateCcw, ShieldAlert } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";

export default function ReviewError({ reset }: { reset: () => void }) {
  return (
    <main
      className="grid min-h-screen place-items-center bg-paper px-5 text-ink"
      id="main-content"
    >
      <section className="soft-panel w-full max-w-xl border border-rule bg-paper-white p-8 sm:p-10">
        <div className="flex items-center justify-between gap-5">
          <BrandMark className="size-10" />
          <ShieldAlert aria-hidden="true" className="size-6 text-human-coral" />
        </div>
        <h1 className="mt-7 font-mincho text-3xl">
          評価依頼を開けませんでした
        </h1>
        <p className="mt-4 text-sm leading-7 text-quiet">
          一時的な通信エラーの可能性があります。評価リンクや認証情報は画面へ表示していません。
        </p>
        <Button
          className="mt-7"
          onClick={reset}
          type="button"
          variant="outline"
        >
          <RotateCcw aria-hidden="true" className="size-4" />
          もう一度読み込む
        </Button>
      </section>
    </main>
  );
}
