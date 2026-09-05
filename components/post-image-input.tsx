'use client';
import { useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import { withSiteBasePath } from '@/lib/site-paths';
export function PostImageInput({
  value,
  onChange,
  onBusy,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function select(e: ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    setError('');
    if (
      file.size > 12000000 ||
      !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
    ) {
      setError(
        '12MB以下の写真・スクリーンショット（PNG・JPEG・WebP）を選んでください。',
      );
      return;
    }
    setBusy(true);
    onBusy(true);
    try {
      const bitmap = await createImageBitmap(file);
      const ratio = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
      canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
      const context = canvas.getContext('2d');
      if (!context) throw Error('画像を読み取れませんでした。');
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      let blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );
      if (blob && blob.size > 1400000) {
        const small = document.createElement('canvas');
        const scale = Math.min(0.75, Math.sqrt(1000000 / blob.size));
        small.width = Math.max(1, Math.round(canvas.width * scale));
        small.height = Math.max(1, Math.round(canvas.height * scale));
        small
          .getContext('2d')!
          .drawImage(canvas, 0, 0, small.width, small.height);
        blob = await new Promise<Blob | null>((resolve) =>
          small.toBlob(resolve, 'image/png'),
        );
      }
      if (!blob || blob.size > 1500000)
        throw Error('画像が大きすぎます。小さな画像でお試しください。');
      const r = await fetch(withSiteBasePath('/api/community/media'), {
        method: 'POST',
        headers: { 'Content-Type': 'image/png' },
        body: blob,
      });
      const data = (await r.json()) as { id?: string; error?: string };
      if (!r.ok || !data.id)
        throw Error(data.error || '画像を追加できませんでした。');
      onChange(data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : '画像を追加できませんでした。');
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <div className="as-image-input">
      <label className="grid gap-2 font-semibold">
        画像・スクリーンショット（1枚・任意）
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          onChange={select}
        />
      </label>
      <p className="mt-2 text-sm leading-6 text-quiet">
        名前・メール・お客様の情報が写っていないか確認してください。位置情報などは取り除きます。
      </p>
      {busy && <output>画像を準備しています…</output>}
      {value && (
        <div className="mt-3">
          <Image
            src={withSiteBasePath('/media/' + value)}
            alt="公開前の添付画像"
            width={600}
            height={600}
            unoptimized
            className="max-h-72 w-auto rounded-xl object-contain"
          />
          <button
            type="button"
            className="as-text-button"
            disabled={busy}
            onClick={() => onChange(null)}
          >
            この画像を外す
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="as-inline-error">
          {error}
        </p>
      )}
    </div>
  );
}
