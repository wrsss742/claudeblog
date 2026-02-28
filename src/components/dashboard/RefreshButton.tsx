"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "refreshing" | "done">("idle");

  async function handleRefresh() {
    setStatus("refreshing");
    try {
      await fetch("/api/revalidate", { method: "POST" });
      startTransition(() => {
        router.refresh();
      });
      setStatus("done");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("idle");
    }
  }

  const isLoading = isPending || status === "refreshing";

  return (
    <button
      onClick={handleRefresh}
      disabled={isLoading}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
    >
      <svg
        className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      {isLoading ? "更新中..." : status === "done" ? "完了!" : "手動更新"}
    </button>
  );
}
