"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import type { NewsCategory, NewsItem } from "@/lib/news-types";
import { NEWS_CATEGORIES, NEWS_CATEGORY_LABEL } from "@/lib/news-types";
import { NewsCard, FeaturedNewsCard, NewsRankedItem } from "@/components/news/news-card";

type Filter = NewsCategory | "all";

function normalizeFilter(value: string | null | undefined): Filter {
  if (!value || value === "all") return "all";
  return NEWS_CATEGORIES.some((c) => c.value === value) ? (value as Filter) : "all";
}

function TabsBar({
  active,
  counts,
  onChange,
}: {
  active: Filter;
  counts: Record<Filter, number>;
  onChange: (f: Filter) => void;
}) {
  return (
    <nav
      aria-label="Danh mục tin tức"
      className="no-scrollbar sticky top-[64px] z-30 -mx-4 mb-10 overflow-x-auto border-y border-edge/60 bg-canvas/85 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border sm:px-2"
    >
      <div className="flex w-max items-center gap-1 sm:w-auto">
        {NEWS_CATEGORIES.map((cat) => {
          const selected = active === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => onChange(cat.value)}
              aria-pressed={selected}
              className="relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300"
            >
              {selected && (
                <motion.span
                  layoutId="news-tab-pill"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-full bg-accent/15 ring-1 ring-accent/30"
                />
              )}
              <span className={`relative h-1.5 w-1.5 rounded-full ${cat.dot} ${selected ? "" : "opacity-45"}`} />
              <span className={`relative ${selected ? "text-accent-strong" : "text-ink-soft hover:text-ink"}`}>
                {cat.label}
              </span>
              <span
                className={`relative rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums ${
                  selected ? "bg-accent/20 text-accent-strong" : "bg-ink/[0.05] text-ink-soft/70"
                }`}
              >
                {counts[cat.value]}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6">
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
          {eyebrow}
        </p>
        <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          {title}
        </h2>
      </div>
      <span className="hidden h-px flex-1 bg-gradient-to-r from-edge to-transparent sm:block" />
    </div>
  );
}

export function NewsFeed({ items }: { items: NewsItem[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<Filter>(() =>
    normalizeFilter(searchParams.get("cat"))
  );

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.category === filter)),
    [items, filter]
  );

  const counts = useMemo(() => {
    const base: Record<Filter, number> = {
      all: items.length,
      news: 0,
      review: 0,
      trailer: 0,
      esports: 0,
      tech: 0,
      deals: 0,
    };
    for (const item of items) base[item.category] += 1;
    return base;
  }, [items]);

  const changeFilter = (f: Filter) => {
    setFilter(f);
    const url = f === "all" ? "/news" : `/news?cat=${f}`;
    router.replace(url, { scroll: false });
  };

  const [featured, ...rest] = filtered;
  const ranked = rest.slice(0, 6);
  const gridItems = rest.slice(6);
  const categoryLabel = filter === "all" ? "tất cả chủ đề" : `mục ${NEWS_CATEGORY_LABEL[filter]}`;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-[2rem] border border-edge bg-surface py-28 text-center">
        <p className="text-sm text-ink-soft">
          Không lấy được tin tức ngay lúc này. Vui lòng thử lại sau.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-20 sm:gap-24">
      <div>
        <TabsBar active={filter} counts={counts} onChange={changeFilter} />

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-[2rem] border border-edge bg-surface py-24 text-center">
            <p className="text-sm text-ink-soft">
              Chưa có bài viết nào trong mục này. Thử chọn danh mục khác nhé.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              className="flex flex-col gap-20 sm:gap-24"
            >
              {featured && <FeaturedNewsCard item={featured} />}

              {ranked.length > 0 && (
                <section>
                  <SectionHeading eyebrow="Tiêu điểm" title={`Nổi bật · ${categoryLabel}`} />
                  <div className="rounded-[2rem] bg-gradient-to-b from-hairline to-transparent p-px">
                    <div className="rounded-[calc(2rem-1px)] bg-surface px-6 py-1 sm:px-10">
                      {ranked.map((item, i) => (
                        <NewsRankedItem key={item.id} item={item} index={i} />
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {gridItems.length > 0 && (
                <section>
                  <SectionHeading eyebrow="Danh mục" title="Tin mới nhất" />
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {gridItems.map((item, i) => (
                      <NewsCard key={item.id} item={item} index={i} />
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}