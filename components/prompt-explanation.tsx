import { Lightbulb } from 'lucide-react';

type PromptExplanationProps = {
  reason: string;
  advice: string;
};

export function PromptExplanation({ reason, advice }: PromptExplanationProps) {
  return (
    <aside
      aria-label="このプロンプトの解説"
      className="mt-3 flex items-start gap-3 rounded-r-2xl border-l-2 border-deep-green/25 bg-paper/60 px-4 py-3"
    >
      <span
        aria-hidden="true"
        className="grid size-8 shrink-0 place-items-center rounded-full bg-future-mint-soft text-deep-green"
      >
        <Lightbulb className="size-4" />
      </span>
      <div className="min-w-0 text-xs leading-6 text-quiet">
        <p>
          <span className="font-semibold text-deep-green">
            このプロンプトのねらい：
          </span>{' '}
          {reason}
        </p>
        <p className="mt-1">
          <span className="font-semibold text-rust">ワンポイント：</span>{' '}
          {advice}
        </p>
      </div>
    </aside>
  );
}
