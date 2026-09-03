"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const pages = getPageNumbers(page, totalPages);

  if (totalPages <= 1) return null;

  return (
    <nav
      className="mt-10 flex items-center justify-center gap-1"
      aria-label="Phân trang"
    >
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-edge text-ink-soft transition hover:border-accent hover:text-accent disabled:opacity-40 disabled:hover:border-edge disabled:hover:text-ink-soft"
        aria-label="Trang trước"
      >
        <CaretLeft size={16} />
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`e-${i}`} className="px-2 text-ink-soft">
            …
          </span>
        ) : (
          <button
            key={`p-${p}`}
            onClick={() => onChange(p as number)}
            className={cn(
              "h-9 w-9 rounded-lg border text-sm font-medium transition",
              p === page
                ? "border-accent bg-accent text-gray-950"
                : "border-edge text-ink-soft hover:border-accent/40 hover:text-ink"
            )}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-edge text-ink-soft transition hover:border-accent hover:text-accent disabled:opacity-40 disabled:hover:border-edge disabled:hover:text-ink-soft"
        aria-label="Trang sau"
      >
        <CaretRight size={16} />
      </button>
    </nav>
  );
}

function getPageNumbers(page: number, totalPages: number): (number | string)[] {
  const pages: (number | string)[] = [];
  const delta = 2;
  const start = Math.max(2, page - delta);
  const end = Math.min(totalPages - 1, page + delta);

  pages.push(1);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("...");
  if (totalPages > 1) pages.push(totalPages);

  return pages;
}
