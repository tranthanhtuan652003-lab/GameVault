"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import type { GenreDto, PlatformDto, GameListParams } from "@/lib/types";
import { cn } from "@/lib/cn";

const priceRanges = [
  { label: "Tất cả", min: undefined, max: undefined },
  { label: "Dưới $20", min: undefined, max: 20 },
  { label: "$20 - $50", min: 20, max: 50 },
  { label: "$50 - $100", min: 50, max: 100 },
  { label: "Trên $100", min: 100, max: undefined },
];

export function Filters({
  filters,
  categories,
  onApply,
  onClear,
}: {
  filters: GameListParams;
  categories: { genres: GenreDto[]; platforms: PlatformDto[] };
  onApply: (patch: Partial<GameListParams>) => void;
  onClear: () => void;
}) {
  const [searchText, setSearchText] = useState(filters.search ?? "");

  const activePriceIndex = useMemo(() => {
    return priceRanges.findIndex(
      (r) => r.min === filters.minPrice && r.max === filters.maxPrice
    );
  }, [filters.minPrice, filters.maxPrice]);

  const submitSearch = () => {
    onApply({ search: searchText.trim() || undefined });
  };

  return (
    <div className="space-y-7">
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Tìm kiếm
        </h3>
        <div className="flex gap-1">
          <div className="relative flex-1">
            <MagnifyingGlass
              size={15}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-soft"
            />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitSearch()}
              placeholder="Tên game..."
              className="h-9 w-full rounded-lg border border-edge bg-surface pl-8 pr-3 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none"
            />
          </div>
          <button
            onClick={submitSearch}
            className="rounded-lg bg-accent px-3 text-sm font-semibold text-gray-950 hover:bg-accent-strong"
          >
            Tìm
          </button>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Thể loại
        </h3>
        <div className="flex flex-wrap gap-1.5">
          <Chip
            active={!filters.genre}
            onClick={() => onApply({ genre: undefined })}
            label="Tất cả"
          />
          {categories.genres.map((g) => (
            <Chip
              key={g.id}
              active={filters.genre === g.slug}
              onClick={() =>
                onApply({ genre: filters.genre === g.slug ? undefined : g.slug })
              }
              label={g.name}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Nền tảng
        </h3>
        <div className="flex flex-wrap gap-1.5">
          <Chip
            active={!filters.platform}
            onClick={() => onApply({ platform: undefined })}
            label="Tất cả"
          />
          {categories.platforms.map((p) => (
            <Chip
              key={p.id}
              active={filters.platform === p.slug}
              onClick={() =>
                onApply({
                  platform: filters.platform === p.slug ? undefined : p.slug,
                })
              }
              label={p.name}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Giá
        </h3>
        <div className="space-y-1">
          {priceRanges.map((r, i) => (
            <label
              key={i}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink-soft transition hover:bg-surface-2 hover:text-ink"
            >
              <input
                type="radio"
                name="price"
                checked={activePriceIndex === i}
                onChange={() =>
                  onApply({ minPrice: r.min, maxPrice: r.max })
                }
                className="h-4 w-4 accent-accent"
              />
              {r.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onClear}
          className={cn(
            "flex items-center gap-1 text-sm font-medium transition",
            Object.keys(filters).length > 2
              ? "text-accent hover:underline"
              : "text-ink-soft"
          )}
        >
          <X size={14} />
          Xóa bộ lọc
        </button>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition",
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-edge text-ink-soft hover:border-accent/40 hover:text-ink"
      )}
    >
      {label}
    </button>
  );
}
