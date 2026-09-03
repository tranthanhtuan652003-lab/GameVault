"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  UsersThree,
  GameController,
  Receipt,
  Bank,
  TrendUp,
} from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { formatPrice, formatDateTime, formatCompactPrice } from "@/lib/format";
import type { DashboardDto } from "@/lib/types";
import { cn } from "@/lib/cn";

const statusConfig: Record<string, string> = {
  Pending: "bg-amber-500/15 text-amber-400",
  Processing: "bg-sky-500/15 text-sky-400",
  Completed: "bg-accent/15 text-accent",
  Cancelled: "bg-danger/15 text-danger",
};

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api.admin
      .dashboard(token)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="p-6"><SkeletonDashboard /></div>;
  if (error) {
    return (
      <div className="p-6 text-danger">
        <p className="rounded-xl border border-danger/30 bg-danger/10 p-6">{error}</p>
      </div>
    );
  }
  if (!data) return null;

  const maxSale = Math.max(...data.recentSales.map((s) => s.revenue), 1);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink">Tổng quan</h1>
        <p className="text-sm text-ink-soft">Báo cáo hoạt động của GameVault</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<UsersThree size={20} weight="fill" />}
          label="Người dùng"
          value={data.totalUsers?.toLocaleString() ?? "0"}
        />
        <StatCard
          icon={<GameController size={20} weight="fill" />}
          label="Game"
          value={data.totalGames?.toLocaleString() ?? "0"}
        />
        <StatCard
          icon={<Receipt size={20} weight="fill" />}
          label="Đơn hàng"
          value={data.totalOrders?.toLocaleString() ?? "0"}
        />
        <StatCard
          icon={<Bank size={20} weight="fill" />}
          label="Doanh thu"
          value={formatCompactPrice(data.totalRevenue ?? 0)}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Sales chart */}
        <div className="rounded-2xl border border-edge bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-ink">
            <TrendUp size={18} className="text-accent" /> Doanh thu 7 ngày
          </h2>
          {data.recentSales.length ? (
            <div className="flex h-40 items-end gap-2">
              {data.recentSales.map((point) => (
                <div key={point.label} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] text-ink-soft">
                    {point.revenue > 0 ? formatCompactPrice(point.revenue) : ""}
                  </span>
                  <div
                    className="w-full rounded-t bg-accent/70"
                    style={{ height: `${Math.max((point.revenue / maxSale) * 100, 3)}%` }}
                  />
                  <span className="text-[10px] text-ink-soft">{point.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-ink-soft">Chưa có dữ liệu</p>
          )}
        </div>

        {/* Popular games */}
        <div className="rounded-2xl border border-edge bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-ink">
            <GameController size={18} className="text-accent" /> Game bán chạy
          </h2>
          {data.popularGames.length ? (
            <ul className="space-y-3">
              {data.popularGames.map((g, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-5 text-sm font-bold text-ink-soft">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{g.title}</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{
                          width: `${(g.sales / Math.max(...data.popularGames.map((p) => p.sales), 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-ink-soft">
                    {g.sales}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-10 text-center text-sm text-ink-soft">Chưa có dữ liệu</p>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="mt-6 rounded-2xl border border-edge bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-ink">Đơn hàng gần đây</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-accent hover:underline">
            Xem tất cả
          </Link>
        </div>
        {data.recentOrders.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edge text-left text-ink-soft">
                  <th className="pb-2 pr-4 font-medium">Đơn hàng</th>
                  <th className="pb-2 pr-4 font-medium">Khách hàng</th>
                  <th className="pb-2 pr-4 font-medium">Ngày</th>
                  <th className="pb-2 pr-4 font-medium">Tổng</th>
                  <th className="pb-2 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-edge/50 last:border-0">
                    <td className="py-3 pr-4 font-mono text-ink">{order.orderNumber}</td>
                    <td className="py-3 pr-4 text-ink">{order.customerName}</td>
                    <td className="py-3 pr-4 text-ink-soft">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-accent">
                      {formatPrice(order.total)}
                    </td>
                    <td className="py-3">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          statusConfig[order.status] ?? "bg-surface-2 text-ink-soft"
                        )}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-ink-soft">Chưa có đơn hàng</p>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-edge bg-surface p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
        {icon}
      </span>
      <p className="mt-4 text-2xl font-extrabold text-ink">{value}</p>
      <p className="text-sm text-ink-soft">{label}</p>
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div>
      <div className="skeleton-shimmer mb-6 h-8 w-48 rounded" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
