"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChartLineUp,
  UsersThree,
  Receipt,
  GameController,
  TagSimple,
  Monitor,
  StarHalf,
  SignOut,
} from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";

const navItems = [
  { href: "/admin", label: "Tổng quan", icon: ChartLineUp },
  { href: "/admin/games", label: "Game", icon: GameController },
  { href: "/admin/categories", label: "Thể loại", icon: TagSimple },
  { href: "/admin/platforms", label: "Nền tảng", icon: Monitor },
  { href: "/admin/users", label: "Người dùng", icon: UsersThree },
  { href: "/admin/orders", label: "Đơn hàng", icon: Receipt },
  { href: "/admin/reviews", label: "Đánh giá", icon: StarHalf },
];

export default function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  const { isAdmin, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      router.replace("/");
    }
    if (!isAuthenticated) {
      router.replace("/login?redirect=/admin");
    }
  }, [isAdmin, isAuthenticated, router]);

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-ink-soft">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      <aside className="hidden w-60 shrink-0 border-r border-edge bg-surface lg:block">
        <div className="sticky top-16 flex h-[calc(100dvh-4rem)] flex-col overflow-y-auto p-4">
          <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Quản trị
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  pathname === item.href
                    ? "bg-accent/10 text-accent"
                    : "text-ink-soft hover:bg-surface-2 hover:text-ink"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto pt-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-surface-2 hover:text-ink"
            >
              <ChartLineUp size={18} />
              Về trang chủ
            </Link>
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-danger transition hover:bg-danger/10"
            >
              <SignOut size={18} />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 overflow-x-hidden">
        <div className="border-b border-edge bg-surface px-6 py-4 lg:hidden">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-2 text-sm font-medium",
                  pathname === item.href
                    ? "bg-accent/10 text-accent"
                    : "text-ink-soft"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
