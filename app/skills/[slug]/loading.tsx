import { BrandMark } from "@/components/brand-mark";

export default function SkillPassportLoading() {
  return (
    <main
      aria-busy="true"
      className="grid min-h-screen place-items-center bg-paper px-5 text-ink"
      id="main-content"
    >
      <section className="soft-panel w-full max-w-xl border border-rule bg-paper-white p-8 sm:p-10">
        <BrandMark className="size-10 animate-pulse" />
        <p className="mt-7 font-mincho text-3xl">パスポートを確認しています</p>
        <output className="mt-4 block text-sm leading-7 text-quiet">
          本人が共有している成果物と確認記録を読み込んでいます。
        </output>
      </section>
    </main>
  );
}
