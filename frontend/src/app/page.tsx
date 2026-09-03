import { api } from "@/lib/api";
import { SectionHeading } from "@/components/ui/section-heading";
import { ExploreLink } from "@/components/ui/explore-link";
import { Reveal } from "@/components/ui/reveal";
import { Hero } from "@/components/home/hero";
import { GameRow } from "@/components/home/game-row";
import { GenreGrid } from "@/components/home/genre-grid";
import { CTASection } from "@/components/home/cta";

export const revalidate = 60;

export default async function HomePage() {
  const [featured, rated, genres] = await Promise.all([
    api.games.list({ page: 1, pageSize: 8, sort: "sales" }).catch(() => null),
    api.games.list({ page: 1, pageSize: 8, sort: "rating" }).catch(() => null),
    api.games.genres().catch(() => []),
  ]);

  const featuredGames = featured?.items ?? [];
  const ratedGames = rated?.items ?? [];
  const heroGames = featuredGames.slice(0, 3);

  return (
    <div className="flex flex-col">
      <Hero games={heroGames} />

      <section className="container-page py-14">
        <Reveal>
          <SectionHeading
            title="Bán chạy nhất"
            description="Những tựa game được cộng đồng GameVault chọn mua nhiều nhất"
            action={<ExploreLink href="/games?sort=sales" label="Xem tất cả" />}
          />
        </Reveal>
        <GameRow games={featuredGames} />
      </section>

      {genres.length > 0 && (
        <section className="border-y border-edge bg-surface">
          <div className="container-page py-14">
            <Reveal>
              <SectionHeading
                title="Khám phá theo thể loại"
                description="Từ hành động đến chiến thuật — luôn có thứ dành cho bạn"
              />
            </Reveal>
            <GenreGrid genres={genres} />
          </div>
        </section>
      )}

      <section className="container-page py-14">
        <Reveal>
          <SectionHeading
            title="Được đánh giá cao"
            description="Những tựa game điểm số tốt nhất từ người đã mua"
            action={<ExploreLink href="/games?sort=rating" label="Xem tất cả" />}
          />
        </Reveal>
        <GameRow games={ratedGames} />
      </section>

      <CTASection />
    </div>
  );
}
