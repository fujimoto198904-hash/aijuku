'use client';
import { useState, useEffect, type ChangeEvent } from 'react';
import Image from 'next/image';
import { ImagePlus, X } from 'lucide-react';
import { withSiteBasePath } from '@/lib/site-paths';
import { preparePostImage, uploadPostImage } from '@/lib/prepare-post-image';

export function PostImageInput({
  value,
  onChange,
  onBusy,
  purpose = 'post',
  onPrepared,
  disabled = false,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  onBusy: (busy: boolean) => void;
  purpose?: 'post' | 'avatar';
  onPrepared?: (blob: Blob | null) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  async function select(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file || busy || disabled) return;
    setError('');
    setBusy(true);
    onBusy(true);
    try {
      const blob = await preparePostImage(file, purpose);
      if (onPrepared) {
        setPreview(URL.createObjectURL(blob));
        onPrepared(blob);
      } else onChange(await uploadPostImage(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : '画像を追加できませんでした。');
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  const source =
    preview ?? (value ? withSiteBasePath('/media/' + value) : null);
  return (
    <div
      className={
        'as-image-input' +
        (purpose === 'avatar' ? ' as-avatar-input' : ' as-post-image-input')
      }
    >
      <label
        className={
          purpose === 'avatar'
            ? 'grid min-w-0 gap-2 font-semibold'
            : 'as-composer-tool as-photo-picker'
        }
      >
        {purpose === 'avatar' ? (
          'プロフィール写真を変更'
        ) : (
          <>
            <ImagePlus size={20} aria-hidden="true" />
            写真
          </>
        )}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy || disabled}
          onChange={select}
          className={purpose === 'post' ? 'sr-only' : 'max-w-full min-w-0'}
        />
      </label>
      {purpose === 'avatar' && (
        <p className="mt-2 text-sm leading-6 text-quiet">
          写真の中央を丸く表示します。変更は下の保存ボタンで確定します。
        </p>
      )}
      {busy && <output className="text-sm">画像を準備中…</output>}
      {source && (
        <div
          className={
            purpose === 'avatar' ? 'mt-3' : 'as-composer-image-preview'
          }
        >
          <Image
            src={source}
            alt={
              purpose === 'avatar'
                ? 'プロフィール写真のプレビュー'
                : '投稿する写真'
            }
            width={600}
            height={600}
            unoptimized
            className={
              purpose === 'avatar'
                ? 'size-24 rounded-full object-cover'
                : 'max-h-72 w-full rounded-xl object-contain'
            }
          />
          <button
            type="button"
            className="as-text-button"
            disabled={busy || disabled}
            onClick={() => {
              setPreview(null);
              onPrepared?.(null);
              onChange(null);
            }}
          >
            <X size={16} aria-hidden="true" />
            {purpose === 'avatar' ? '写真を削除' : '写真を外す'}
          </button>
          {purpose === 'post' && (
            <p className="text-xs text-quiet">1枚・500KB以下に自動調整</p>
          )}
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
