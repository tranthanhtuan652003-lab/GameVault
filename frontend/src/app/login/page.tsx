"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GameController, Eye, EyeSlash } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { toast } = useToast();

  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(userName, password);
      toast("Đăng nhập thành công");
      const redirectParam = searchParams.get("redirect");
      const redirect =
        redirectParam && /^\/(?![/\\])/.test(redirectParam) ? redirectParam : "/";
      router.push(redirect);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Đăng nhập thất bại, vui lòng thử lại";
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-gray-950">
            <GameController size={30} weight="fill" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold text-ink">Chào mừng trở lại</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Đăng nhập để tiếp tục khám phá kho game của bạn
          </p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border border-edge bg-surface p-6"
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">
              Tên đăng nhập
            </span>
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              autoComplete="username"
              className={inputClass}
              placeholder="admin"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">
              Mật khẩu
            </span>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className={inputClass}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPw ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Đăng nhập
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-semibold text-accent hover:underline">
            Đăng ký ngay
          </Link>
        </p>

        <div className="mt-6 rounded-xl border border-edge bg-surface p-4 text-center text-xs text-ink-soft">
          <p className="mb-1 font-semibold text-ink">Tài khoản demo</p>
          <p>Admin: admin / Admin@123 · User: player1 / User@123</p>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-edge bg-canvas px-3.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none";
