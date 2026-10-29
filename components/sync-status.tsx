"use client";
import Link from "next/link";
import { Cloud, CloudAlert, CloudOff, Loader2 } from "lucide-react";
import { useSyncState, type SyncState } from "@/lib/sync";

export function syncLabel(s: SyncState): string {
  switch (s.status) {
    case "syncing":
      return "同期中…";
    case "synced":
      return "保存済み";
    case "error":
      return "同期エラー";
    default:
      return "この端末のみ";
  }
}

/** Compact header indicator; tapping it opens the sync settings. */
export function SyncStatus() {
  const s = useSyncState();
  const Icon = s.status === "syncing" ? Loader2 : s.status === "synced" ? Cloud : s.status === "error" ? CloudAlert : CloudOff;
  const color = s.status === "synced" ? "var(--status-good)" : s.status === "error" ? "var(--danger)" : "var(--text-muted)";
  const title = s.status === "error" || s.status === "off" ? s.detail : syncLabel(s);
  return (
    <Link href="/settings#sync" title={title} aria-label={`同期の状態：${syncLabel(s)}`} className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color }}>
      <Icon size={16} className={s.status === "syncing" ? "animate-spin" : undefined} />
      <span className="hidden sm:inline">{syncLabel(s)}</span>
    </Link>
  );
}
