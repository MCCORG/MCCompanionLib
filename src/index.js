export const DEFAULT_BASE_URL = "https://api.mccompanion.net";

export class MCCompanionError extends Error {
  constructor(message, { status, code, path } = {}) {
    super(message);
    this.name = "MCCompanionError";
    this.status = status;
    this.code = code;
    this.path = path;
  }
}

const DEFAULTS = {
  baseUrl: DEFAULT_BASE_URL,
  timeout: 15_000,
  retries: 2,
  userAgent: "mccompanion-js",
  requestsPerMinute: 50,
};

export class MCCompanion {
  #recent = [];

  constructor(options = {}) {
    this.options = { ...DEFAULTS, ...options };
  }

  async #throttle() {
    const limit = this.options.requestsPerMinute;
    if (!limit) return;
    const minute = 60_000;
    for (;;) {
      const now = Date.now();
      this.#recent = this.#recent.filter((t) => now - t < minute);
      if (this.#recent.length < limit) {
        this.#recent.push(now);
        return;
      }
      await sleep(minute - (now - this.#recent[0]) + 20);
    }
  }

  async request(path, { query, signal } = {}) {
    await this.#throttle();
    const { baseUrl, timeout, retries, userAgent } = this.options;
    const url = new URL(baseUrl.replace(/\/$/, "") + path);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }

    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      const onAbort = () => controller.abort();
      signal?.addEventListener("abort", onAbort, { once: true });

      try {
        const res = await fetch(url, {
          headers: { Accept: "application/json", "User-Agent": userAgent },
          signal: controller.signal,
        });

        const body = await res.json().catch(() => null);
        if (res.status === 429) {
          const err = new MCCompanionError(
            "Rate limited. Do not retry immediately: three rate limit hits within " +
            "tn minutes get the calling address banned permanently.",
            { status: 429, code: body?.error, path },
          );
          err.retryAfter = Number(res.headers.get("retry-after")) || null;
          throw err;
        }
        if (!res.ok) {
          throw new MCCompanionError(body?.message || `Request failed with ${res.status}`, {
            status: res.status,
            code: body?.error,
            path,
          });
        }
        return body;
      } catch (err) {
        if (err instanceof MCCompanionError) throw err;
        lastError = err;
        if (attempt === retries) break;
        await sleep(2 ** attempt * 250);
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
      }
    }
    throw lastError;
  }

  java(identifier, opts) {
    return this.request(`/api/lookup/java/${encodeURIComponent(identifier)}`, opts);
  }

  bedrock(identifier, opts) {
    return this.request(`/api/lookup/bedrock/${encodeURIComponent(identifier)}`, opts);
  }

  lookup(identifier, opts) {
    return this.request(`/api/lookup/bedrock-java/${encodeURIComponent(identifier)}`, opts);
  }

  metrics(opts) {
    return this.request("/api/metrics", opts);
  }

  leaderboards(opts) {
    return this.request("/api/leaderboards", opts);
  }

  featuredServers(opts) {
    return this.request("/api/featured-servers", opts);
  }

  featuredPacks(opts) {
    return this.request("/api/featured-packs", opts);
  }

  featuredPack(slug, opts) {
    return this.request(`/api/featured-packs/${encodeURIComponent(slug)}`, opts);
  }

  skinGallery(opts) {
    return this.request("/api/skins/gallery", opts);
  }

  topSkins(opts) {
    return this.request("/api/skins/top", opts);
  }

  skin(id, opts) {
    return this.request(`/api/skins/${encodeURIComponent(id)}`, opts);
  }

  skinsByUser(username, opts) {
    return this.request(`/api/skins/user/${encodeURIComponent(username)}`, opts);
  }

  profile(username, opts) {
    return this.request(`/api/users/${encodeURIComponent(username)}/profile`, opts);
  }

  version(opts) {
    return this.request("/api/version", opts);
  }

  health(opts) {
    return this.request("/api/health", opts);
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default new MCCompanion();
