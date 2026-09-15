"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { ArrowUpRight, Newspaper, ClockCounterClockwise } from "@phosphor-icons/react";
import type { NewsItem } from "@/lib/news-types";

const SOURCE_STYLES: Record<string, { badge: string; bar: string; label: string }> = {
  IGN: {
    badge: "border-red-500/25 bg-red-500/10 text-red-400",
    bar: "bg-red-500",
    label: "text-red-400",
  },
  Eurogamer: {
    badge: "border-orange-500/25 bg-orange-500/10 text-orange-400",
    bar: "bg-orange-500",
    label: "text-orange-400",
  },
  "Rock Paper Shotgun": {
    badge: "border-sky-500/25 bg-sky-500/10 text-sky-400",
    bar: "bg-sky-500",
    label: "text-sky-400",
  },
};

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  if (days < 365)
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function estimateReadTime(description: string): number {
  if (!description) return 2;
  return Math.max(2, Math.round(description.split(" ").length / 25));
}

function SourceBadge({ source }: { source: NewsItem["source"] }) {
  const style = SOURCE_STYLES[source] ?? SOURCE_STYLES.IGN;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.bar}`} />
      {source}
    </span>
  );
}

function NewsImageFallback() {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08),transparent_65%),linear-gradient(145deg,#18181b_0%,#0b0b0d_100%)]">
      <Newspaper size={42} weight="duotone" className="text-ink/15" />
    </div>
  );
}

function arrowButton() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:bg-gray-950 group-hover:text-white">      <ArrowUpRight size={14} weight="bold" />
    </span>
  );
}

export function NewsCard({ item, index = 0 }: { item: NewsItem; index?: number }) {
  const num = String(index + 1).padStart(2, "0");

  return (
    <motion.article
      initial={{ opacity: 0, y: 32, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: Math.min((index % 4) * 0.08, 0.4), ease: [0.32, 0.72, 0, 1] }}
      className="group cursor-pointer rounded-[1.75rem] bg-gradient-to-b from-white/[0.06] to-white/[0.015] p-px shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]"
    >
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex h-full flex-col overflow-hidden rounded-[calc(1.75rem-1px)] bg-surface transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-1.5"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.title}
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.07]"
            />
          ) : (
            <NewsImageFallback />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/10 to-transparent opacity-90" />

          <span className="absolute top-4 right-4 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-widest text-white/80 backdrop-blur-md">
            {num}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
            <SourceBadge source={item.source} />
            <span className="flex items-center gap-1 text-[11px] text-ink-soft/80">
              <ClockCounterClockwise size={12} className="opacity-60" />
              {formatRelativeTime(item.pubDate)}
            </span>
          </div>

          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-ink transition-colors duration-500 group-hover:text-accent-strong">
            {item.title}
          </h3>

          {item.description && (
            <p className="line-clamp-2 text-[13px] leading-relaxed text-ink-soft">
              {item.description}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between border-t border-edge/60 pt-4">
            <span className="text-[11px] text-ink-soft/70">
              {estimateReadTime(item.description)} phút đọc
            </span>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-accent transition-all duration-500 group-hover:gap-2.5">
              Đọc tiếp
              {arrowButton()}
            </span>
          </div>
        </div>
      </a>
    </motion.article>
  );
}

export function NewsRankedItem({ item, index = 0 }: { item: NewsItem; index?: number }) {
  const num = String(index + 2).padStart(2, "0");

  return (
    <motion.a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, x: -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: Math.min(index * 0.06, 0.3), ease: [0.32, 0.72, 0, 1] }}
      className="group grid grid-cols-[3rem_1fr] items-center gap-4 border-b border-edge/50 py-5 transition-colors duration-500 hover:border-edge sm:grid-cols-[3.5rem_1fr_auto]"
    >
      <span className="font-mono text-[2rem] leading-none font-extrabold tracking-tighter text-white/10 transition-colors duration-500 group-hover:text-accent/50 sm:text-4xl">
        {num}
      </span>

      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <SourceBadge source={item.source} />
          <span className="flex items-center gap-1 text-[11px] text-ink-soft/80">
            <ClockCounterClockwise size={12} className="opacity-60" />
            {formatRelativeTime(item.pubDate)}
          </span>
        </div>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-ink transition-colors duration-500 group-hover:text-accent-strong sm:text-base">
          {item.title}
        </h3>
      </div>

      <div className="hidden sm:block">
        <div className="relative h-16 w-24 overflow-hidden rounded-lg bg-surface-2 ring-1 ring-white/10">
          {item.image ? (
            <Image
              src={item.image}
              alt=""
              fill
              unoptimized
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110"
            />
          ) : (
            <NewsImageFallback />
          )}
        </div>
      </div>
    </motion.a>
  );
}

export function FeaturedNewsCard({ item }: { item: NewsItem }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
      className="rounded-[2rem] bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-px shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
    >
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative grid overflow-hidden rounded-[calc(2rem-1px)] bg-surface lg:grid-cols-12"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-surface-2 sm:aspect-[16/9] lg:col-span-8 lg:aspect-auto lg:min-h-[400px]">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.title}
              fill
              unoptimized
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.07]"
            />
          ) : (
            <NewsImageFallback />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent lg:bg-gradient-to-r lg:from-black/75 lg:via-black/25 lg:to-transparent" />

          <span className="absolute top-5 left-5 inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-gray-950">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gray-950/50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gray-950" />
            </span>
            Tin nổi bật
          </span>

          <span className="absolute bottom-5 right-5 hidden font-mono text-6xl font-extrabold tracking-tighter text-white/10 sm:block">
            01
          </span>
        </div>

        <div className="flex flex-col justify-center gap-5 p-7 sm:p-10 lg:col-span-4 lg:p-9 xl:p-12">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <SourceBadge source={item.source} />
            <span className="flex items-center gap-1 text-xs text-ink-soft">
              <ClockCounterClockwise size={14} className="opacity-60" />
              {formatRelativeTime(item.pubDate)}
            </span>
          </div>

          <h2 className="text-balance text-2xl font-extrabold leading-[1.15] tracking-tight text-ink transition-colors duration-500 group-hover:text-accent-strong sm:text-3xl xl:text-[2.5rem]">
            {item.title}
          </h2>

          {item.description && (
            <p className="text-balance text-sm leading-relaxed text-ink-soft">
              {item.description}
            </p>
          )}

          <span className="mt-2 inline-flex w-fit items-center gap-3 rounded-full bg-white/[0.04] py-1.5 pr-1.5 pl-6 text-sm font-semibold text-ink ring-1 ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-accent group-hover:text-gray-950 group-hover:ring-accent">
            Đọc bài viết đầy đủ
            {arrowButton()}
          </span>
        </div>
      </a>
    </motion.article>
  );
}