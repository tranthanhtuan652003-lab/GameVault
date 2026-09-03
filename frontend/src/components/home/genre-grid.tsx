import Link from "next/link";
import type { GenreDto } from "@/lib/types";

const genreColors = [
  "from-emerald-500/20 to-emerald-500/5",
  "from-sky-500/20 to-sky-500/5",
  "from-rose-500/20 to-rose-500/5",
  "from-amber-500/20 to-amber-500/5",
  "from-violet-500/20 to-violet-500/5",
  "from-teal-500/20 to-teal-500/5",
];

export function GenreGrid({ genres }: { genres: GenreDto[] }) {
  const shown = genres.slice(0, 12);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {shown.map((genre, i) => (
        <Link
          key={genre.id}
          href={`/games?genre=${genre.slug}`}
          className={`group flex h-24 flex-col justify-between rounded-xl border border-edge bg-gradient-to-br p-4 transition hover:border-accent/50 ${
            genreColors[i % genreColors.length]
          }`}
        >
          <span className="text-sm font-semibold text-ink group-hover:text-accent">
            {genre.name}
          </span>
          <span className="text-xs text-ink-soft">Khám phá →</span>
        </Link>
      ))}
    </div>
  );
}
