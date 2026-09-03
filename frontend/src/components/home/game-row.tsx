import type { GameDto } from "@/lib/types";
import { GameCard } from "@/components/game/game-card";
import { Stagger, StaggerItem } from "@/components/ui/reveal";

export function GameRow({ games }: { games: GameDto[] }) {
  if (!games.length) {
    return (
      <div className="rounded-xl border border-dashed border-edge py-16 text-center text-ink-soft">
        Chưa có game nào.
      </div>
    );
  }
  return (
    <Stagger className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
      {games.map((game) => (
        <StaggerItem key={game.id}>
          <GameCard game={game} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}
