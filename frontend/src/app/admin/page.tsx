"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  UsersThree,
  GameController,
  Receipt,
  Bank,
  TrendUp,
  ArrowDownRight,
  ArrowUpRight,
  Coins,
  ShoppingCartSimple,
} from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { formatPrice, formatDateTime, formatCompactPrice } from "@/lib/format";
import type { DashboardDto } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { AnimatedCounter } from "@/components/ui/animated-counter";

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

  const weekRevenue = data.recentSales.reduce((s, p) => s + p.revenue, 0);
  const weekOrders = data.recentSales.reduce((s, p) => s + p.orders, 0);
  const pctChange =
    data.previousRevenue > 0
      ? ((weekRevenue - data.previousRevenue) / data.previousRevenue) * 100
      : weekRevenue > 0
        ? 100
        : 0;
  const increased = pctChange >= 0;

  const maxSale = Math.max(...data.popularGames.map((p) => p.sales), 1);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink">Tổng quan</h1>
        <p className="text-sm text-ink-soft">Báo cáo hoạt động của GameVault</p>
      </div>

      {/* Stat cards */}
      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StaggerItem>
          <StatCard
            icon={<UsersThree size={20} weight="fill" />}
            label="Người dùng"
            value={<AnimatedCounter value={data.totalUsers ?? 0} />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            icon={<GameController size={20} weight="fill" />}
            label="Game"
            value={<AnimatedCounter value={data.totalGames ?? 0} />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            icon={<Receipt size={20} weight="fill" />}
            label="Đơn hàng"
            value={<AnimatedCounter value={data.totalOrders ?? 0} />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            icon={<Bank size={20} weight="fill" />}
            label="Doanh thu"
            value={<AnimatedCounter value={data.totalRevenue ?? 0} format={(v) => formatCompactPrice(v)} />}
          />
        </StaggerItem>
      </Stagger>

      {/* Revenue report */}
      <Reveal className="mt-6 rounded-2xl border border-edge bg-surface p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-ink">
              <TrendUp size={18} className="text-accent" /> Doanh thu 7 ngày qua
            </h2>
            <div className="mt-2 flex items-end gap-3">
              <span className="text-3xl font-extrabold text-ink">
                {formatPrice(weekRevenue)}
              </span>
              <span
                className={cn(
                  "mb-1 flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                  increased ? "bg-accent/15 text-accent" : "bg-danger/15 text-danger"
                )}
              >
                {increased ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {Math.abs(pctChange).toFixed(1)}%
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-soft">
              So với 7 ngày trước
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MiniStat
              icon={<ShoppingCartSimple size={16} />}
              label="Đơn hàng"
              value={`${weekOrders}`}
            />
            <MiniStat
              icon={<Coins size={16} />}
              label="Giá trị đơn TB"
              value={formatCompactPrice(data.averageOrderValue ?? 0)}
            />
            <MiniStat
              icon={<Receipt size={16} />}
              label="Tổng doanh thu"
              value={formatCompactPrice(data.totalRevenue ?? 0)}
            />
          </div>
        </div>

        <RevenueChart data={data.recentSales} />
      </Reveal>

      <Stagger className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Popular games */}
        <StaggerItem>
        <div className="rounded-2xl border border-edge bg-surface p-6 transition-all duration-300 hover:border-accent/30">
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
                          width: `${(g.sales / maxSale) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-ink-soft">
                    {g.sales} bán
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-10 text-center text-sm text-ink-soft">Chưa có dữ liệu</p>
          )}
        </div>
        </StaggerItem>

        {/* Recent orders */}
        <StaggerItem>
        <div className="rounded-2xl border border-edge bg-surface p-6 transition-all duration-300 hover:border-accent/30">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-ink">Đơn hàng gần đây</h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-accent hover:underline">
              Xem tất cả
            </Link>
          </div>
          {data.recentOrders.length ? (
            <ul className="space-y-3">
              {data.recentOrders.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center gap-3 rounded-xl border border-edge/60 bg-surface-2/40 p-3"
                >
                  <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Receipt size={16} weight="fill" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-mono text-xs text-ink-soft">
                        {order.orderNumber}
                      </p>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          statusConfig[order.status] ?? "bg-surface-2 text-ink-soft"
                        )}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm font-semibold text-ink">
                      {order.userName}
                    </p>
                    <p className="truncate text-xs text-ink-soft">
                      {order.items
                        .map((i) => (i.quantity > 1 ? `${i.gameTitle} ×${i.quantity}` : i.gameTitle))
                        .join(", ") || "—"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-accent">{formatPrice(order.total)}</p>
                    <p className="text-[10px] text-ink-soft">{formatDateTime(order.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-10 text-center text-sm text-ink-soft">Chưa có đơn hàng</p>
          )}
        </div>
        </StaggerItem>
      </Stagger>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Area / Line chart (SVG)                                             */
/* ------------------------------------------------------------------ */

type SalesPoint = { label: string; revenue: number; orders: number };

const CHART_W = 720;
const CHART_H = 240;
const PAD = { top: 16, right: 12, bottom: 28, left: 48 };
const PLOT_W = CHART_W - PAD.left - PAD.right;
const PLOT_H = CHART_H - PAD.top - PAD.bottom;

function RevenueChart({ data }: { data: SalesPoint[] }) {
  const gradId = useId();
  const [hover, setHover] = useState<number | null>(null);

  const { points, niceMax } = useMemo(() => {
    if (!data.length) return { points: [] as { x: number; y: number; price: number }[], niceMax: 1 };
    const maxVal = Math.max(...data.map((d) => d.revenue), 1);
    // round up to a "nice" axis maximum
    const step = Math.pow(10, Math.floor(Math.log10(maxVal)));
    const niceMaxVal = Math.ceil(maxVal / step) * step;
    const density = data.length - 1 || 1;
    const pts = data.map((d, i) => ({
      x: PAD.left + (i / density) * PLOT_W,
      y: PAD.top + PLOT_H - (d.revenue / niceMaxVal) * PLOT_H,
      price: d.revenue,
    }));
    return { points: pts, niceMax: niceMaxVal };
  }, [data]);

  const gridSteps = 4;

  const linePath = useMemo(() => {
    if (!points.length) return "";
    if (points.length === 1) {
      const p = points[0];
      return `M ${p.x} ${p.y}`;
    }
    // smooth curve (catmull-rom -> bezier)
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] ?? points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] ?? p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }
    return d;
  }, [points]);

  const areaPath = useMemo(() => {
    if (!linePath) return "";
    const last = points[points.length - 1];
    const first = points[0];
    return `${linePath} L ${last.x} ${PAD.top + PLOT_H} L ${first.x} ${PAD.top + PLOT_H} Z`;
  }, [linePath, points]);

  if (!points.length) {
    return <p className="py-10 text-center text-sm text-ink-soft">Chưa có dữ liệu</p>;
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="h-auto w-full"
        role="img"
        aria-label="Biểu đồ doanh thu 7 ngày"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* horizontal gridlines + y labels */}
        {Array.from({ length: gridSteps + 1 }).map((_, i) => {
          const y = PAD.top + (PLOT_H / gridSteps) * i;
          const val = niceMax - (niceMax / gridSteps) * i;
          return (
            <g key={i}>
              <line
                x1={PAD.left}
                x2={CHART_W - PAD.right}
                y1={y}
                y2={y}
                stroke="#27272a"
                strokeWidth="1"
                strokeDasharray={i === gridSteps ? "0" : "4 4"}
              />
              <text
                x={PAD.left - 8}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fill="#a1a1aa"
              >
                {formatCompactPrice(val)}
              </text>
            </g>
          );
        })}

        {/* area + line */}
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path
          d={linePath}
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === maxIndex(points) ? 4.5 : 3}
            fill="#09090b"
            stroke="#34d399"
            strokeWidth="2"
          />
        ))}

        {/* x labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={points[i].x}
            y={CHART_H - 8}
            textAnchor="middle"
            fontSize="10"
            fill={hover === i ? "#fafafa" : "#a1a1aa"}
          >
            {d.label}
          </text>
        ))}

        {/* hover guide + tooltip */}
        {hover !== null && (
          <g>
            <line
              x1={points[hover].x}
              x2={points[hover].x}
              y1={PAD.top}
              y2={PAD.top + PLOT_H}
              stroke="#34d399"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle
              cx={points[hover].x}
              cy={points[hover].y}
              r="6"
              fill="#10b981"
              stroke="#09090b"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>

      {/* hover capture overlay */}
      <div className="absolute inset-0">
        {data.map((_, i) => {
          const xPct = points[i].x / CHART_W;
          return (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              aria-label={`Xem doanh thu ${data[i].label}`}
              className="absolute inset-y-0"
              style={{ left: `${(xPct - 0.5 / data.length) * 100}%`, width: `${(1 / data.length) * 100}%` }}
            />
          );
        })}
      </div>

      {/* floating tooltip */}
      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-edge bg-canvas/95 px-3 py-2 shadow-xl"
          style={{
            left: `${(points[hover].x / CHART_W) * 100}%`,
            top: `${Math.min(points[hover].y / CHART_H - 0.02, 0.12) * 100}%`,
          }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-soft">
            {data[hover].label}
          </p>
          <p className="text-sm font-bold text-accent">{formatPrice(data[hover].revenue)}</p>
          <p className="text-[10px] text-ink-soft">{data[hover].orders} đơn</p>
        </div>
      )}
    </div>
  );
}

function maxIndex(pts: { y: number }[]) {
  let idx = 0;
  let min = Infinity;
  pts.forEach((p, i) => {
    if (p.y < min) {
      min = p.y;
      idx = i;
    }
  });
  return idx;
}

/* ------------------------------------------------------------------ */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
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

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-edge bg-surface-2/40 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-ink-soft">
        <span className="text-accent">{icon}</span>
        <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1 text-lg font-bold text-ink">{value}</p>
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
