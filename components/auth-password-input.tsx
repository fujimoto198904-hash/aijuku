'use client';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function AuthPasswordInput({
  id,
  label = 'パスワード',
  current = false,
}: {
  id: string;
  label?: string;
  current?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          name="password"
          type={visible ? 'text' : 'password'}
          required
          minLength={8}
          maxLength={128}
          autoComplete={current ? 'current-password' : 'new-password'}
          aria-describedby={current ? undefined : id + '-hint'}
          className="min-h-12 pr-14"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? 'パスワードを隠す' : 'パスワードを表示する'}
          aria-pressed={visible}
          className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-xl text-quiet hover:bg-paper focus-visible:outline-2 focus-visible:outline-sapphire"
        >
          {visible ? (
            <EyeOff size={18} aria-hidden="true" />
          ) : (
            <Eye size={18} aria-hidden="true" />
          )}
        </button>
      </div>
      {!current && (
        <p id={id + '-hint'} className="text-xs leading-6 text-quiet">
          8文字以上。誕生日以外のものにしてください。
        </p>
      )}
    </div>
  );
}
