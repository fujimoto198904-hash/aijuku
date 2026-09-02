import { LoaderCircle, ShieldCheck } from "lucide-react";

export default function AdminLoading() {
  return (
    <main
      id="main-content"
      className="grid min-h-screen place-items-center bg-paper px-5 text-ink"
    >
      <div className="soft-panel flex w-full max-w-md flex-col items-center border border-rule bg-paper-white p-9 text-center">
        <ShieldCheck className="size-10 text-sapphire" aria-hidden="true" />
        <LoaderCircle
          className="mt-6 size-6 animate-spin text-sapphire"
          aria-hidden="true"
        />
        <p className="mt-4 font-mincho text-2xl">
          運営キューを読み込んでいます
        </p>
      </div>
    </main>
  );
}
