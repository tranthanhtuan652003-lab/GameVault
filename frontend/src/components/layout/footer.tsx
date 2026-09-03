import Link from "next/link";
import { Logo } from "./navbar";

export function Footer() {
  return (
    <footer className="border-t border-edge bg-surface">
      <div className="container-page grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-ink-soft">
            GameVault — kho game số chất lượng cao với cộng đồng đánh giá đáng
            tin cậy. Mua game, khám phá và chia sẻ trải nghiệm của bạn.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-ink">Khám phá</h4>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li><Link href="/games" className="transition hover:text-accent">Kho game</Link></li>
            <li><Link href="/games?sort=rating" className="transition hover:text-accent">Game nổi bật</Link></li>
            <li><Link href="/games?sort=newest" className="transition hover:text-accent">Game mới</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-ink">Tài khoản</h4>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li><Link href="/login" className="transition hover:text-accent">Đăng nhập</Link></li>
            <li><Link href="/register" className="transition hover:text-accent">Đăng ký</Link></li>
            <li><Link href="/account" className="transition hover:text-accent">Tài khoản của tôi</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-ink">Hỗ trợ</h4>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li><Link href="/cart" className="transition hover:text-accent">Giỏ hàng</Link></li>
            <li><Link href="/checkout" className="transition hover:text-accent">Thanh toán</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-edge">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-ink-soft sm:flex-row">
          <p>© {new Date().getFullYear()} GameVault. Dự án lập trình web.</p>
          <p className="font-mono">ASP.NET Core · Next.js · SQL Server</p>
        </div>
      </div>
    </footer>
  );
}
