import {
  CalendarCheck2,
  CalendarX2,
  Clock3,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Video,
} from 'lucide-react';

import { withSiteBasePath } from '@/lib/site-paths';

export type GoogleCalendarConnectionSummary = {
  status: 'active' | 'reconnect_required' | 'disconnected';
  googleEmail: string;
  lastVerifiedAt: number;
};

function formatDate(value: number): string {
  return new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(value));
}

function statusMessage(value: string | undefined): {
  kind: 'success' | 'error';
  text: string;
} | null {
  switch (value) {
    case 'connected':
      return {
        kind: 'success',
        text: 'Googleカレンダーを接続しました。次の申込確定から自動登録されます。',
      };
    case 'disconnected':
      return {
        kind: 'success',
        text: 'Googleカレンダーとの連携を解除しました。すでに作成した予定は残ります。',
      };
    case 'disconnected-local':
      return {
        kind: 'success',
        text: 'サイトからの自動登録を停止し、保存していた許可情報を削除しました。Google側の許可解除は確認できなかったため、必要ならGoogleアカウントの「接続済みアプリ」から解除してください。すでに作成した予定は残ります。',
      };
    case 'wrong-account':
      return {
        kind: 'error',
        text: '指定された藤本さんのGoogleアカウントではありません。アカウントを選び直してください。',
      };
    case 'missing-token':
      return {
        kind: 'error',
        text: '継続利用に必要な許可を受け取れませんでした。もう一度接続してください。',
      };
    case 'oauth-denied':
      return {
        kind: 'error',
        text: 'Googleカレンダーの接続は完了していません。',
      };
    case 'oauth-expired':
      return {
        kind: 'error',
        text: '接続手続きの有効時間が切れました。もう一度始めてください。',
      };
    case 'configuration':
      return {
        kind: 'error',
        text: 'Google連携の設定がまだ完了していません。',
      };
    case 'failed':
      return {
        kind: 'error',
        text: 'Googleカレンダーを接続できませんでした。時間をおいて、もう一度お試しください。',
      };
    default:
      return null;
  }
}

export function GoogleCalendarConnectionCard({
  configured,
  connection,
  result,
}: {
  configured: boolean;
  connection: GoogleCalendarConnectionSummary | null;
  result?: string;
}) {
  const connected = connection?.status === 'active';
  const active = configured && connected;
  const feedback = statusMessage(result);

  return (
    <section
      className="soft-panel mb-12 scroll-mt-24 border border-rule bg-paper-white p-6 sm:p-8"
      id="google-calendar"
    >
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
        <div className="max-w-3xl">
          <p className="flex items-center gap-2 text-xs font-semibold text-sapphire">
            {active ? (
              <CalendarCheck2 className="size-4" aria-hidden="true" />
            ) : (
              <CalendarX2 className="size-4" aria-hidden="true" />
            )}
            Googleカレンダー連携
          </p>
          <h2 className="mt-3 font-mincho text-3xl">
            {active
              ? '藤本さんの予定へ自動登録'
              : connected
                ? 'Google連携の設定を確認する'
                : '本人のカレンダーを接続する'}
          </h2>
          <p className="mt-3 text-sm leading-7 text-quiet">
            申込を確定した時だけ、藤本さんのメインカレンダーへ予定を作ります。受講生を招待せず、受講生のカレンダーには書き込みません。
          </p>
        </div>

        <div className="soft-control min-w-64 border border-rule bg-paper px-5 py-4 text-xs leading-6">
          <p className="flex items-center gap-2 font-semibold">
            <ShieldCheck
              className="size-4 text-future-mint"
              aria-hidden="true"
            />
            {active ? '接続済み' : connected ? '設定確認が必要' : '未接続'}
          </p>
          {connection ? (
            <>
              <p className="mt-2 break-all text-quiet">
                {connection.googleEmail}
              </p>
              <p className="mt-1 text-quiet">
                確認：{formatDate(connection.lastVerifiedAt)}
              </p>
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-7 grid gap-3 md:grid-cols-3">
        <div className="soft-control border border-rule bg-paper p-4">
          <Video className="size-4 text-sapphire" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold">オンライン</p>
          <p className="mt-1 text-xs leading-6 text-quiet">
            50分の予定と、専用のGoogle Meetを作ります。
          </p>
        </div>
        <div className="soft-control border border-rule bg-paper p-4">
          <MapPin className="size-4 text-human-coral" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold">家庭教師型（対面）</p>
          <p className="mt-1 text-xs leading-6 text-quiet">
            2026年10月1日以降、60分の予定を作ります。Meetは付きません。
          </p>
        </div>
        <div className="soft-control border border-rule bg-paper p-4">
          <Clock3 className="size-4 text-future-mint" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold">対面・教科書自習式</p>
          <p className="mt-1 text-xs leading-6 text-quiet">
            月額申込と毎日の来場予約は別です。今回は自動登録の対象外です。
          </p>
        </div>
      </div>

      {feedback ? (
        <p
          className={`soft-control mt-6 border-l-4 p-4 text-xs leading-6 ${feedback.kind === 'success' ? 'border-future-mint bg-future-mint-soft' : 'border-human-coral bg-human-coral-soft'}`}
          role={feedback.kind === 'error' ? 'alert' : 'status'}
        >
          {feedback.text}
        </p>
      ) : null}

      {!configured ? (
        <div className="soft-control mt-6 border border-amber/50 bg-amber/10 p-4 text-xs leading-6">
          Google
          Cloudの接続設定が必要です。設定後、この画面から藤本さん本人が一度だけ許可します。
        </div>
      ) : null}

      {connected ? (
        <details className="mt-6 text-xs text-quiet">
          <summary className="cursor-pointer font-semibold text-quiet">
            連携を解除する
          </summary>
          <div className="soft-control mt-3 border border-human-coral/35 bg-human-coral-soft p-4 leading-6">
            <p>
              自動登録を止め、保存したGoogleの許可情報を削除します。すでに作成した予定は消しません。
            </p>
            <form
              action={withSiteBasePath('/api/admin/google-calendar/disconnect')}
              className="mt-3"
              method="post"
            >
              <button
                className="soft-control inline-flex min-h-10 items-center gap-2 border border-human-coral bg-white px-4 font-semibold text-human-coral"
                type="submit"
              >
                <CalendarX2 className="size-4" aria-hidden="true" />
                連携を解除する
              </button>
            </form>
          </div>
        </details>
      ) : configured ? (
        <form
          action={withSiteBasePath('/api/admin/google-calendar/connect')}
          className="mt-6"
          method="post"
        >
          <button
            className="soft-button button-glow inline-flex min-h-12 items-center gap-2 bg-sapphire px-5 text-sm font-semibold text-white"
            type="submit"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            {connection?.status === 'reconnect_required'
              ? 'Googleへ再接続する'
              : 'Googleカレンダーを接続する'}
          </button>
        </form>
      ) : null}
    </section>
  );
}
