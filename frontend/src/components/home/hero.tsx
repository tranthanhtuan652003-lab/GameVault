"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, GameController } from "@phosphor-icons/react";
import type { GameDto } from "@/lib/types";
import { formatPrice } from "@/lib/format";

export function Hero({ games }: { games: GameDto[] }) {
  const [idx, setIdx] = useState(0);
  const featured = games.length ? games : [];

  useEffect(() => {
    if (!featured.length) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % featured.length), 6000);
    return () => clearInterval(t);
  }, [featured.length]);

  const active = featured[idx];

  return (
    <section className="relative overflow-hidden border-b border-edge bg-canvas">
      <div className="container-page grid min-h-[100dvh] items-center gap-10 pt-24 pb-16 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
        {/* Left: value prop */}
        <div className="relative z-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
            <GameController size={14} weight="fill" />
            Kho game số
          </div>

          <h1 className="text-balance text-4xl font-extrabold tracking-tight leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
            Mở kho{"\u00a0"}khám phá{" "}
            <span className="text-accent">vũ trụ game</span> của bạn
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
            Hàng ngàn tựa game từ đối tác uy tín, giá tốt, đánh giá thật từ cộng
            đồng. Mua một lần, chơi mãi mãi.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/games"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-accent px-6 text-base font-semibold text-gray-950 transition hover:bg-accent-strong"
            >
              Khám phá kho game
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <Link
              href="/games?sort=rating"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-edge px-6 text-base font-semibold text-ink transition hover:border-accent/60 hover:text-accent"
            >
              Game nổi bật
            </Link>
          </div>

          <div className="mt-10 grid max-w-md grid-cols-3 gap-4">
            <Stat value="1000+" label="Tựa game" />
            <Stat value="10k+" label="Người chơi" />
            <Stat value="4.8/5" label="Đánh giá" />
          </div>
        </div>

        {/* Right: rotating cover showcase */}
        <div className="relative hidden lg:block">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-edge-soft bg-surface-2 shadow-2xl">
            <AnimatePresence mode="wait">
              {active && (
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, scale: 1.06 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0"
                >
                  <Image
                    src={active.coverImage}
                    alt={active.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 0vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <motion.h3
                      className="text-2xl font-bold text-white drop-shadow"
                      key={`t-${active.id}`}
                    >
                      {active.title}
                    </motion.h3>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-lg font-bold text-accent">
                        {formatPrice(active.finalPrice)}
                      </span>
                      <Link
                        href={`/games/${active.slug}`}
                        className="rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25"
                      >
                        Xem ngay
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dots */}
          {featured.length > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              {featured.map((g, i) => (
                <button
                  key={g.id}
                  onClick={() => setIdx(i)}
                  aria-label={g.title}
                  className={`h-1.5 rounded-full transition-all ${
                    i === idx ? "w-6 bg-accent" : "w-1.5 bg-edge"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-extrabold text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-ink-soft">{label}</p>
    </div>
  );
}
