"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { formatPrice, formatDateTime } from "@/lib/format";
import type { OrderDto } from "@/lib/types";
import { cn } from "@/lib/cn";

const statuses = ["Pending", "Processing", "Completed", "Cancelled"];
const statusLabel: Record<string, string> = {
  Pending: "Chờ xử lý",
  Processing: "Đang xử lý",
  Completed: "Hoàn thành",
  Cancelled: "Đã hủy",
};
const statusClass: Record<string, string> = {
  Pending: "bg-amber-500/15 text-amber-400",
  Processing: "bg-sky-500/15 text-sky-400",
  Completed: "bg-accent/15 text-accent",
  Cancelled: "bg-danger/15 text-danger",
};

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api.admin
      .orders(token)
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const updateStatus = async (id: number, status: string) => {
    if (!token) return;
    try {
      await api.admin.setOrderStatus(id, status, token);
      setOrders((list) => list.map((o) => (o.id === id ? { ...o, status } : o)));
      toast(`Đã cập nhật trạng thái ${statusLabel[status] ?? status}`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Có lỗi xảy ra", "error");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink">Đơn hàng</h1>
        <p className="text-sm text-ink-soft">Quản lý toàn bộ đơn hàng</p>
      </div>

      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 p-6 text-danger">{error}</p>
      ) : loading ? (
        <SkeletonTable />
      ) : !orders.length ? (
        <div className="rounded-xl border border-dashed border-edge py-16 text-center text-ink-soft">
          Chưa có đơn hàng nào.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-edge bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-ink-soft">
                <th className="p-4 font-medium">Đơn hàng</th>
                <th className="p-4 font-medium">Khách hàng</th>
                <th className="p-4 font-medium">Ngày</th>
                <th className="p-4 font-medium">Sản phẩm</th>
                <th className="p-4 font-medium">Tổng</th>
                <th className="p-4 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-edge/50 last:border-0">
                  <td className="p-4 font-mono text-ink">{o.orderNumber}</td>
                  <td className="p-4">
                    <p className="font-medium text-ink">{o.customerName}</p>
                    <p className="text-xs text-ink-soft">{o.email}</p>
                  </td>
                  <td className="p-4 text-ink-soft">{formatDateTime(o.createdAt)}</td>
                  <td className="p-4 text-ink-soft">
                    {o.items.reduce((a, i) => a + i.quantity, 0)}
                  </td>
                  <td className="p-4 font-bold text-accent">{formatPrice(o.total)}</td>
                  <td className="p-4">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className={cn(
                        "rounded-full border border-transparent px-3 py-1 text-xs font-semibold focus:outline-none",
                        statusClass[o.status] ?? "bg-surface-2 text-ink-soft"
                      )}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {statusLabel[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton-shimmer h-16 rounded-2xl" />
      ))}
    </div>
  );
}
