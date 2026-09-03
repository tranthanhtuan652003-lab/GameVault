import type { GameListParams } from "./types";

type Params = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function gamesQueryFromParams(params: Params): {
  query: GameListParams;
  sort: string;
  genre: string;
  platform: string;
  search: string;
  page: number;
} {
  const search = first(params.search) ?? "";
  const genre = first(params.genre) ?? "";
  const platform = first(params.platform) ?? "";
  const sort = first(params.sort) ?? "newest";
  const pageRaw = parseInt(first(params.page) ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const query: GameListParams = {
    page,
    pageSize: 12,
    sort,
    search: search || undefined,
    genre: genre || undefined,
    platform: platform || undefined,
  };

  return { query, sort, genre, platform, search, page };
}
