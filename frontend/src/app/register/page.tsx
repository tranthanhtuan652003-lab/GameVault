"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GameController, Eye, EyeSlash } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast("Mật khẩu xác nhận không khớp", "error");
      return;
    }
    setLoading(true);
    try {
      await register({ userName, email, password, fullName });
      toast("Đăng ký thành công");
      router.push("/");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Đăng ký thất bại, vui lòng thử lại";
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
          <h1 className="mt-5 text-2xl font-extrabold text-ink">Tạo tài khoản</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Tham gia GameVault để bắt đầu mua game
          </p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border border-edge bg-surface p-6"
        >
          <Field label="Họ tên">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className={inputClass}
              placeholder="Nguyễn Văn An"
            />
          </Field>
          <Field label="Tên đăng nhập">
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              minLength={3}
              className={inputClass}
              placeholder="player1"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
              placeholder="email@example.com"
            />
          </Field>
          <Field label="Mật khẩu">
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className={inputClass}
                placeholder="Tối thiểu 6 ký tự"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                aria-label="Hiện/ẩn mật khẩu"
              >
                {showPw ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>
          <Field label="Xác nhận mật khẩu">
            <input
              type={showPw ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              className={inputClass}
              placeholder="Nhập lại mật khẩu"
            />
          </Field>

          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Đăng ký
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-semibold text-accent hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-edge bg-canvas px-3.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
