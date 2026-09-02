"use client";

import { CircleAlert, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <main
      id="main-content"
      className="grid min-h-screen place-items-center bg-paper px-5 text-ink"
    >
      <section className="soft-panel w-full max-w-xl border border-rule bg-paper-white p-8 sm:p-10">
        <CircleAlert className="size-8 text-human-coral" aria-hidden="true" />
        <h1 className="mt-6 font-mincho text-3xl">
          運営データを読み込めませんでした
        </h1>
        <p className="mt-4 text-sm leading-7 text-quiet">
          更新操作は行われていません。再試行し、直らない場合はデータベース接続と管理者環境変数を確認してください。
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
