'use client';
export default function CommunityError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl p-10">
      <h1 className="text-2xl font-bold">投稿を読み込めませんでした。</h1>
      <p className="my-5">しばらくしてから、もう一度お試しください。</p>
      <button
        onClick={reset}
        className="rounded-xl bg-sapphire px-5 py-3 text-white"
      >
        もう一度読み込む
      </button>
    </main>
  );
}
