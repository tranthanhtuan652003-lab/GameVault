"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api";
import type { GenreDto } from "@/lib/types";

export default function AdminCategoriesPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [genres, setGenres] = useState<GenreDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.admin.genres
      .list(token)
      .then(setGenres)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !token) return;
    setAdding(true);
    try {
      const genre = await api.admin.genres.create(name.trim(), token);
      setGenres((list) => [...list, genre]);
      setName("");
      toast("Đã thêm thể loại");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Có lỗi xảy ra", "error");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (g: GenreDto) => {
    if (!token) return;
    if (!confirm(`Xóa thể loại "${g.name}"?`)) return;
    try {
      await api.admin.genres.delete(g.id, token);
      setGenres((list) => list.filter((x) => x.id !== g.id));
      toast("Đã xóa thể loại");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Có lỗi xảy ra", "error");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink">Thể loại</h1>
        <p className="text-sm text-ink-soft">{genres.length} thể loại</p>
      </div>

      <form onSubmit={handleAdd} className="mb-6 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên thể loại mới..."
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
              {genres.map((g) => (
                <tr key={g.id} className="border-b border-edge/50 last:border-0">
                  <td className="p-4 text-ink-soft">{g.id}</td>
                  <td className="p-4 font-medium text-ink">{g.name}</td>
                  <td className="p-4 text-ink-soft">{g.slug}</td>
                  <td className="p-4">
                    <button
                      onClick={() => handleDelete(g)}
                      className="rounded-lg border border-danger/40 px-3 py-1 text-xs font-semibold text-danger transition hover:bg-danger/10"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {genres.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-ink-soft">
                    Chưa có thể loại nào
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
