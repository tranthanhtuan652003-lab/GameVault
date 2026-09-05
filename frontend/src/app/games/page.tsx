import { Suspense } from "react";
import { GamesExplorer } from "@/components/games/games-explorer";
import { gamesQueryFromParams } from "@/lib/games-params";
import { GameCardSkeleton } from "@/components/game/game-card-skeleton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function GamesPage({
  searchParams,
}: PageProps<"/games">) {
  const params = await searchParams;
  const query = gamesQueryFromParams(params);

  return (
    <div className="container-page pt-8 pb-20">
      <header className="mb-8">
        <h1 className="text-balance text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Kho game
        </h1>
        <p className="mt-2 text-ink-soft">
          Khám phá, lọc và tìm kiếm toàn bộ game trong kho của GameVault.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <GameCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <GamesExplorer initialQuery={query} />
      </Suspense>
    </div>
  );
}
