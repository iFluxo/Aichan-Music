# sonaria-plugin-deezer

Deezer extractor plugin for [Sonaria](https://www.npmjs.com/package/sonaria) — function-call setup in the
style of the `@distube/*` plugin ecosystem.

- **Metadata** from the public Deezer API (tracks, albums, playlists, artists, search).
- **Full-length playback** when you provide an `arl` cookie: the encrypted
  `BF_CBC_STRIPE` media is decrypted on the fly by a loopback stream proxy.
- **Mirror fallback** to your other Sonaria plugins (YouTube → SoundCloud by
  default) while keeping Deezer metadata.
- **30 second preview** as a last resort.

## Install

```bash
bun add sonaria-plugin-deezer
# or: npm install sonaria-plugin-deezer
```

Requires `sonaria` `^0.2.0` as a peer dependency, same as the rest of the suite.

## Quick start

```ts
import { Client } from "seyfert";
import { Sonaria, voice } from "sonaria";
import { deezer } from "sonaria-plugin-deezer";

const client = new Client({ plugins: [voice()] });

const sonaria = new Sonaria(client, {
  // Order matters: plugins are tried in this order when resolving a query
  // that is not a URL. Put Deezer first so its metadata wins.
  plugins: [deezer({ arl: process.env.DEEZER_ARL })],
});
```

Every plugin is a plain factory function — `deezer()`, `youtube()`,
`soundcloud()`, `spotify()`, `applemusic()` — exactly like `@distube/deezer`.

## Options

| Option             | Type                                    | Default               | Description                                                                                         |
| ------------------ | --------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------- |
| `arl`              | `string`                                | –                     | Deezer `arl` cookie. Enables full-length direct playback.                                           |
| `masterDecryptKey` | `string`                                | derived per track     | Blowfish key override for `BF_CBC_STRIPE` media (32 hex chars or 16 byte text).                     |
| `quality`          | `"MP3_128" \| "MP3_320" \| "FLAC"`      | `"MP3_128"`           | Requested quality; automatically downgraded when the account offers less.                           |
| `mirror`           | `boolean \| MirrorSourceName[]`         | `["youtube", "soundcloud"]` | Mirror sources used when direct playback is unavailable. `false` disables mirroring.          |
| `previewFallback`  | `boolean`                               | `true`                | Fall back to the 30 second public preview when nothing else works.                                  |
| `searchLimit`      | `number`                                | `1`                   | Deezer search results considered in `searchSong`.                                                   |
| `searchQuery`      | `(song: Song) => string`                | `"<title> <artist>"`  | Builds the mirror lookup query.                                                                     |
| `artistTracks`     | `number`                                | `50`                  | Tracks resolved from an artist URL.                                                                 |
| `relatedLimit`     | `number`                                | `10`                  | Tracks returned by `getRelatedSongs`.                                                               |
| `requestTimeout`   | `number`                                | `15_000`              | Timeout for Deezer HTTP calls, in ms.                                                               |
| `proxy`            | `DeezerStreamProxyOptions`              | –                     | `host`/`port`/`ttlMs`/`maxSessions` for the local decrypting proxy.                                 |
| `debug`            | `(message: string) => void`             | –                     | Verbose logging hook.                                                                               |

## Playback strategy

1. **Direct** — with a valid `arl` (and an account allowed to stream) the plugin
   asks `media.deezer.com` for the encrypted file, derives the Blowfish key
   (`masterDecryptKey`, otherwise `md5(trackId)` based) and exposes it through a
   loopback `http://127.0.0.1:<port>/<token>` URL that FFmpeg can consume.
   `Range` requests are forwarded to the CDN, so seeking keeps working.
2. **Mirror** — when direct playback is unavailable the track is looked up
   through the registered mirror plugins, in order. Metadata stays Deezer's.
   A Deezer `Song` is only returned from `searchSong` when one of these paths
   works, so the Spotify/Apple Music plugins can chain
   **Deezer → YouTube → SoundCloud** naturally.
3. **Preview** — Deezer's public 30 second preview.

## Supported URLs

```
https://www.deezer.com/track/<id>
https://www.deezer.com/album/<id>
https://www.deezer.com/playlist/<id>
https://www.deezer.com/artist/<id>
```

Localized links (`/en/…`, `/pt-br/…`) work as well.

## Getting an ARL

The `arl` cookie identifies your Deezer web session:

1. Log in at [deezer.com](https://www.deezer.com).
2. Open the browser dev tools → **Application → Cookies → `https://www.deezer.com`**.
3. Copy the value of the `arl` cookie into `DEEZER_ARL`.

> Keep the cookie secret, never commit it, and be aware that using one is your
> own responsibility — Deezer may rate-limit or invalidate it.

`masterDecryptKey` is not needed for normal use: the key is derived from the
track id automatically. Provide it only when you want to force a specific key.

## Mirror setup

```ts
import { applemusic, deezer, soundcloud, spotify, youtube, sonariaPlugins } from "sonaria-plugins";

const sonaria = new Sonaria(client, {
  // Deezer is tried first for every non-URL query (metadata priority),
  // YouTube second, SoundCloud last: Deezer → YouTube → SoundCloud.
  plugins: sonariaPlugins({ deezer: { arl: process.env.DEEZER_ARL } }),
});
```

Because Sonaria uses plugin registration order as fallback priority, the
mirror chain for a Deezer song simply mirrors the order you register.

## License

MIT © Fluxo
