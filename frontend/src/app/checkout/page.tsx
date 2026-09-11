"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle, Copy, Clock } from "@phosphor-icons/react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { BankTransferInfoDto, OrderDto } from "@/lib/types";

const paymentMethods = [
  { value: "Demo", label: "Thanh toán demo", desc: "Mô phỏng thanh toán ngay" },
  { value: "BankTransfer", label: "Chuyển khoản ngân hàng", desc: "Vietcombank, QR code" },
  { value: "MoMo", label: "Ví MoMo", desc: "Quét QR / Ví điện tử" },
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
  const [bankInfo, setBankInfo] = useState<BankTransferInfoDto | null>(null);

  // Đồng bộ form từ user profile khi auth hydrate xong mà không ghi đè khi
  // user đang gõ. Điều chỉnh state trong lúc render theo tài liệu React.
  const [prevFormUser, setPrevFormUser] = useState(user?.fullName ?? "");
  if ((user?.fullName ?? "") !== prevFormUser) {
    setPrevFormUser(user?.fullName ?? "");
    setCustomerName(user?.fullName ?? "");
    setEmail(user?.email ?? "");
  }

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

  if (order && paymentMethod === "BankTransfer") {
    return (
      <BankTransferWaiting order={order} info={bankInfo} />
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

      if (paymentMethod === "BankTransfer") {
        const info = await api.payment.bankTransferInfo(created.id, token);
        setBankInfo(info);
        toast("Tạo đơn hàng thành công. Vui lòng chuyển khoản theo hướng dẫn.");
      } else if (paymentMethod === "MoMo") {
        const { paymentUrl, simulate } = await api.payment.momoPaymentUrl(created.id, token);
        if (simulate || !paymentUrl) {
          router.push(`/payment/result?momo=simulate&orderId=${created.id}`);
          return;
        }
        window.location.href = paymentUrl;
        return;
      } else {
        toast("Đặt hàng thành công");
      }
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
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-accent">
                    {pm.value === "BankTransfer" ? (
                      <BankIcon />
                    ) : pm.value === "MoMo" ? (
                      <MoMoIcon />
                    ) : (
                      <CardIcon />
                    )}
                  </div>
                  <p className="font-semibold text-ink">{pm.label}</p>
                  <p className="mt-1 text-xs text-ink-soft">{pm.desc}</p>
                </label>
              ))}
            </div>

            {paymentMethod === "BankTransfer" && (
              <div className="mt-4 rounded-xl border border-edge bg-surface p-5 text-sm">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-ink">
                  <Clock size={16} className="text-accent" />
                  Lưu ý khi chuyển khoản
                </h3>
                <ul className="list-disc space-y-1 pl-5 text-ink-soft">
                  <li>Thanh toán bằng chuyển khoản ngân hàng qua mã QR.</li>
                  <li>Vui lòng chuyển khoản <b>đúng số tiền</b> và ghi đúng nội dung để xác nhận nhanh.</li>
                  <li>Đơn hàng sẽ được xử lý sau khi admin xác nhận tiền về.</li>
                </ul>
              </div>
            )}

            {paymentMethod === "MoMo" && (
              <div className="mt-4 rounded-xl border border-edge bg-surface p-5 text-sm">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-ink">
                  <Clock size={16} className="text-accent" />
                  Lưu ý thanh toán MoMo
                </h3>
                <ul className="list-disc space-y-1 pl-5 text-ink-soft">
                  <li>Bạn sẽ được chuyển hướng tới ứng dụng Ví MoMo để thanh toán.</li>
                  <li>Hỗ trợ quét mã QR, tài khoản MoMo, thẻ ATM nội địa.</li>
                  <li>Số tiền được quy đổi sang VND theo tỷ giá cấu hình.</li>
                </ul>
              </div>
            )}
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

function BankTransferWaiting({
  order,
  info,
}: {
  order: OrderDto;
  info: BankTransferInfoDto | null;
}) {
  const router = useRouter();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyText = (text: string, field: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  return (
    <div className="container-page py-14">
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Clock size={44} weight="fill" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold text-ink">
          Chờ thanh toán chuyển khoản
        </h1>
        <p className="mt-3 text-ink-soft">
          Đơn hàng{" "}
          <span className="font-mono font-semibold text-ink">
            {order.orderNumber}
          </span>{" "}
          đã được tạo. Vui lòng chuyển khoản theo thông tin bên dưới để hoàn tất.
        </p>
      </div>

      {info && (
        <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-[auto_1fr]">
          <div className="flex items-center justify-center rounded-2xl border border-edge bg-surface p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={info.qrCodeUrl}
              alt="Mã QR chuyển khoản"
              className="h-48 w-48 rounded-xl bg-white object-contain"
            />
          </div>

          <div className="rounded-2xl border border-edge bg-surface p-6">
            <h2 className="mb-4 text-lg font-bold text-ink">
              Thông tin tài khoản nhận
            </h2>
            <div className="space-y-3 text-sm">
              <CopyRow
                label="Ngân hàng"
                value={`${info.bankName} - ${info.bankBranch}`}
                field="bank"
                copiedField={copiedField}
                onCopy={copyText}
              />
              <CopyRow
                label="Số tài khoản"
                value={info.bankAccountNumber}
                field="account"
                copiedField={copiedField}
                onCopy={copyText}
              />
              <CopyRow
                label="Chủ tài khoản"
                value={info.bankAccountHolder}
                field="holder"
                copiedField={copiedField}
                onCopy={copyText}
              />
              <CopyRow
                label="Số tiền"
                value={formatPrice(info.amount)}
                field="amount"
                copiedField={copiedField}
                onCopy={copyText}
              />
              <CopyRow
                label="Nội dung CK"
                value={info.transferContent}
                field="content"
                copiedField={copiedField}
                onCopy={copyText}
              />
            </div>
            <div className="mt-5 rounded-xl border border-edge bg-canvas p-4 text-xs text-ink-soft">
              Quét mã QR bằng app ngân hàng (Vietcombank, Momo, ZaloPay...) hoặc
              chuyển khoản thủ công với nội dung chính xác như trên. Admin sẽ
              xác nhận sau khi nhận được tiền.
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto mt-8 flex max-w-3xl justify-center gap-3">
        <Button onClick={() => router.push("/account")}>
          Xem đơn hàng
        </Button>
        <Button variant="outline" onClick={() => router.push("/account")}>
          Kiểm tra trạng thái
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.push("/games")}
        >
          Tiếp tục mua sắm
        </Button>
      </div>
    </div>
  );
}

function CopyRow({
  label,
  value,
  field,
  copiedField,
  onCopy,
}: {
  label: string;
  value: string;
  field: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-ink-soft">{label}</p>
        <p className="font-mono font-medium text-ink">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => onCopy(value, field)}
        className="flex shrink-0 items-center gap-1 rounded-lg border border-edge px-2.5 py-1.5 text-xs font-medium text-ink-soft transition hover:border-accent/50 hover:text-accent"
      >
        {copiedField === field ? (
          <CheckCircle size={14} className="text-accent" weight="fill" />
        ) : (
          <Copy size={14} />
        )}
        {copiedField === field ? "Đã chép" : "Sao chép"}
      </button>
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

function BankIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10h18M5 6l7-3 7 3" />
      <path d="M4 10v10M9 10v10M15 10v10M20 10v10" />
      <path d="M2 20h20" />
    </svg>
  );
}

function MoMoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="12" r="4" />
      <circle cx="17" cy="12" r="4" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <line x1="6" y1="15" x2="10" y2="15" />
    </svg>
  );
}