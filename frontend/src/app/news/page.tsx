import type { Metadata } from "next";
import { Suspense } from "react";
import { getGameNews } from "@/lib/news";
import { NewsFeed } from "@/components/news/news-feed";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Tin tức game | GameVault",
  description:
    "Tin tức game mới nhất từ IGN, Eurogamer và Rock Paper Shotgun — review, trailer, và những sự kiện đáng chú ý trong làng game. Nội dung dịch tự động sang tiếng Việt.",
};

const SOURCE_LINKS = [
  { name: "IGN", url: "https://www.ign.com" },
  { name: "Eurogamer", url: "https://www.eurogamer.net" },
  { name: "Rock Paper Shotgun", url: "https://www.rockpapershotgun.com" },
];

export default async function NewsPage() {
  const items = await getGameNews(20);

  return (
    <div className="container-page pt-10 pb-28 sm:pt-14">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <header className="mb-12 sm:mb-16">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-edge bg-surface px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Bản tin game · Cập nhật mỗi 10 phút
        </div>

        <h1 className="max-w-3xl text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
          Tất tần tật tin game,
          <br />
          <span className="bg-gradient-to-r from-accent to-accent-strong bg-clip-text text-transparent">
            gói gọn một trang.
          </span>
        </h1>

        <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <p className="max-w-xl text-balance text-[15px] leading-relaxed text-ink-soft">
            Tổng hợp tự động từ những tạp chí game uy tín nhất thế giới, dịch sang tiếng
            Việt và phân loại theo chủ đề để bạn không bỏ lỡ bất kỳ sự kiện nào.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium text-ink-soft">Nguồn tin:</span>
            {SOURCE_LINKS.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-1.5 rounded-full border border-edge bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink-soft transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-accent/40 hover:text-accent"
              >
                {s.name}
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                  className="opacity-50 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                >
                  <path d="M1 9L9 1M9 1H1M9 1v8" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* ── Feed phân loại ───────────────────────────────────── */}
      <Suspense fallback={<FeedSkeleton />}>
        <NewsFeed items={items} />
      </Suspense>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-20 sm:gap-24">
      <div className="grid grid-cols-1 overflow-hidden rounded-[2rem] border border-edge bg-surface lg:grid-cols-12">
        <div className="skeleton-shimmer aspect-[16/10] sm:aspect-[16/9] lg:col-span-8 lg:aspect-auto" />
        <div className="flex flex-col gap-4 p-7 sm:p-10 lg:col-span-4">
          <div className="h-5 w-24 rounded-full bg-surface-2" />
          <div className="h-8 w-4/5 rounded-lg bg-surface-2" />
          <div className="h-8 w-3/5 rounded-lg bg-surface-2" />
          <div className="mt-4 h-4 w-full rounded bg-surface-2" />
          <div className="h-4 w-5/6 rounded bg-surface-2" />
          <div className="mt-4 h-12 w-40 rounded-full bg-surface-2" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-[1.75rem] border border-edge bg-surface">
            <div className="skeleton-shimmer aspect-[16/10]" />
            <div className="flex flex-col gap-3 p-5">
              <div className="h-4 w-1/3 rounded-full bg-surface-2" />
              <div className="h-5 w-full rounded bg-surface-2" />
              <div className="h-5 w-4/5 rounded bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}