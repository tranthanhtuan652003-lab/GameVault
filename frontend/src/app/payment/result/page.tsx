"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Clock, Package, Flask } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";

type MoMoReturnData = {
  success: boolean;
  orderId: number;
  transId: string;
  requestId: string;
  resultCode: string;
  payType: string;
  message: string;
  amount: number;
};

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page flex flex-col items-center justify-center py-28 text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-edge border-t-accent" />
          <p className="mt-6 text-ink-soft">Đang xác minh thanh toán...</p>
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const { toast } = useToast();
  const [result, setResult] = useState<MoMoReturnData | null>(null);
  const [loading, setLoading] = useState(true);
  const [simDone, setSimDone] = useState(false);
  const [simConfirming, setSimConfirming] = useState(false);
  const doneRef = useRef(false);

  // Chế độ mô phỏng MoMo: đọc trực tiếp từ URL mỗi lần render (không setState trong effect)
  const isSim = searchParams.get("momo") === "simulate";
  const simOrderId = Number(searchParams.get("orderId") ?? 0);

  useEffect(() => {
    if (doneRef.current || isSim) return;
    doneRef.current = true;

    const query: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      query[key] = value;
    });

    api.payment
      .momoReturn(query)
      .then(setResult)
      .catch((err) => {
        setResult({
          success: false,
          orderId: Number(query["orderId"] ?? 0),
          transId: "",
          requestId: query["requestId"] ?? "",
          resultCode: query["resultCode"] ?? "99",
          payType: "",
          amount: 0,
          message: err instanceof ApiError ? err.message : "Có lỗi xảy ra",
        });
      })
      .finally(() => setLoading(false));
  }, [searchParams, isSim]);

  const confirmSimulation = async () => {
    if (!token || !simOrderId) return;
    setSimConfirming(true);
    try {
      await api.payment.momoSimulateConfirm(simOrderId, token);
      toast("Thanh toán mô phỏng thành công");
      setSimDone(true);
      setResult({
        success: true,
        orderId: simOrderId,
        transId: "MOMO-SIM",
        requestId: "",
        resultCode: "0",
        payType: "Simulation",
        message: "Giao dịch thành công (mô phỏng)",
        amount: 0,
      });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Có lỗi xảy ra", "error");
    } finally {
      setSimConfirming(false);
    }
  };

  if (loading && !isSim) {
    return (
      <div className="container-page flex flex-col items-center justify-center py-28 text-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-edge border-t-accent" />
        <p className="mt-6 text-ink-soft">Đang xác minh thanh toán...</p>
      </div>
    );
  }

  if (isSim && !simDone) {
    return (
      <div className="container-page flex flex-col items-center justify-center py-28 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-500/15 text-sky-400">
          <Flask size={44} weight="fill" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold text-ink">
          Mô phỏng thanh toán MoMo
        </h1>
        <p className="mt-3 max-w-md text-ink-soft">
          Chưa cấu hình key MoMo thật nên đây là bước mô phỏng. Bấm nút bên dưới
          để giả lập giao dịch thành công (hoặc bấm nút Hủy để huỷ).
        </p>
        {simOrderId > 0 && (
          <p className="mt-2 font-mono text-sm text-ink">
            Đơn hàng #{simOrderId}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" loading={simConfirming} onClick={confirmSimulation}>
            <CheckCircle size={18} /> Thanh toán thành công (mô phỏng)
          </Button>
          <Button size="lg" variant="outline" onClick={() => router.push("/checkout")}>
            Hủy giao dịch
          </Button>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="container-page flex flex-col items-center justify-center py-28 text-center">
        <p className="text-ink-soft">Không có kết quả thanh toán.</p>
        <Link href="/games" className="mt-6">
          <Button>Tiếp tục mua sắm</Button>
        </Link>
      </div>
    );
  }

  const cancelled = result.resultCode === "1011" || result.resultCode === "1026";

  return (
    <div className="container-page flex flex-col items-center justify-center py-28 text-center">
      <span
        className={cn(
          "flex h-20 w-20 items-center justify-center rounded-full",
          result.success ? "bg-accent/15 text-accent" : cancelled ? "bg-amber-500/15 text-amber-400" : "bg-danger/15 text-danger"
        )}
      >
        {result.success ? (
          <CheckCircle size={44} weight="fill" />
        ) : cancelled ? (
          <Clock size={44} weight="fill" />
        ) : (
          <XCircle size={44} weight="fill" />
        )}
      </span>

      <h1 className="mt-6 text-3xl font-extrabold text-ink">
        {result.success ? "Thanh toán thành công!" : cancelled ? "Giao dịch bị hủy" : "Thanh toán không thành công"}
      </h1>
      <p className="mt-3 max-w-md text-ink-soft">{result.message}</p>

      <div className="mt-8 w-full max-w-sm space-y-2 rounded-2xl border border-edge bg-surface p-5 text-left text-sm">
        {result.orderId > 0 && (
          <Row label="Mã đơn hàng" value={`#${result.orderId}`} />
        )}
        {result.amount > 0 && (
          <Row
            label="Số tiền"
            value={new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(result.amount)}
          />
        )}
        {result.transId && (
          <Row label="Mã giao dịch MoMo" value={result.transId} />
        )}
        {result.payType && <Row label="Hình thức" value={result.payType} />}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {result.success ? (
          <Button onClick={() => router.push("/account")}>
            <Package size={18} /> Xem đơn hàng
          </Button>
        ) : (
          <Button onClick={() => router.push("/checkout")}>
            Thử lại thanh toán
          </Button>
        )}
        <Button variant="outline" onClick={() => router.push("/games")}>
          Tiếp tục mua sắm
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-ink-soft">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}