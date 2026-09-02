import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { BrandMark } from "@/components/brand-mark";
import { MembershipOnboardingForm } from "@/components/membership-onboarding-form";
import Link from "@/components/site-link";
import { getMember, hasCurrentMembershipConsent } from "@/db/membership";
import { canonicalMemberUrl, isVercelRuntime } from "@/lib/site-runtime";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "無料会員登録｜藤本実学塾",
  robots: { index: false, follow: false },
};

export default async function MembershipOnboardingPage() {
  if (isVercelRuntime()) {
    redirect(canonicalMemberUrl("/mypage/onboarding"));
  }
  const user = await requireChatGPTUser("/mypage/onboarding");
  const member = await getMember(user.userId);
  if (member?.status === "active" && hasCurrentMembershipConsent(member)) {
    redirect("/mypage");
  }
  if (member?.status === "suspended") {
    return (
      <main
        id="main-content"
        className="grid min-h-screen place-items-center bg-paper px-5 text-ink"
      >
        <section className="soft-panel w-full max-w-xl border border-rule bg-paper-white p-8 sm:p-10">
          <ShieldAlert className="size-7 text-human-coral" aria-hidden="true" />
          <h1 className="mt-6 font-mincho text-3xl">
            この会員登録は停止中です
          </h1>
          <p className="mt-4 text-sm leading-7 text-quiet">
            画面上では再開できません。登録メールアドレスから info@mon-ai.jp
            へご連絡ください。電話受付は行いません。
          </p>
        </section>
      </main>
    );
  }
  if (member?.status === "withdrawn") {
    return (
      <main
        id="main-content"
        className="grid min-h-screen place-items-center bg-paper px-5 text-ink"
      >
        <section className="soft-panel w-full max-w-xl border border-rule bg-paper-white p-8 sm:p-10">
          <ShieldAlert className="size-7 text-human-coral" aria-hidden="true" />
          <h1 className="mt-6 font-mincho text-3xl">
            この会員登録は退会済みです
          </h1>
          <p className="mt-4 text-sm leading-7 text-quiet">
            以前の同意だけで自動的に再登録することはありません。再登録を希望する場合は、登録メールアドレスから
            info@mon-ai.jp へご連絡ください。電話受付は行いません。
          </p>
        </section>
      </main>
    );
  }

  const isConsentUpdate = Boolean(member);
  const defaultName =
    member?.displayName || user.fullName?.trim() || user.email.split("@")[0];

  return (
    <main
      id="main-content"
      className="min-h-screen bg-paper px-5 py-10 text-ink sm:px-8 sm:py-16"
    >
      <div className="soft-panel soft-panel-clip mx-auto grid w-full max-w-[1080px] border border-rule bg-paper-white lg:grid-cols-[0.78fr_1.22fr]">
        <section className="bg-brand-dark p-8 text-white sm:p-10 lg:p-12">
          <Link
            className="flex items-center gap-3 font-mincho text-xl"
            href="/"
          >
            <BrandMark framed />
            藤本実学塾
          </Link>
          <p className="mt-14 text-xs font-semibold tracking-[0.16em] text-future-mint">
            FREE MEMBERSHIP
          </p>
          <h1 className="text-soft-glow mt-5 font-mincho text-4xl leading-tight">
            {isConsentUpdate ? "同意内容を、" : "無料会員登録を、"}
            <br />
            {isConsentUpdate ? "更新します。" : "完了します。"}
          </h1>
          <ol className="mt-10 grid gap-5 text-sm text-white/70">
            <li className="border-t border-white/15 pt-4">
              01　お名前とメールを確認
            </li>
            <li className="border-t border-white/15 pt-4">
              02　利用目的と規約を確認
            </li>
            <li className="border-t border-white/15 pt-4">
              03　マイページから受講申込
            </li>
          </ol>
        </section>

        <section className="p-7 sm:p-10 lg:p-12">
          <p className="text-xs font-semibold tracking-[0.14em] text-sapphire">
            ACCOUNT SETUP
          </p>
          <h2 className="mt-4 font-mincho text-3xl">
            {isConsentUpdate ? "現行規約の確認" : "登録内容の確認"}
          </h2>
          <p className="mt-4 text-sm leading-7 text-quiet">
            {isConsentUpdate
              ? "AI実学パスポートと第三者評価に対応した現行版を確認し、同意日時を更新します。"
              : "ここで無料会員が成立します。受講申込と有料契約は、登録後に別途選びます。"}
          </p>
          <MembershipOnboardingForm
            defaultName={defaultName}
            email={user.email}
            isConsentUpdate={isConsentUpdate}
          />
        </section>
      </div>
    </main>
  );
}
