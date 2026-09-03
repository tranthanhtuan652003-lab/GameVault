"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api";
import type { PlatformDto } from "@/lib/types";

export default function AdminPlatformsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [platforms, setPlatforms] = useState<PlatformDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.admin.platforms
      .list(token)
      .then(setPlatforms)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !token) return;
    setAdding(true);
    try {
      const p = await api.admin.platforms.create(name.trim(), token);
      setPlatforms((list) => [...list, p]);
      setName("");
      toast("Đã thêm nền tảng");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Có lỗi xảy ra", "error");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (p: PlatformDto) => {
    if (!token) return;
    if (!confirm(`Xóa nền tảng "${p.name}"?`)) return;
    try {
      await api.admin.platforms.delete(p.id, token);
      setPlatforms((list) => list.filter((x) => x.id !== p.id));
      toast("Đã xóa nền tảng");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Có lỗi xảy ra", "error");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink">Nền tảng</h1>
        <p className="text-sm text-ink-soft">{platforms.length} nền tảng</p>
      </div>

      <form onSubmit={handleAdd} className="mb-6 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên nền tảng mới..."
          className="h-10 flex-1 max-w-xs rounded-lg border border-edge bg-surface px-3 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={adding || !name.trim()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50"
        >
          {adding ? "Đang thêm..." : "+ Thêm"}
        </button>
      </form>

      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 p-6 text-danger">{error}</p>
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-12 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-edge bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-ink-soft">
                <th className="p-4 font-medium">ID</th>
                <th className="p-4 font-medium">Tên</th>
                <th className="p-4 font-medium">Slug</th>
                <th className="p-4 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {platforms.map((p) => (
                <tr key={p.id} className="border-b border-edge/50 last:border-0">
                  <td className="p-4 text-ink-soft">{p.id}</td>
                  <td className="p-4 font-medium text-ink">{p.name}</td>
                  <td className="p-4 text-ink-soft">{p.slug}</td>
                  <td className="p-4">
                    <button
                      onClick={() => handleDelete(p)}
                      className="rounded-lg border border-danger/40 px-3 py-1 text-xs font-semibold text-danger transition hover:bg-danger/10"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {platforms.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-ink-soft">
                    Chưa có nền tảng nào
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
