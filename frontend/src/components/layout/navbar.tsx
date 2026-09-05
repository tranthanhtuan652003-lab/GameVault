"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  GameController,
  ShoppingCartSimple,
  User,
  MagnifyingGlass,
  SignOut,
} from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { resolveAssetUrl } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/games", label: "Kho game" },
];

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-gray-950">
        <GameController size={18} weight="fill" />
      </span>
      <span className="text-lg font-extrabold tracking-tight text-ink">
        Game<span className="text-accent">Vault</span>
      </span>
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/games?search=${encodeURIComponent(q.trim())}`);
    setQ("");
    setSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-edge bg-canvas/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center gap-4">
        <Logo />

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                pathname === link.href
                  ? "text-accent"
                  : "text-ink-soft hover:text-ink hover:bg-surface-2"
              )}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated && user?.role === "Admin" && (
            <Link
              href="/admin"
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                pathname.startsWith("/admin")
                  ? "text-accent"
                  : "text-ink-soft hover:text-ink hover:bg-surface-2"
              )}
            >
              Quản trị
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          {searchOpen && (
            <form onSubmit={submitSearch} className="flex items-center">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm game..."
                className="h-9 w-40 rounded-lg border border-edge bg-surface px-3 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none sm:w-56"
              />
            </form>
          )}

          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Tìm kiếm"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-soft transition hover:bg-surface-2 hover:text-ink"
          >
            <MagnifyingGlass size={20} />
          </button>

          <Link
            href="/cart"
            aria-label="Giỏ hàng"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-ink-soft transition hover:bg-surface-2 hover:text-ink"
          >
            <ShoppingCartSimple size={20} />
            {count > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-gray-950">
                {count}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-edge bg-surface text-ink-soft transition hover:text-ink"
                aria-label="Tài khoản"
              >
                <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full text-sm font-bold text-ink">
                  {user?.avatarUrl ? (
                    <Image
                      src={resolveAssetUrl(user.avatarUrl)}
                      alt=""
                      width={40}
                      height={40}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (user?.fullName?.charAt(0).toUpperCase() ?? "U")
                  )}
                </span>
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-edge bg-surface-2 shadow-xl">
                    <div className="border-b border-edge px-4 py-3">
                      <p className="text-sm font-semibold text-ink">
                        {user?.fullName}
                      </p>
                      <p className="text-xs text-ink-soft">
                        {user?.userName} · {user?.role}
                      </p>
                    </div>
                    <div className="p-1.5">
                      <Link
                        href="/account"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-soft transition hover:bg-surface hover:text-ink"
                      >
                        <User size={16} /> Tài khoản
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setMenuOpen(false);
                          router.push("/");
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-soft transition hover:bg-surface hover:text-danger"
                      >
                        <SignOut size={16} /> Đăng xuất
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-1 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-gray-950 transition hover:bg-accent-strong"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
