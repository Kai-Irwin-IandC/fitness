"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { NAV_ITEMS, TAB_ITEMS, isActive } from "./nav-items";
import { SyncStatus } from "@/components/sync-status";
import { startSync } from "@/lib/sync";

// ---- パラメータ（ここだけプロジェクトごとに差し替える） ----
const BRAND_NAME = "Kai Health";
const BRAND_SUBTITLE = "健康管理";
// ------------------------------------------------------------

function NavList({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              title={collapsed ? label : undefined}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-[var(--accent-soft)] text-[var(--text-active)]"
                  : "text-[var(--text-nav)] hover:bg-[var(--surface-control-hover)]"
              } ${collapsed ? "justify-center px-0" : ""}`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed ? <span className="truncate">{label}</span> : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Mobile only: thumb-reachable tabs, since the gym log is used one-handed on the iPhone. */
function BottomTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="メインメニュー"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--card-border)] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {TAB_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
                  active ? "text-[var(--accent-strong)]" : "text-[var(--text-muted)]"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const desktopSidebarWidth = isSidebarCollapsed ? "lg:pl-[88px]" : "lg:pl-[290px]";
  const pathname = usePathname();
  const pageLabel = NAV_ITEMS.find((n) => isActive(pathname, n.href))?.label ?? "";

  useEffect(() => startSync(), []);

  return (
    <div className="min-h-screen">
      {/* デスクトップ：折りたたみサイドバー */}
      <aside
        className={`fixed left-0 top-0 z-40 hidden h-full border-r border-[var(--border-soft)] bg-white px-2 pb-4 pt-3 shadow-[var(--shadow-sidebar)] transition-[width] duration-200 lg:flex lg:flex-col ${
          isSidebarCollapsed ? "w-[88px]" : "w-[290px]"
        }`}
      >
        <div className="mb-2 flex items-center justify-between px-2">
          {!isSidebarCollapsed ? (
            <div>
              <p className="text-[18px] font-semibold leading-none text-[var(--text-brand)]">{BRAND_NAME}</p>
              <p className="pt-1 text-[10px] font-medium text-[var(--text-muted)]">{BRAND_SUBTITLE}</p>
            </div>
          ) : (
            <div />
          )}
          <button
            type="button"
            aria-label={isSidebarCollapsed ? "メニューを展開" : "メニューを折りたたむ"}
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className="ui-icon-button h-9 w-9"
          >
            {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        <nav className="glass-panel h-full overflow-y-auto rounded-xl p-2.5">
          <NavList collapsed={isSidebarCollapsed} />
        </nav>
      </aside>

      {/* メイン領域（サイドバー幅に追従） */}
      <div className={`min-h-screen transition-[padding-left] duration-200 ${desktopSidebarWidth}`}>
        <header className="sticky top-0 z-20 border-b border-[var(--card-border)] bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
          <div className="flex w-full items-center justify-between gap-3 px-4 py-3 lg:px-6 lg:py-4">
            <p className="display-font text-xl font-semibold gradient-text lg:text-2xl">
              {BRAND_NAME} {BRAND_SUBTITLE}
            </p>
            <div className="hidden lg:block">
              <SyncStatus />
            </div>
            <div className="flex items-center gap-3 lg:hidden">
              <SyncStatus />
              <p className="text-sm font-semibold text-[var(--text-nav)]">{pageLabel}</p>
              <Link
                href="/settings"
                aria-label="設定"
                aria-current={isActive(pathname, "/settings") ? "page" : undefined}
                className="ui-icon-button min-h-10 min-w-10"
              >
                <Settings size={18} />
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 py-5 pb-28 lg:px-6 lg:py-8 lg:pb-10">{children}</main>
      </div>

      <BottomTabBar />
    </div>
  );
}
