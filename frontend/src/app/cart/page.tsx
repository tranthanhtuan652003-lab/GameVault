"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus, Minus, Trash, ArrowRight } from "@phosphor-icons/react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const { cart, updateQuantity, removeItem, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="container-page flex flex-col items-center justify-center py-28 text-center">
        <h1 className="text-2xl font-bold text-ink">Giỏ hàng của bạn</h1>
        <p className="mt-3 text-ink-soft">
          Vui lòng đăng nhập để xem giỏ hàng.
        </p>
        <Link href="/login" className="mt-6">
          <Button size="lg">Đăng nhập</Button>
        </Link>
      </div>
    );
  }

  if (!cart?.items.length) {
    return (
      <div className="container-page flex flex-col items-center justify-center py-28 text-center">
        <h1 className="text-2xl font-bold text-ink">Giỏ hàng trống</h1>
        <p className="mt-3 text-ink-soft">
          Chưa có game nào trong giỏ hàng của bạn.
        </p>
        <Link href="/games" className="mt-6">
          <Button size="lg">
            Khám phá game <ArrowRight size={18} />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight text-ink">
        Giỏ hàng
      </h1>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <ul className="divide-y divide-edge rounded-2xl border border-edge bg-surface">
            {cart.items.map((item) => (
              <li key={item.id} className="flex gap-4 p-4">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                  <Image
                    src={item.coverImage}
                    alt={item.gameTitle}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between">
                    <Link
                      href={`/games/${item.gameId}`}
                      className="font-semibold text-ink hover:text-accent"
                    >
                      {item.gameTitle}
                    </Link>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-ink-soft hover:text-danger"
                      aria-label="Xóa"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-lg border border-edge">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, Math.max(1, item.quantity - 1))
                        }
                        className="p-2 text-ink-soft hover:text-ink"
                      >
                        <Minus size={15} />
                      </button>
                      <span className="w-8 text-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, Math.min(10, item.quantity + 1))
                        }
                        className="p-2 text-ink-soft hover:text-ink"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                    <div className="text-right">
                      {item.discountPrice != null && (
                        <p className="text-xs text-ink-soft line-through">
                          {formatPrice(item.unitPrice)}
                        </p>
                      )}
                      <p className="font-bold text-accent">
                        {formatPrice(item.lineTotal)}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-between">
            <Link href="/games" className="text-sm font-semibold text-accent hover:underline">
              Tiếp tục mua sắm
            </Link>
            <button
              onClick={clearCart}
              className="text-sm text-ink-soft hover:text-danger"
            >
              Xóa toàn bộ
            </button>
          </div>
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-2xl border border-edge bg-surface p-6">
          <h2 className="mb-4 text-lg font-bold text-ink">Tóm tắt</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-soft">Tạm tính</span>
              <span className="text-ink">{formatPrice(cart.subtotal)}</span>
            </div>
            {cart.totalDiscount > 0 && (
              <div className="flex justify-between">
                <span className="text-ink-soft">Giảm giá</span>
                <span className="text-accent">-{formatPrice(cart.totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-edge pt-3">
              <span className="font-semibold text-ink">Tổng cộng</span>
              <span className="text-xl font-bold text-accent">
                {formatPrice(cart.total)}
              </span>
            </div>
          </div>
          <Link href="/checkout" className="mt-6 block">
            <Button size="lg" className="w-full">
              Tiến hành thanh toán <ArrowRight size={18} />
            </Button>
          </Link>
        </aside>
      </div>
    </div>
  );
}
