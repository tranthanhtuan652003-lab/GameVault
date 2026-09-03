"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { ReviewDto } from "@/lib/types";

const PAGE_SIZE = 20;

export default function AdminReviewsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = (p: number) => {
    if (!token) return;
    api.admin.reviews
      .list(p, PAGE_SIZE, token)
      .then((r) => {
        setReviews(r.items);
        setTotalPages(r.totalPages);
        setTotal(r.totalCount);
        setPage(r.page);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1); }, [token]);

  const handleDelete = async (r: ReviewDto) => {
    if (!token) return;
    if (!confirm(`Xóa đánh giá #${r.id}?`)) return;
    try {
      await api.admin.reviews.delete(r.id, token);
      setReviews((list) => list.filter((x) => x.id !== r.id));
      setTotal((t) => t - 1);
      toast("Đã xóa đánh giá");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Có lỗi xảy ra", "error");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink">Đánh giá</h1>
        <p className="text-sm text-ink-soft">{total} đánh giá</p>
      </div>

      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 p-6 text-danger">{error}</p>
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-16 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-edge bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edge text-left text-ink-soft">
                  <th className="p-4 font-medium">ID</th>
                  <th className="p-4 font-medium">Người dùng</th>
                  <th className="p-4 font-medium">Game ID</th>
                  <th className="p-4 font-medium">Điểm</th>
                  <th className="p-4 font-medium">Nội dung</th>
                  <th className="p-4 font-medium">Ngày</th>
                  <th className="p-4 font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id} className="border-b border-edge/50 last:border-0">
                    <td className="p-4 text-ink-soft">{r.id}</td>
                    <td className="p-4 font-medium text-ink">{r.userName}</td>
                    <td className="p-4 text-ink-soft">{r.gameId}</td>
                    <td className="p-4">
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                        {r.rating}★
                      </span>
                    </td>
                    <td className="max-w-xs p-4 text-ink-soft">
                      <p className="truncate">{r.comment}</p>
                    </td>
                    <td className="p-4 text-ink-soft">{formatDateTime(r.createdAt)}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleDelete(r)}
                        className="rounded-lg border border-danger/40 px-3 py-1 text-xs font-semibold text-danger transition hover:bg-danger/10"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
                {reviews.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-ink-soft">
                      Chưa có đánh giá nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-ink-soft">
                Trang {page} / {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => load(page - 1)}
                  disabled={page <= 1}
                  className="rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft transition hover:bg-surface-2 disabled:opacity-40"
                >
                  Trước
                </button>
                <button
                  onClick={() => load(page + 1)}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft transition hover:bg-surface-2 disabled:opacity-40"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
