"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import type { GameDto, GameKeyDto } from "@/lib/types";

export default function AdminKeysPage() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [games, setGames] = useState<GameDto[]>([]);
  const [gameId, setGameId] = useState("");
  const [keys, setKeys] = useState<GameKeyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [generateCount, setGenerateCount] = useState("10");
  const [importText, setImportText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.admin.games
      .all({ page: 1, pageSize: 100 }, token)
      .then((r) => setGames(r.items))
      .catch(() => {});
  }, [token]);

  const loadKeys = useCallback(() => {
    if (!token) return;
    api.admin.gameKeys
      .list(gameId ? Number(gameId) : undefined, token)
      .then(setKeys)
      .catch(() => toast("Không tải được danh sách key", "error"))
      .finally(() => setLoading(false));
  }, [token, gameId, toast]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const relinkSummary = () => {
    api.admin.games
      .all({ page: 1, pageSize: 100 }, token!)
      .then((r) => setGames(r.items))
      .catch(() => {});
  };

  const availableCount = keys.filter((k) => k.status === "Available").length;
  const soldCount = keys.length - availableCount;

  const handleGenerate = async () => {
    if (!token) return;
    if (!gameId) {
      toast("Vui lòng chọn game trước", "error");
      return;
    }
    const count = Number(generateCount);
    if (!Number.isInteger(count) || count < 1 || count > 500) {
      toast("Số lượng phải từ 1 đến 500", "error");
      return;
    }
    setSubmitting(true);
    try {
      const created = await api.admin.gameKeys.generate(Number(gameId), count, token);
      toast(`Đã tạo ${created.length} key mới`);
      await loadKeys();
      relinkSummary();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Có lỗi xảy ra", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImport = async () => {
    if (!token) return;
    if (!gameId) {
      toast("Vui lòng chọn game trước", "error");
      return;
    }
    const list = importText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!list.length) {
      toast("Nhập ít nhất một key (mỗi key một dòng)", "error");
      return;
    }
    setSubmitting(true);
    try {
      const result = await api.admin.gameKeys.import(Number(gameId), list, token);
      toast(`Nhập xong: ${result.created} mới, ${result.duplicates} trùng`);
      setImportText("");
      await loadKeys();
      relinkSummary();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Có lỗi xảy ra", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (k: GameKeyDto) => {
    if (!token) return;
    if (!confirm(`Xóa key ${k.key}?`)) return;
    try {
      await api.admin.gameKeys.remove(k.id, token);
      setKeys((list) => list.filter((x) => x.id !== k.id));
      relinkSummary();
      toast("Đã xóa key");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Có lỗi xảy ra", "error");
    }
  };

  const selectClass =
    "h-10 rounded-lg border border-edge bg-surface px-3 text-sm text-ink focus:border-accent focus:outline-none";
  const inputClass =
    "h-10 rounded-lg border border-edge bg-surface px-3 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none";

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Game keys</h1>
          <p className="text-sm text-ink-soft">
            Quản lý key kích hoạt Steam cho từng game
          </p>
        </div>
        <select
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          className={cn(selectClass, "w-64")}
        >
          <option value="">Tất cả game ({games.length})</option>
          {games.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title} — còn {g.availableKeys} key
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6 flex gap-3">
        <div className="flex-1 rounded-2xl border border-edge bg-surface p-5">
          <p className="text-sm text-ink-soft">Key khả dụng</p>
          <p className="mt-1 text-2xl font-extrabold text-accent">{availableCount}</p>
        </div>
        <div className="flex-1 rounded-2xl border border-edge bg-surface p-5">
          <p className="text-sm text-ink-soft">Key đã bán</p>
          <p className="mt-1 text-2xl font-extrabold text-ink">{soldCount}</p>
        </div>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-edge bg-surface p-5">
          <h2 className="mb-3 text-lg font-bold text-ink">Tạo key tự động</h2>
          <p className="mb-3 text-xs text-ink-soft">
            Tạo key định dạng XXXXX-XXXXX-XXXXX theo phong cách Steam.
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={500}
              value={generateCount}
              onChange={(e) => setGenerateCount(e.target.value)}
              className={cn(inputClass, "w-28")}
            />
            <button
              onClick={handleGenerate}
              disabled={submitting || !gameId}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50"
            >
              {submitting ? "Đang tạo..." : "Tạo"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-edge bg-surface p-5">
          <h2 className="mb-3 text-lg font-bold text-ink">Nhập key thủ công</h2>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={3}
            placeholder={"Mỗi key một dòng...\nABCDE-12345-FGHIJ\nfghij-67890-abcde"}
            className="w-full rounded-lg border border-edge bg-surface-2 px-3 py-2 text-sm font-mono text-ink focus:border-accent focus:outline-none"
          />
          <button
            onClick={handleImport}
            disabled={submitting}
            className="mt-2 rounded-lg border border-accent/40 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/10 disabled:opacity-50"
          >
            {submitting ? "Đang nhập..." : "Nhập key"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-14 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-edge bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-ink-soft">
                <th className="p-4 font-medium">Game</th>
                <th className="p-4 font-medium">Key</th>
                <th className="p-4 font-medium">Trạng thái</th>
                <th className="p-4 font-medium">Đã bán</th>
                <th className="p-4 font-medium">Ngày tạo</th>
                <th className="p-4 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-b border-edge/50 last:border-0">
                  <td className="p-4 text-ink-soft">{k.gameTitle || "—"}</td>
                  <td className="p-4 font-mono text-ink">{k.key}</td>
                  <td className="p-4">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        k.status === "Available"
                          ? "bg-accent/15 text-accent"
                          : "bg-sky-500/15 text-sky-400"
                      )}
                    >
                      {k.status === "Available" ? "Khả dụng" : "Đã bán"}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-ink-soft">
                    {k.soldAt ? formatDateTime(k.soldAt) : "—"}
                  </td>
                  <td className="p-4 text-xs text-ink-soft">{formatDateTime(k.createdAt)}</td>
                  <td className="p-4">
                    {k.status === "Available" ? (
                      <button
                        onClick={() => handleDelete(k)}
                        className="rounded-lg border border-danger/40 px-2.5 py-1 text-xs font-semibold text-danger transition hover:bg-danger/10"
                      >
                        Xóa
                      </button>
                    ) : (
                      <span className="text-xs text-ink-soft">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {keys.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-ink-soft">
                    Chưa có key nào. Chọn game và tạo hoặc nhập key.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}