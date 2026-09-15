export type NewsItemSource = "IGN" | "Eurogamer" | "Rock Paper Shotgun";

export type NewsCategory =
  | "news"
  | "review"
  | "trailer"
  | "esports"
  | "tech"
  | "deals";

export const NEWS_CATEGORIES: {
  value: NewsCategory | "all";
  label: string;
  dot: string;
}[] = [
  { value: "all", label: "Tất cả", dot: "bg-accent" },
  { value: "review", label: "Đánh giá", dot: "bg-amber-400" },
  { value: "trailer", label: "Ra mắt & Trailer", dot: "bg-violet-400" },
  { value: "news", label: "Tin tức", dot: "bg-sky-400" },
  { value: "esports", label: "Esports", dot: "bg-rose-400" },
  { value: "tech", label: "Công nghệ", dot: "bg-emerald-400" },
  { value: "deals", label: "Ưu đãi", dot: "bg-fuchsia-400" },
];

export const NEWS_CATEGORY_LABEL: Record<NewsCategory, string> = {
  news: "Tin tức",
  review: "Đánh giá",
  trailer: "Ra mắt & Trailer",
  esports: "Esports",
  tech: "Công nghệ",
  deals: "Ưu đãi",
};

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: NewsItemSource;
  image: string | null;
  category: NewsCategory;
}