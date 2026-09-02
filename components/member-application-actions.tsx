"use client";

import { Ban, RotateCcw } from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { withSiteBasePath } from "@/lib/site-paths";

export function MemberApplicationActions({
  applicationId,
  updatedAt,
}: {
  applicationId: string;
  updatedAt: number;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function cancelApplication() {
    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch(withSiteBasePath("/api/applications"), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          applicationId,
          expectedUpdatedAt: updatedAt,
        }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "申込を取り消せませんでした。");
      }
      setOpen(false);
      setStatus("success");
      setMessage("申込希望を取り消しました。");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "申込を取り消せませんでした。",
      );
    }
  }

  return (
    <div className="mt-4">
      {status === "success" ? (
        <div className="soft-control flex flex-col gap-3 border border-future-mint bg-future-mint-soft p-4 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>{message}</p>
          <Button
            onClick={() => window.location.reload()}
            type="button"
            variant="outline"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            最新状態を表示
          </Button>
        </div>
      ) : (
        <AlertDialog onOpenChange={setOpen} open={open}>
          <AlertDialogTrigger
            render={
              <Button
                className="text-human-coral"
                disabled={status === "sending"}
                type="button"
                variant="outline"
              />
            }
          >
            <Ban className="size-4" aria-hidden="true" />
            申込希望を取り消す
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                この申込希望を取り消しますか？
              </AlertDialogTitle>
              <AlertDialogDescription>
                受付済み・内容確認中の申込だけ、マイページから取り消せます。もう一度申し込む場合は新しい申込になります。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={status === "sending"}>
                戻る
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-human-coral text-white"
                disabled={status === "sending"}
                onClick={cancelApplication}
                type="button"
              >
                {status === "sending" ? "取り消しています…" : "取り消す"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {status === "error" ? (
        <p
          className="soft-control mt-3 border-l-4 border-human-coral bg-human-coral-soft p-4 text-xs leading-6"
          role="alert"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
