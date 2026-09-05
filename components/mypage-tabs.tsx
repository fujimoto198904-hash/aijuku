'use client';
import { useEffect, useState, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
const items = [
  ['posts', '投稿'],
  ['saved', '保存済み'],
  ['learning', '学習'],
  ['skills', '作ったもの'],
  ['account', '設定'],
] as const;
export function MypageTabs({
  initial = 'posts',
  panels,
}: {
  initial?: string;
  panels: Record<string, React.ReactNode>;
}) {
  const [tab, setTab] = useState(initial);
  const pendingAnchor = useRef<string | null>(null);
  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.slice(1);
      if (items.some(([key]) => key === hash)) {
        pendingAnchor.current = hash;
        setTab(hash);
      }
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  useEffect(() => {
    const target = pendingAnchor.current;
    if (!target) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(target)?.scrollIntoView({ block: 'start' });
      pendingAnchor.current = null;
    });
    return () => cancelAnimationFrame(frame);
  }, [tab]);
  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        const key = String(value);
        setTab(key);
        window.history.replaceState(null, '', '#' + key);
      }}
      className="as-mypage-tabs"
    >
      <TabsList
        variant="line"
        className="as-profile-tabs"
        aria-label="自分の記録"
      >
        {items.map(([key, label]) => (
          <TabsTrigger key={key} value={key}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map(([key]) => (
        <TabsContent
          key={key}
          id={key === 'posts' || key === 'saved' ? key : undefined}
          value={key}
          keepMounted
          className="as-mypage-panel"
        >
          {panels[key]}
        </TabsContent>
      ))}
    </Tabs>
  );
}
