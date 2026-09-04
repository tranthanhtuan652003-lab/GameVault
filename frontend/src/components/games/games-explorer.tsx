"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { FunnelSimple, X } from "@phosphor-icons/react";
import type { GameDto, GenreDto, PlatformDto, PagedResult } from "@/lib/types";
import { api } from "@/lib/api";
import { GameCard } from "@/components/game/game-card";
import { GameCardSkeleton } from "@/components/game/game-card-skeleton";
import { Pagination } from "@/components/ui/pagination";
import { Filters } from "@/components/games/filter-sidebar";
import { Stagger, StaggerItem } from "@/components/ui/reveal";
import type { GameListParams } from "@/lib/types";
import { gamesQueryFromParams } from "@/lib/games-params";

const sortOptions = [
  { value: "newest", label: "Mới nhất" },
  { value: "sales", label: "Bán chạy" },
  { value: "rating", label: "Đánh giá cao" },
  { value: "price_asc", label: "Giá tăng dần" },
  { value: "price_desc", label: "Giá giảm dần" },
];

export function GamesExplorer({ initialQuery }: { initialQuery: GameListParams }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<GameListParams>(initialQuery);
  const [data, setData] = useState<PagedResult<GameDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<{
    genres: GenreDto[];
    platforms: PlatformDto[];
  }>({ genres: [], platforms: [] });
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    api.games.genres().then((g) => setCategories((c) => ({ ...c, genres: g }))).catch(() => {});
    api.games.platforms().then((p) => setCategories((c) => ({ ...c, platforms: p }))).catch(() => {});
  }, []);

  useEffect(() => {
    api.games
      .list(filters)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters]);

  // Đồng bộ bộ lọc khi URL thay đổi từ bên ngoài (navbar search, genre link, back/forward)
  // để tránh grid hiển thị kết quả cũ không khớp URL.
  useEffect(() => {
    const urlQuery = gamesQueryFromParams(Object.fromEntries(searchParams.entries())).query;
    const changed =
      (filters.search ?? "") !== (urlQuery.search ?? "") ||
      (filters.genre ?? "") !== (urlQuery.genre ?? "") ||
      (filters.platform ?? "") !== (urlQuery.platform ?? "") ||
      (filters.sort ?? "newest") !== (urlQuery.sort ?? "newest") ||
      (filters.page ?? 1) !== (urlQuery.page ?? 1);
    if (changed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilters(urlQuery);
      setLoading(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const applyFilters = useCallback(
    (patch: Partial<GameListParams>) => {
      const next: GameListParams = { ...filters, ...patch, page: patch.page ?? 1 };
      setFilters(next);
      setLoading(true);
      const sp = new URLSearchParams();
      if (next.search) sp.set("search", next.search);
      if (next.genre) sp.set("genre", next.genre);
      if (next.platform) sp.set("platform", next.platform);
      if (next.sort && next.sort !== "newest") sp.set("sort", next.sort);
      if (next.page && next.page > 1) sp.set("page", String(next.page));
      const qs = sp.toString();
      router.push(`/games${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [filters, router]
  );

  const clearFilters = () => {
    setLoading(true);
    setFilters({ page: 1, pageSize: 12, sort: "newest" });
    router.push("/games", { scroll: false });
  };

  const hasActiveFilters =
    !!filters.search || !!filters.genre || !!filters.platform || filters.sort !== "newest";

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block">
        <Filters
          filters={filters}
          categories={categories}
          onApply={applyFilters}
          onClear={clearFilters}
        />
      </aside>

      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-2 text-sm font-medium text-ink lg:hidden"
          >
            <FunnelSimple size={16} />
            Lọc
            {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-accent" />}
          </button>

          <div className="ml-auto flex items-center gap-3">
            {data && !loading && (
              <span className="text-sm text-ink-soft">
                {data.totalCount} game
                {filters.search && (
                  <>
                    {" "}cho “<span className="text-ink">{filters.search}</span>”
                  </>
                )}
              </span>
            )}
            <select
              value={filters.sort ?? "newest"}
              onChange={(e) => applyFilters({ sort: e.target.value })}
              className="h-9 rounded-lg border border-edge bg-surface px-3 text-sm text-ink focus:border-accent focus:outline-none"
              aria-label="Sắp xếp"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <AnimatePresence>
          {mobileFilterOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileFilterOpen(false)}
                className="fixed inset-0 z-[70] bg-black/60 lg:hidden"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                className="fixed left-0 top-0 z-[80] h-full w-80 overflow-y-auto border-r border-edge bg-surface p-5 lg:hidden"
              >
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="font-bold text-ink">Bộ lọc</h3>
                  <button onClick={() => setMobileFilterOpen(false)} className="text-ink-soft hover:text-ink">
                    <X size={20} />
                  </button>
                </div>
                <Filters
                  filters={filters}
                  categories={categories}
                  onApply={(p) => {
                    applyFilters(p);
                    setMobileFilterOpen(false);
                  }}
                  onClear={() => {
                    clearFilters();
                    setMobileFilterOpen(false);
                  }}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {error ? (
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-8 text-center text-danger">
            {error}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <GameCardSkeleton key={i} />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-edge py-20 text-center">
            <p className="text-ink-soft">Không tìm thấy game nào phù hợp.</p>
            <button
              onClick={clearFilters}
              className="mt-4 text-sm font-semibold text-accent hover:underline"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <Stagger className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {data.items.map((game) => (
              <StaggerItem key={game.id}>
                <GameCard game={game} />
              </StaggerItem>
            ))}
          </Stagger>
        )}

        {data && data.totalPages > 1 && (
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onChange={(p) => applyFilters({ page: p })}
          />
        )}
      </div>
    </div>
  );
}
