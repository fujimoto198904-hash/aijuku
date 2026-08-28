'use client';

import { Check, Clock3, Lightbulb, Sparkles } from 'lucide-react';
import { useState } from 'react';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { featuredMissions } from '@/lib/site-content';

export function MissionExplorer() {
  const [activeIndex, setActiveIndex] = useState(0);
  const mission = featuredMissions[activeIndex];

  return (
    <div className="grid gap-4 lg:grid-cols-[330px_1fr]">
      <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0" role="list" aria-label="代表ミッション">
        {featuredMissions.map((item, index) => (
          <button
            key={item.level}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`group min-w-[245px] rounded-2xl border p-4 text-left transition lg:min-w-0 ${
              index === activeIndex
                ? 'border-ink bg-ink text-ivory shadow-[0_16px_36px_rgba(8,16,25,0.16)]'
                : 'border-ink/10 bg-white/55 text-ink hover:-translate-y-0.5 hover:border-ink/25 hover:bg-white'
            }`}
            aria-pressed={index === activeIndex}
          >
            <div className="flex items-center justify-between">
              <span className={`font-mono text-xs font-bold ${index === activeIndex ? 'text-cyan' : 'text-coral'}`}>
                LV.{item.level}
              </span>
              <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${index === activeIndex ? 'bg-white/10 text-ivory/60' : 'bg-ink/5 text-ink/55'}`}>
                {item.category}
              </span>
            </div>
            <p className="mt-2 text-sm font-bold leading-6">{item.shortTitle}</p>
            <div className={`mt-3 flex items-center gap-1.5 text-[11px] ${index === activeIndex ? 'text-ivory/45' : 'text-ink/45'}`}>
              <Clock3 className="size-3" aria-hidden="true" />
              {item.time}
              <span aria-hidden="true">·</span>
              {item.plan}
            </div>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[28px] border border-ink/10 bg-white shadow-[0_22px_70px_rgba(8,16,25,0.08)]">
        <div className="border-b border-ink/8 bg-ink px-5 py-6 text-ivory sm:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-cyan">MISSION {mission.level}</span>
            <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-ivory/55">
              {mission.plan}
            </span>
          </div>
          <h3 className="mt-3 max-w-[760px] text-xl font-black leading-8 sm:text-2xl">
            {mission.title}
          </h3>
          <p className="mt-3 max-w-[780px] text-sm leading-7 text-ivory/60">
            {mission.problem}
          </p>
        </div>

        <Tabs defaultValue="prompt" className="p-5 sm:p-8">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl bg-ink/5 p-1">
            <TabsTrigger className="min-h-10 rounded-lg px-2 text-xs sm:text-sm" value="prompt">
              プロンプト例
            </TabsTrigger>
            <TabsTrigger className="min-h-10 rounded-lg px-2 text-xs sm:text-sm" value="tips">
              良くするコツ
            </TabsTrigger>
            <TabsTrigger className="min-h-10 rounded-lg px-2 text-xs sm:text-sm" value="uses">
              日常への応用
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prompt" className="mt-5">
            <div className="relative rounded-2xl bg-[#0d1721] p-5 text-sm leading-7 text-ivory/80 sm:p-6">
              <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3 font-mono text-[10px] tracking-[0.14em] text-cyan">
                <Sparkles className="size-3.5" aria-hidden="true" />
                IDEAL PROMPT
              </div>
              <p>{mission.prompt}</p>
            </div>
          </TabsContent>

          <TabsContent value="tips" className="mt-5">
            <ul className="grid gap-3">
              {mission.tips.map((tip) => (
                <li key={tip} className="flex items-start gap-3 rounded-2xl bg-amber/12 p-4 text-sm leading-6">
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-[#b77813]" aria-hidden="true" />
                  {tip}
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="uses" className="mt-5">
            <ul className="grid gap-3 sm:grid-cols-3">
              {mission.uses.map((use) => (
                <li key={use} className="rounded-2xl border border-ink/10 bg-ivory/65 p-4 text-sm font-bold leading-6">
                  <Check className="mb-3 size-4 text-coral" aria-hidden="true" />
                  {use}
                </li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
