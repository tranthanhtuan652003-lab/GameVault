import { XMLParser } from "fast-xml-parser";
import type { NewsCategory, NewsItem, NewsItemSource } from "./news-types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
  cdataPropName: "__cdata",
});

interface FeedSource {
  name: NewsItemSource;
  url: string;
}

const SOURCES: FeedSource[] = [
  { name: "IGN", url: "https://feeds.ign.com/ign/all" },
  { name: "Eurogamer", url: "https://www.eurogamer.net/feed" },
  { name: "Rock Paper Shotgun", url: "https://www.rockpapershotgun.com/feed" },
];

const REVALIDATE_SECONDS = 600;
const NEWS_LIMIT = 20;
const TRANSLATE_CONCURRENCY = 5;
const translateCache = new Map<string, string>();

const CATEGORY_RULES: { category: NewsCategory; test: RegExp }[] = [
  {
    category: "review",
    test: /\b(review|preview|verdict|hands-?on|impressions|rating|score|gameplay overview)\b/i,
  },
  {
    category: "deals",
    test: /\b(deal|save \$|discount|sale|price drop|price cut|permanently reduced|free to grab)\b/i,
  },
  {
    category: "esports",
    test: /\b(esports|tournament|championship|league|playoffs|roster move|signing|scrimmage|season final)\b/i,
  },
  {
    category: "tech",
    test: /\b(artificial intelligence|\bai\b|machine learning|\bcpu\b|\bgpu\b|chip|hardware|steam deck|steam frame|headset|\bvr\b|\bdisplay\b|monitor|operating system|performance concerns)\b/i,
  },
  {
    category: "trailer",
    test: /\b(trailer|teaser|reveal(ed)?|announc(ed|ement)?|unveil(ed)?|release date|launch date|delay(ed)?|postponed|cancel(led|lation)?|remaster|\bfirst look\b|exclusive look)\b/i,
  },
];

function classifyCategory(text: string): NewsCategory {
  for (const rule of CATEGORY_RULES) {
    if (rule.test.test(text)) return rule.category;
  }
  return "news";
}

async function fetchFeed(source: FeedSource): Promise<NewsItem[]> {
  const res = await fetch(source.url, {
    next: { revalidate: REVALIDATE_SECONDS },
    headers: { "User-Agent": "GameVault/1.0 (+news reader; course project)" },
  });
  if (!res.ok) throw new Error(`Feed ${source.name} responded ${res.status}`);
  const xml = await res.text();

  const doc = parser.parse(xml);
  const channel = doc?.rss?.channel ?? doc?.feed ?? doc?.rdf?.RDF;
  let rawItems = channel?.item;
  if (rawItems && !Array.isArray(rawItems)) rawItems = [rawItems];
  if (!Array.isArray(rawItems)) return [];

  const items: NewsItem[] = [];
  for (const raw of rawItems) {
    const item = normalizeItem(raw, source.name);
    if (item) items.push(item);
  }
  return items;
}

function normalizeItem(raw: unknown, source: NewsItemSource): NewsItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const title = readText(r.title);
  const link = readText(r.link);
  if (!title || !link) return null;

  const pubDateRaw = readText(r.pubDate) ?? readText(r.published) ?? readText(r["dc:date"]);
  const pubDate = pubDateRaw ? new Date(pubDateRaw).toISOString() : new Date().toISOString();

  const description = stripHtml(
    readText(r.description) ?? readText(r.summary) ?? readText(r["content:encoded"]) ?? ""
  );

  return {
    id: link,
    title,
    link,
    description: description.slice(0, 220),
    pubDate,
    source,
    image: extractImage(r),
    category: classifyCategory(`${title} ${description}`),
  };
}

function readText(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const cdata = obj.__cdata;
    if (typeof cdata === "string") return cdata.trim() || null;
  }
  return null;
}

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function extractImage(r: Record<string, unknown>): string | null {
  const urls: string[] = [];

  const media = [r["media:content"], r["media:thumbnail"]];
  for (const group of media) {
    const list = Array.isArray(group) ? group : group ? [group] : [];
    for (const entry of list) {
      if (entry && typeof entry === "object") {
        const url = (entry as Record<string, unknown>)["@_url"];
        if (typeof url === "string" && /^https?:\/\//i.test(url)) urls.push(url);
      }
    }
  }

  const html = [r.description, r["content:encoded"], r.summary]
    .map((x) => (typeof x === "string" ? x : x && typeof x === "object" ? (x as Record<string, unknown>).__cdata : ""))
    .filter(Boolean)
    .join(" ");
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && /^https?:\/\//i.test(imgMatch[1])) urls.push(imgMatch[1]);

  return urls.find((u, i) => {
    if (!/^https?:\/\//i.test(u)) return false;
    if (i === 0 && u.includes("apps.mypixel")) return false;
    return true;
  }) ?? null;
}

async function translateToVietnamese(text: string): Promise<string> {
  if (!text) return text;
  const cached = translateCache.get(text);
  if (cached) return cached;

  try {
    const q = encodeURIComponent(text.slice(0, 2000));
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${q}`,
      { headers: { "User-Agent": "Mozilla/5.0 GameVault/1.0" } }
    );
    if (!res.ok) return text;
    const data: unknown = await res.json();
    if (!Array.isArray(data) || !Array.isArray(data[0])) return text;
    const translated = (data[0] as unknown[])
      .map((seg) => (Array.isArray(seg) && typeof seg[0] === "string" ? seg[0] : ""))
      .join("")
      .trim();
    const clean = translated || text;
    if (translateCache.size > 600) translateCache.clear();
    translateCache.set(text, clean);
    return clean;
  } catch {
    return text;
  }
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function getGameNews(limit = NEWS_LIMIT): Promise<NewsItem[]> {
  const settled = await Promise.allSettled(SOURCES.map((s) => fetchFeed(s)));

  const items: NewsItem[] = [];
  for (const result of settled) {
    if (result.status === "fulfilled") items.push(...result.value);
  }

  const seen = new Set<string>();
  const merged = items
    .sort((a, b) => +new Date(b.pubDate) - +new Date(a.pubDate))
    .filter((item) => {
      const key = item.link;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);

  return mapPool(merged, TRANSLATE_CONCURRENCY, async (item) => ({
    ...item,
    title: await translateToVietnamese(item.title),
    description: (await translateToVietnamese(item.description.slice(0, 180))).slice(0, 180),
  }));
}