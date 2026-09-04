"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { OrderDto } from "@/lib/types";

const paymentMethods = [
  { value: "Demo", label: "Thanh toán demo", desc: "Mô phỏng thanh toán ngay" },
  { value: "CreditCard", label: "Thẻ tín dụng", desc: "Visa, Mastercard" },
  { value: "Wallet", label: "Ví điện tử", desc: "MoMo, ZaloPay, VNPay" },
];

export default function CheckoutPage() {
  const { cart, refreshCart } = useCart();
  const { isAuthenticated, token, user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [customerName, setCustomerName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Demo");
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<OrderDto | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="container-page flex flex-col items-center justify-center py-28 text-center">
        <h1 className="text-2xl font-bold text-ink">Thanh toán</h1>
        <p className="mt-3 text-ink-soft">Vui lòng đăng nhập để thanh toán.</p>
        <Link href="/login" className="mt-6">
          <Button size="lg">Đăng nhập</Button>
        </Link>
      </div>
    );
  }

  if (order) {
    return (
      <div className="container-page flex flex-col items-center justify-center py-28 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/15 text-accent">
          <CheckCircle size={44} weight="fill" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold text-ink">
          Thanh toán thành công!
        </h1>
        <p className="mt-3 text-ink-soft">
          Đơn hàng <span className="font-mono font-semibold text-ink">{order.orderNumber}</span>{" "}
          đã được tạo. Tổng {formatPrice(order.total)}.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => router.push("/account")}>Xem đơn hàng</Button>
          <Button variant="outline" onClick={() => router.push("/games")}>
            Tiếp tục mua sắm
          </Button>
        </div>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      const created = await api.orders.create(
        { customerName, email, phone, address, paymentMethod },
        token
      );
      setOrder(created);
      toast("Đặt hàng thành công");
      await refreshCart();
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Có lỗi xảy ra khi thanh toán";
      toast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page py-10">
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight text-ink">
        Thanh toán
      </h1>

      <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-lg font-bold text-ink">Thông tin giao hàng</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Họ tên *">
                <input
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={inputClass}
                  placeholder="Nguyễn Văn An"
                />
              </Field>
              <Field label="Email *">
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="email@example.com"
                />
              </Field>
              <Field label="Số điện thoại">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  placeholder="0123456789"
                />
              </Field>
              <Field label="Địa chỉ *">
                <input
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputClass}
                  placeholder="Số nhà, đường, quận/huyện"
                />
              </Field>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-bold text-ink">Phương thức thanh toán</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {paymentMethods.map((pm) => (
                <label
                  key={pm.value}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    paymentMethod === pm.value
                      ? "border-accent bg-accent/5"
                      : "border-edge bg-surface hover:border-accent/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={pm.value}
                    checked={paymentMethod === pm.value}
                    onChange={() => setPaymentMethod(pm.value)}
                    className="sr-only"
                  />
                  <p className="font-semibold text-ink">{pm.label}</p>
                  <p className="mt-1 text-xs text-ink-soft">{pm.desc}</p>
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-edge bg-surface p-6">
          <h2 className="mb-4 text-lg font-bold text-ink">Đơn hàng của bạn</h2>
          {cart?.items.length ? (
            <ul className="max-h-64 space-y-3 overflow-y-auto pr-1">
              {cart.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded bg-surface-2">
                    <Image src={item.coverImage} alt="" fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">
                      {item.gameTitle} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-ink-soft">
                    {formatPrice(item.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-ink-soft">
              Giỏ hàng trống.
            </p>
          )}
          <div className="mt-4 space-y-2 border-t border-edge pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-soft">Tạm tính</span>
              <span className="text-ink">{formatPrice(cart?.subtotal ?? 0)}</span>
            </div>
            {cart && cart.totalDiscount > 0 && (
              <div className="flex justify-between">
                <span className="text-ink-soft">Giảm giá</span>
                <span className="text-accent">-{formatPrice(cart.totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-edge pt-3 text-base">
              <span className="font-semibold text-ink">Tổng cộng</span>
              <span className="font-bold text-accent">
                {formatPrice(cart?.total ?? 0)}
              </span>
            </div>
          </div>
          <Button
            type="submit"
            size="lg"
            className="mt-6 w-full"
            loading={submitting}
            disabled={!cart?.items.length}
          >
            Đặt hàng <ArrowRight size={18} />
          </Button>
        </aside>
      </form>
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-edge bg-surface px-3.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
