import fs from "fs";
import path from "path";
import crypto from "crypto";
const SERPER_KEY = process.env.SERPER_API_KEY;
const CACHE_DIR = process.env.MAXEVO_DATA_DIR ?? "/data";
const CFILE = (k) => path.join(CACHE_DIR, "cache", k + ".json");
async function httpJson(url, body) {
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
export async function searchWeb(q) {
    const res = await httpJson("https://google.serper.dev/search", { q });
    return (res.organic || []).map((o) => ({
        url: o.link,
        title: o.title,
        snippet: o.snippet,
        source: o.source
    }));
}
export async function searchNews(q) {
    const res = await httpJson("https://google.serper.dev/news", { q });
    return (res.news || []).map((o) => ({
        url: o.link,
        title: o.title,
        snippet: o.snippet,
        published_at: o.date,
        source: o.source
    }));
}
export async function fetchAndCache(key, fn) {
    fs.mkdirSync(path.join(CACHE_DIR, "cache"), { recursive: true });
    const fp = CFILE(key);
    if (fs.existsSync(fp)) {
        return JSON.parse(fs.readFileSync(fp, "utf8"));
    }
    const data = await fn();
    fs.writeFileSync(fp, JSON.stringify(data));
    return data;
}
export function normKey(obj) {
    return crypto.createHash("sha1").update(JSON.stringify(obj)).digest("hex");
}
//# sourceMappingURL=retriever.js.map