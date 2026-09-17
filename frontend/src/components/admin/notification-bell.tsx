"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ShoppingCart,
  Star,
  UserPlus,
} from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { NotificationDto } from "@/lib/types";

function TypeIcon({ type }: { type: string }) {
  const cls = "mt-0.5 shrink-0 text-accent";
  if (type === "Register") return <UserPlus size={16} weight="fill" className={cls} />;
  if (type === "Order") return <ShoppingCart size={16} weight="fill" className={cls} />;
  if (type === "Review") return <Star size={16} weight="fill" className={cls} />;
  return <Bell size={16} weight="fill" className={cls} />;
}

export function NotificationBell() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [unread, setUnread] = useState(0);
  const [marking, setMarking] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const load = async () => {
      try {
        const [list, count] = await Promise.all([
          api.admin.notifications.list(token, 30),
          api.admin.notifications.unreadCount(token),
        ]);
        if (!active) return;
        setItems(list);
        setUnread(count.count);
      } catch {
        /* bỏ qua lỗi mạng */
      }
    };
    load();
    const t = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [token]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const markAllRead = async () => {
    if (!token) return;
    setMarking(true);
    try {
      await api.admin.notifications.markAllRead(token);
      setItems((list) => list.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch {
      toast("Không thể đánh dấu đã đọc", "error");
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Thông báo"
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-edge bg-surface text-ink-soft transition hover:text-ink"
      >
        <Bell size={20} weight={unread > 0 ? "fill" : "regular"} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-edge bg-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-edge px-4 py-3">
            <p className="text-sm font-bold text-ink">Hoạt động người dùng</p>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                disabled={marking}
                className="text-xs font-semibold text-accent transition hover:text-accent-strong disabled:opacity-50"
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-soft">
                Chưa có hoạt động nào.
              </p>
            ) : (
              <ul>
                {items.map((n) => (
                  <li
                    key={n.id}
                    className={cn(
                      "flex gap-3 border-b border-edge/50 px-4 py-3 last:border-0",
                      !n.isRead && "bg-accent/5"
                    )}
                  >
                    <TypeIcon type={n.type} />
                    <div className="min-w-0">
                      <p className="text-sm leading-snug text-ink">{n.message}</p>
                      <p className="mt-0.5 text-xs text-ink-soft">
                        {formatDateTime(n.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}