import { MCCompanion, MCCompanionError } from "../src/index.js";

let pass = 0, fail = 0;
const check = (n, ok, extra = "") => { ok ? pass++ : fail++; console.log(`  ${ok ? "ok  " : "FAIL"} ${n}${extra ? "  " + extra : ""}`); };

// The throttle must hold requests back rather than let them all through.
class Fake extends MCCompanion {
  constructor(o) { super(o); this.calls = 0; }
  async request(path, opts) { this.calls++; return super.request(path, opts); }
}

const client = new MCCompanion({ requestsPerMinute: 3 });
const started = Date.now();
let done = 0;
const runs = [1, 2, 3].map(async () => {
  await client.health();
  done++;
});
await Promise.all(runs);
check("three calls pass straight through", done === 3 && Date.now() - started < 20_000, `${Date.now() - started}ms`);

// the fourth must wait for the window instead of firing immediately
const before = Date.now();
const slow = new MCCompanion({ requestsPerMinute: 1 });
await slow.health();
const waiting = slow.health();
const raced = await Promise.race([waiting.then(() => "sent"), new Promise(r => setTimeout(() => r("held"), 1500))]);
check("over the limit the call is held back", raced === "held");

// a 429 must never be retried
let attempts = 0;
const original = globalThis.fetch;
globalThis.fetch = async () => {
  attempts++;
  return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429, headers: { "retry-after": "30" } });
};
try {
  await new MCCompanion({ requestsPerMinute: 0, retries: 3 }).health();
  check("429 throws instead of retrying", false, "resolved");
} catch (err) {
  check("429 throws instead of retrying", err instanceof MCCompanionError && err.status === 429 && attempts === 1, `${attempts} poging(en)`);
  check("retryAfter is exposed", err.retryAfter === 30, String(err.retryAfter));
}
globalThis.fetch = original;

console.log(`\n  ${pass} geslaagd, ${fail} mislukt`);
process.exit(fail ? 1 : 0);
