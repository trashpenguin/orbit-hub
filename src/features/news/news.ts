export type NewsLevel = "info" | "warning" | "critical";

export interface NewsItem {
  id: string;
  level: NewsLevel;
  message: string;
  url?: string;
}

interface NewsResponse {
  id?: unknown;
  level?: unknown;
  message?: unknown;
  url?: unknown;
}

const NEWS_URL = (import.meta.env?.BASE_URL ?? "/") + "news.json";

const LEVELS: NewsLevel[] = ["info", "warning", "critical"];

async function fetchNewsFrom(url: string, signal?: AbortSignal): Promise<NewsItem | null> {
  const response = await fetch(url, { signal, cache: "no-store" });
  if (!response.ok) throw new Error(`News endpoint returned HTTP ${response.status}.`);
  const body = await response.json() as NewsResponse;
  const id = typeof body.id === "string" ? body.id.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!id || !message) return null;
  const level: NewsLevel = LEVELS.includes(body.level as NewsLevel) ? (body.level as NewsLevel) : "info";
  const link = typeof body.url === "string" && body.url.trim() ? body.url.trim() : undefined;
  return { id, level, message, url: link };
}

export function fetchNews(signal?: AbortSignal): Promise<NewsItem | null> {
  return fetchNewsFrom(NEWS_URL, signal);
}
