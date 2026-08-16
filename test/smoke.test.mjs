import mcc, { MCCompanion, MCCompanionError } from "../src/index.js";

let pass = 0, fail = 0;
const check = (name, ok, extra = "") => {
  ok ? pass++ : fail++;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${name}${extra ? "  " + extra : ""}`);
};

const cases = [
  ["version",         () => mcc.version(),                 d => typeof d.version === "string"],
  ["health",          () => mcc.health(),                  d => d.status === "ok"],
  ["metrics",         () => mcc.metrics(),                 d => Array.isArray(d.top)],
  ["leaderboards",    () => mcc.leaderboards(),            d => "skins" in d && "packs" in d],
  ["featuredServers", () => mcc.featuredServers(),         d => Array.isArray(d.servers)],
  ["featuredPacks",   () => mcc.featuredPacks(),           d => Array.isArray(d.packs)],
  ["skinGallery",     () => mcc.skinGallery(),             d => "recent" in d],
  ["topSkins",        () => mcc.topSkins(),                d => Array.isArray(d.skins)],
  ["java lookup",     () => mcc.java("Notch"),             d => d.platform === "java" && !!d.uuid],
  ["bedrock lookup",  () => mcc.bedrock("Notch"),          d => d.platform === "bedrock" && !!d.xuid],
  ["combined lookup", () => mcc.lookup("Notch"),            d => "java" in d && "bedrock" in d],
];

for (const [name, call, valid] of cases) {
  try {
    const data = await call();
    check(name, valid(data), Object.keys(data).slice(0, 3).join(","));
  } catch (err) {
    check(name, false, err.message);
  }
}

// a pack slug taken from the live list, so the test does not hardcode content
try {
  const { packs } = await mcc.featuredPacks();
  const one = await mcc.featuredPack(packs[0].slug);
  check("featuredPack by slug", !!one.pack, packs[0].slug);
} catch (err) { check("featuredPack by slug", false, err.message); }

// the skin and profile methods need real ids, so they are driven off the gallery
try {
  const gallery = await mcc.skinGallery();
  const first = (gallery.recent ?? gallery.top ?? [])[0];
  if (!first) throw new Error("gallery is empty");
  const one = await mcc.skin(first.id);
  check("skin by id", one.id === first.id, String(first.id));
  const byUser = await mcc.skinsByUser(first.username);
  check("skins by user", Array.isArray(byUser.skins), first.username);
  const prof = await mcc.profile(first.username);
  check("profile", !!prof.user, first.username);
} catch (err) {
  check("skin, skinsByUser and profile", false, err.message);
}

// errors must arrive as MCCompanionError with a status, not as a raw throw
try {
  await mcc.java("zzqqxxjjnnbb1");
  check("unknown user gives 404", false, "resolved instead");
} catch (err) {
  check("unknown user gives 404", err instanceof MCCompanionError && err.status === 404, `status ${err.status}`);
}

// a wrong base url must fail fast rather than hang
try {
  await new MCCompanion({ baseUrl: "https://api.mccompanion.net", timeout: 1, retries: 0 }).health();
  check("timeout is honoured", false, "no timeout");
} catch (err) {
  check("timeout is honoured", err.name === "AbortError" || /abort/i.test(err.message), err.name);
}

console.log(`\n  ${pass} geslaagd, ${fail} mislukt`);
process.exit(fail ? 1 : 0);
