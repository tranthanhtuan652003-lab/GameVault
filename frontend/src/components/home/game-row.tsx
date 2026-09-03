import type { GameDto } from "@/lib/types";
import { GameCard } from "@/components/game/game-card";

export function GameRow({ games }: { games: GameDto[] }) {
  if (!games.length) {
    return (
      <div className="rounded-xl border border-dashed border-edge py-16 text-center text-ink-soft">
        Chưa có game nào.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}
