"use client";

import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import {
  ArrowRight,
  ShieldCheck,
  CreditCard,
  RocketLaunch,
} from "@phosphor-icons/react";

const features = [
  {
    icon: ShieldCheck,
    title: "Mua an toàn",
    desc: "Thanh toán bảo mật, giao ngay trong vài giây",
  },
  {
    icon: CreditCard,
    title: "Nhiều phương thức",
    desc: "Ví điện tử, thẻ tín dụng, chuyển khoản",
  },
  {
    icon: RocketLaunch,
    title: "Nhận ngay lập tức",
    desc: "Key game có ngay sau khi đặt hàng",
  },
];

export function CTASection() {
  return (
    <section className="border-t border-edge bg-surface">
      <div className="container-page py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-balance text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Sẵn sàng mở siêu phẩm của{" "}
              <span className="text-accent">bạn?</span>
            </h2>
            <p className="mt-4 max-w-lg text-ink-soft">
              Tham gia GameVault để mua game, lưu danh sách yêu thích và chia sẻ
              đánh giá của riêng bạn.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-accent px-6 text-base font-semibold text-gray-950 transition hover:bg-accent-strong"
              >
                Tạo tài khoản miễn phí
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/games"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-edge px-6 text-base font-semibold text-ink transition hover:border-accent/60 hover:text-accent"
              >
                Xem kho game
              </Link>
            </div>
          </Reveal>

          <Stagger className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {features.map((f) => (
              <StaggerItem key={f.title}>
                <div className="flex items-start gap-4 rounded-xl border border-edge bg-canvas p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_14px_40px_rgba(0,0,0,0.35)]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <f.icon size={20} weight="fill" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-ink">{f.title}</h3>
                    <p className="mt-0.5 text-sm text-ink-soft">{f.desc}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
