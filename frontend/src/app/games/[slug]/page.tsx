import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { api } from "@/lib/api";
import { GameDetailClient } from "@/components/game/game-detail-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: PageProps<"/games/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  try {
    const game = await api.games.bySlug(slug);
    return { title: game.title };
  } catch {
    return { title: "Game" };
  }
}

export default async function GameDetailPage({
  params,
}: PageProps<"/games/[slug]">) {
  const { slug } = await params;
  let game;
  try {
    game = await api.games.bySlug(slug);
  } catch {
    notFound();
  }

  const [reviews] = await Promise.all([
    api.reviews.forGame(game.id).catch(() => null),
  ]);

  return (
    <div className="pb-20">
      <GameDetailClient game={game} reviews={reviews} />
    </div>
  );
}
