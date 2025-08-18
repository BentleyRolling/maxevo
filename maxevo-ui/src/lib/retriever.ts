import fs from "fs";
import path from "path";
import crypto from "crypto";

const SERPER_KEY = process.env.SERPER_API_KEY!;
const CACHE_DIR = process.env.MAXEVO_DATA_DIR ?? "/data";
const CFILE = (k: string) => path.join(CACHE_DIR, "cache", k + ".json");

export type Retrieved = {
  url: string;
  title: string;
  snippet?: string;
  published_at?: string;
  source?: string;
  text?: string;
};

async function httpJson(url: string, body: any) {
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "X-API-KEY": SERPER_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  return r.json();
}

export async function searchWeb(q: string): Promise<Retrieved[]> {
  const res = await httpJson("https://google.serper.dev/search", { q }) as any;
  return (res.organic || []).map((o: any) => ({
    url: o.link,
    title: o.title,
    snippet: o.snippet,
    source: o.source
  }));
}

export async function searchNews(q: string): Promise<Retrieved[]> {
  const res = await httpJson("https://google.serper.dev/news", { q }) as any;
  return (res.news || []).map((o: any) => ({
    url: o.link,
    title: o.title,
    snippet: o.snippet,
    published_at: o.date,
    source: o.source
  }));
}

export async function fetchAndCache(key: string, fn: () => Promise<any>) {
  fs.mkdirSync(path.join(CACHE_DIR, "cache"), { recursive: true });
  const fp = CFILE(key);
  
  if (fs.existsSync(fp)) {
    return JSON.parse(fs.readFileSync(fp, "utf8"));
  }
  
  const data = await fn();
  fs.writeFileSync(fp, JSON.stringify(data));
  return data;
}

export function normKey(obj: any) {
  return crypto.createHash("sha1").update(JSON.stringify(obj)).digest("hex");
}