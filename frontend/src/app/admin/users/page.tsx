"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { UserDto } from "@/lib/types";
import { cn } from "@/lib/cn";

export default function AdminUsersPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) return;
    api.admin
      .users(token)
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const toggleActive = async (u: UserDto) => {
    if (!token) return;
    try {
      const updated = await api.admin.setUserStatus(u.id, !u.isActive, token);
      setUsers((list) => list.map((x) => (x.id === u.id ? updated : x)));
      toast(`Đã ${updated.isActive ? "kích hoạt" : "vô hiệu hóa"} tài khoản`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Có lỗi xảy ra", "error");
    }
  };

  const changeRole = async (u: UserDto, role: string) => {
    if (!token) return;
    try {
      await api.admin.setUserRole(u.id, role, token);
      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, role } : x)));
      toast("Đã cập nhật vai trò");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Có lỗi xảy ra", "error");
    }
  };

  const filtered = users.filter(
    (u) =>
      u.userName.toLowerCase().includes(search.toLowerCase()) ||
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Người dùng</h1>
          <p className="text-sm text-ink-soft">
            {users.length} tài khoản đang hoạt động
          </p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm người dùng..."
          className="h-10 w-64 rounded-lg border border-edge bg-surface px-3 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none"
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 p-6 text-danger">{error}</p>
      ) : loading ? (
        <SkeletonTable />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-edge bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-ink-soft">
                <th className="p-4 font-medium">Người dùng</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Vai trò</th>
                <th className="p-4 font-medium">Ngày tạo</th>
                <th className="p-4 font-medium">Trạng thái</th>
                <th className="p-4 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-edge/50 last:border-0">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                        {u.fullName?.charAt(0).toUpperCase() ?? "U"}
                      </span>
                      <div>
                        <p className="font-medium text-ink">{u.fullName}</p>
                        <p className="text-xs text-ink-soft">@{u.userName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-ink-soft">{u.email}</td>
                  <td className="p-4">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value)}
                      className="rounded-lg border border-edge bg-surface px-2 py-1 text-xs font-semibold text-ink focus:border-accent focus:outline-none"
                    >
                      <option value="User">User</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-4 text-ink-soft">{formatDateTime(u.createdAt)}</td>
                  <td className="p-4">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        u.isActive
                          ? "bg-accent/15 text-accent"
                          : "bg-danger/15 text-danger"
                      )}
                    >
                      {u.isActive ? "Hoạt động" : "Bị khóa"}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleActive(u)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                        u.isActive
                          ? "border-danger/40 text-danger hover:bg-danger/10"
                          : "border-accent/40 text-accent hover:bg-accent/10"
                      )}
                    >
                      {u.isActive ? "Khóa" : "Mở khóa"}
                    </button>
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
