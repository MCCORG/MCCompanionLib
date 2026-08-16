# mccompanion

Client for the public [MCCompanion](https://mccompanion.net) API: Minecraft
Java and Bedrock account lookups, server metrics, skins and resource packs.

No account or key is needed. The API allows 60 requests per minute per address.

```bash
npm install mccompanion
```

Node 18 or newer, since it uses the builtin `fetch`.

## Looking up accounts

```js
import mcc from "mccompanion";

const java = await mcc.java("Notch");

const bedrock = await mcc.bedrock("SomeGamertag");

const both = await mcc.lookup("Notch");
```

Java accounts accept a username or a UUID, Bedrock accepts a gamertag or an
XUID.

## Servers, skins and packs

```js
const { top, totalServers } = await mcc.metrics();
const { servers } = await mcc.featuredServers();
const { packs } = await mcc.featuredPacks();
const pack = await mcc.featuredPack(packs[0].slug);
const { skins } = await mcc.topSkins();
const profile = await mcc.profile("Jens");
```

## Errors

Anything other than a 2xx throws an `MCCompanionError` carrying the status and
the API's own error code.

```js
import { MCCompanionError } from "mccompanion";

try {
  await mcc.java("zzqqxxjjnnbb1");
} catch (err) {
  if (err instanceof MCCompanionError && err.status === 404) {
  }
}
```

A missing account is a 404, never a 5xx, so there is no point retrying it.

**A 429 is never retried, and you should not retry it either.** Three
rate limit hits within ten minutes get your address banned permanently. The
error caries `retryAfter` in seconds when the server supplies it.

To stay clear of that, the client spaces its own requests out to 50 per minute
against a published limit of 60. Raise it with `requestsPerMinute` if you know
what you are doing, or pass `0` to turn it off and handle pacing yourself.

## Options

```js
import { MCCompanion } from "mccompanion";

const client = new MCCompanion({
  timeout: 15000,
  retries: 2,
  requestsPerMinute: 50,
  userAgent: "my-app/1.0",
});
```

Setting a `userAgent` is appreciated: it is how we tell traffic apart when
something goes wrong.

Every method takes `{ signal }` if you want to cancel a request yourself.

## What is not here

Everything behind a login. That part of the API authenticates with a Firebase
token issued to the MCCompanion app, which a third party cannot obtain, so
wrapping it would promise something that cannot work.