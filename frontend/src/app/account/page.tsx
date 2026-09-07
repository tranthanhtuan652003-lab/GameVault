"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Heart,
  UserCircle,
  PencilSimple,
  CheckCircle,
  Clock,
  XCircle,
  Camera,
} from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { api, resolveAssetUrl } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatPrice, formatDateTime } from "@/lib/format";
import type { OrderDto, WishlistItemDto } from "@/lib/types";

type Tab = "orders" | "wishlist" | "profile";

const statusConfig: Record<
  string,
  { label: string; icon: React.ReactNode; className: string }
> = {
  Pending: {
    label: "Chờ xử lý",
    icon: <Clock size={14} />,
    className: "bg-amber-500/15 text-amber-400",
  },
  Processing: {
    label: "Đang xử lý",
    icon: <Clock size={14} />,
    className: "bg-sky-500/15 text-sky-400",
  },
  Completed: {
    label: "Hoàn thành",
    icon: <CheckCircle size={14} />,
    className: "bg-accent/15 text-accent",
  },
  Cancelled: {
    label: "Đã hủy",
    icon: <XCircle size={14} />,
    className: "bg-danger/15 text-danger",
  },
};

export default function AccountPage() {
  const { isAuthenticated, user, token, logout, refreshUser } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItemDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [editName, setEditName] = useState(user?.fullName ?? "");
  const [editEmail, setEditEmail] = useState(user?.email ?? "");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Đồng bộ form từ user profile khi auth hydrate xong (hoặc sau khi cập nhật
  // profile/avatar) mà không ghi đè khi user đang gõ. Điều chỉnh state trong
  // lúc render theo tài liệu React (tránh setState đồng bộ trong effect).
  const [prevFormUser, setPrevFormUser] = useState(user?.fullName ?? "");
  if ((user?.fullName ?? "") !== prevFormUser) {
    setPrevFormUser(user?.fullName ?? "");
    setEditName(user?.fullName ?? "");
    setEditEmail(user?.email ?? "");
  }

  const pickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async () => {
    const file = avatarInputRef.current?.files?.[0];
    if (!token || !file) return;
    setUploadingAvatar(true);
    try {
      await api.auth.uploadAvatar(file, token);
      setAvatarPreview(null);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      await refreshUser();
      toast("Đã cập nhật ảnh đại diện");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Có lỗi xảy ra";
      toast(msg, "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    if (!token || !isAuthenticated) return;
    Promise.all([
      api.orders.list(token).then(setOrders).catch(() => {}),
      api.wishlist.get(token).then(setWishlist).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [token, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="container-page flex flex-col items-center justify-center py-28 text-center">
        <h1 className="text-2xl font-bold text-ink">Tài khoản của bạn</h1>
        <p className="mt-3 text-ink-soft">Vui lòng đăng nhập để xem tài khoản.</p>
        <Link href="/login" className="mt-6">
          <Button size="lg">Đăng nhập</Button>
        </Link>
      </div>
    );
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      await api.auth.updateProfile(editName || undefined, editEmail || undefined, token);
      await refreshUser();
      toast("Đã cập nhật thông tin");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Có lỗi xảy ra";
      toast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingPw(true);
    try {
      await api.auth.changePassword(currentPw, newPw, token);
      setCurrentPw("");
      setNewPw("");
      toast("Đã đổi mật khẩu");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Có lỗi xảy ra";
      toast(msg, "error");
    } finally {
      setSavingPw(false);
    }
  };

  const removeWishlist = async (gameId: number) => {
    if (!token) return;
    try {
      await api.wishlist.remove(gameId, token);
      setWishlist((w) => w.filter((i) => i.gameId !== gameId));
      toast("Đã xóa khỏi yêu thích");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Có lỗi xảy ra", "error");
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "orders", label: "Đơn hàng", icon: <Package size={16} /> },
    { id: "wishlist", label: "Yêu thích", icon: <Heart size={16} /> },
    { id: "profile", label: "Hồ sơ", icon: <UserCircle size={16} /> },
  ];

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          Tài khoản
        </h1>
        <p className="mt-1 text-ink-soft">Xin chào, {user?.fullName}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside>
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-edge bg-surface p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-lg font-bold text-accent">
              {user?.avatarUrl ? (
                <Image
                  src={resolveAssetUrl(user.avatarUrl)}
                  alt=""
                  width={44}
                  height={44}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                (user?.fullName?.charAt(0).toUpperCase() ?? "U")
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{user?.fullName}</p>
              <p className="truncate text-xs text-ink-soft">{user?.email}</p>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto lg:flex-col">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                  tab === t.id
                    ? "bg-accent/10 text-accent"
                    : "text-ink-soft hover:bg-surface-2 hover:text-ink"
                )}
              >
                {t.icon}
                {t.label}
                {t.id === "wishlist" && wishlist.length > 0 && (
                  <span className="ml-auto rounded-full bg-surface-2 px-1.5 text-xs">
                    {wishlist.length}
                  </span>
                )}
              </button>
            ))}
            <button
              onClick={logout}
              className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-danger transition hover:bg-danger/10 lg:mt-2 lg:border-t lg:border-edge lg:pt-4"
            >
              Đăng xuất
            </button>
          </nav>
        </aside>

        <div>
          {tab === "orders" && (
            <OrdersTab orders={orders} loading={loading} />
          )}
          {tab === "wishlist" && (
            <WishlistTab
              wishlist={wishlist}
              loading={loading}
              onRemove={removeWishlist}
            />
          )}
          {tab === "profile" && (
            <ProfileTab
              editName={editName}
              setEditName={setEditName}
              editEmail={editEmail}
              setEditEmail={setEditEmail}
              currentPw={currentPw}
              setCurrentPw={setCurrentPw}
              newPw={newPw}
              setNewPw={setNewPw}
              saving={saving}
              savingPw={savingPw}
              saveProfile={saveProfile}
              changePassword={changePassword}
              user={user}
              avatarInputRef={avatarInputRef}
              avatarPreview={avatarPreview}
              uploadingAvatar={uploadingAvatar}
              onPickAvatar={pickAvatar}
              onUploadAvatar={uploadAvatar}
              onCancelAvatar={() => {
                setAvatarPreview(null);
                if (avatarInputRef.current) avatarInputRef.current.value = "";
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function OrdersTab({ orders, loading }: { orders: OrderDto[]; loading: boolean }) {
  if (loading) return <SkeletonLines />;
  if (!orders.length) {
    return (
      <div className="rounded-xl border border-dashed border-edge py-16 text-center text-ink-soft">
        Bạn chưa có đơn hàng nào.
        <div className="mt-4">
          <Link href="/games">
            <Button variant="outline">Khám phá game</Button>
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const st = statusConfig[order.status] ?? statusConfig.Pending;
        return (
          <div key={order.id} className="rounded-2xl border border-edge bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-sm font-semibold text-ink">
                  {order.orderNumber}
                </p>
                <p className="text-xs text-ink-soft">
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                  st.className
                )}
              >
                {st.icon}
                {st.label}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {order.items.slice(0, 5).map((item) => (
                <div key={item.gameId} className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-surface-2">
                  <Image src={item.coverImage} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-edge pt-3 text-sm">
              <span className="text-ink-soft">
                {order.items.reduce((a, i) => a + i.quantity, 0)} sản phẩm
              </span>
              <span className="font-bold text-accent">{formatPrice(order.total)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WishlistTab({
  wishlist,
  loading,
  onRemove,
}: {
  wishlist: WishlistItemDto[];
  loading: boolean;
  onRemove: (gameId: number) => void;
}) {
  if (loading) return <SkeletonLines />;
  if (!wishlist.length) {
    return (
      <div className="rounded-xl border border-dashed border-edge py-16 text-center text-ink-soft">
        Danh sách yêu thích trống.
        <div className="mt-4">
          <Link href="/games">
            <Button variant="outline">Khám phá game</Button>
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {wishlist.map((item) => (
        <div key={item.gameId} className="group overflow-hidden rounded-xl border border-edge bg-surface">
          <Link href={`/games/${item.gameId}`}>
            <div className="relative aspect-[16/10] bg-surface-2">
              <Image src={item.coverImage} alt={item.title} fill className="object-cover" />
            </div>
          </Link>
          <div className="p-3">
            <Link href={`/games/${item.gameId}`} className="line-clamp-1 font-semibold text-ink hover:text-accent">
              {item.title}
            </Link>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm font-bold text-accent">
                {formatPrice(item.discountPrice ?? item.price)}
              </span>
              <button
                onClick={() => onRemove(item.gameId)}
                className="text-ink-soft transition hover:text-danger"
                aria-label="Xóa"
              >
                <Heart size={16} weight="fill" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileTab({
  editName,
  setEditName,
  editEmail,
  setEditEmail,
  currentPw,
  setCurrentPw,
  newPw,
  setNewPw,
  saving,
  savingPw,
  saveProfile,
  changePassword,
  user,
  avatarInputRef,
  avatarPreview,
  uploadingAvatar,
  onPickAvatar,
  onUploadAvatar,
  onCancelAvatar,
}: {
  editName: string;
  setEditName: (v: string) => void;
  editEmail: string;
  setEditEmail: (v: string) => void;
  currentPw: string;
  setCurrentPw: (v: string) => void;
  newPw: string;
  setNewPw: (v: string) => void;
  saving: boolean;
  savingPw: boolean;
  saveProfile: (e: React.FormEvent) => void;
  changePassword: (e: React.FormEvent) => void;
  user: NonNullable<ReturnType<typeof useAuth>["user"]> | null;
  avatarInputRef: React.RefObject<HTMLInputElement | null>;
  avatarPreview: string | null;
  uploadingAvatar: boolean;
  onPickAvatar: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadAvatar: () => void;
  onCancelAvatar: () => void;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={saveProfile} className="rounded-2xl border border-edge bg-surface p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
          <PencilSimple size={18} className="text-accent" /> Thông tin cá nhân
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-2xl font-bold text-accent">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt=""
                  width={80}
                  height={80}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : user?.avatarUrl ? (
                <Image
                  src={resolveAssetUrl(user.avatarUrl)}
                  alt=""
                  width={80}
                  height={80}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                (user?.fullName?.charAt(0).toUpperCase() ?? "U")
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={onPickAvatar}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Camera size={16} className="mr-1.5" /> Chọn ảnh
              </Button>
              {avatarPreview && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    loading={uploadingAvatar}
                    disabled={uploadingAvatar}
                    onClick={onUploadAvatar}
                  >
                    Lưu ảnh
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={uploadingAvatar}
                    onClick={onCancelAvatar}
                  >
                    Hủy
                  </Button>
                </div>
              )}
            </div>
          </div>
          <Field label="Tên đăng nhập">
            <input value={user?.userName ?? ""} disabled className={inputClass} />
          </Field>
          <Field label="Họ tên">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Button type="submit" loading={saving}>
            Lưu thay đổi
          </Button>
        </div>
      </form>

      <form onSubmit={changePassword} className="rounded-2xl border border-edge bg-surface p-6">
        <h2 className="mb-4 text-lg font-bold text-ink">Đổi mật khẩu</h2>
        <div className="space-y-4">
          <Field label="Mật khẩu hiện tại">
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Mật khẩu mới">
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className={inputClass}
              minLength={6}
            />
          </Field>
          <Button type="submit" loading={savingPw} variant="secondary">
            Đổi mật khẩu
          </Button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-edge bg-canvas px-3.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none disabled:opacity-60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

function SkeletonLines() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton-shimmer h-28 rounded-2xl border border-edge" />
      ))}
    </div>
  );
}
