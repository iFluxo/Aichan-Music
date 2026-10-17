# sonaria-plugin-soundcloud

SoundCloud extractor plugin for [Sonaria](https://www.npmjs.com/package/sonaria) — function-call setup in the
style of the `@distube/*` plugin ecosystem.

- **Direct `api-v2` playback** — no third party SoundCloud library.
- **Client id auto-discovery** — the id is scraped from SoundCloud's own
  JavaScript bundles, cached, and re-discovered automatically when it goes stale.
- **Optional OAuth token** — unlocks full length streams of `SNIP` protected
  tracks (without one those tracks play their 30 second preview).
- Tracks, sets/playlists, search, related songs and pagination.

## Install

```bash
bun add sonaria-plugin-soundcloud
# or: npm install sonaria-plugin-soundcloud
```

## Quick start

```ts
import { Client } from "seyfert";
import { Sonaria, voice } from "sonaria";
import { soundcloud } from "sonaria-plugin-soundcloud";

const client = new Client({ plugins: [voice()] });

const sonaria = new Sonaria(client, {
  plugins: [soundcloud()],
});
```

## Options

| Option        | Type                     | Default                      | Description                                                              |
| ------------- | ------------------------ | ---------------------------- | ------------------------------------------------------------------------ |
| `clientId`    | `string`                 | auto-discovered              | Explicit `api-v2` client id.                                             |
| `oauthToken`  | `string`                 | –                            | OAuth token; required for full length streams of `SNIP` protected tracks. |
| `searchLimit` | `number`                 | `1`                          | Results considered in `searchSong`.                                      |
| `relatedLimit`| `number`                 | `10`                         | Tracks returned by `getRelatedSongs`.                                    |
| `timeout`     | `number`                 | `15_000`                     | Request timeout in ms.                                                   |
| `baseUrl`     | `string`                 | `https://api-v2.soundcloud.com` | API base (tests).                                                     |
| `pageUrl`     | `string`                 | `https://soundcloud.com/`    | Page scanned for the client id.                                          |
| `debug`       | `(message: string) => void` | –                         | Verbose logging hook.                                                    |

## How playback works

1. `resolve()` turns any public `soundcloud.com` track or set URL into a `Song`
   or `Playlist` using `/resolve`, then `/playlists/:id` for sets.
2. `getStreamURL()` fetches the track, asks its `media.transcodings` for the
   **progressive** (plain MP3) stream URL, and falls back to the **HLS**
   playlist when only that is available. FFmpeg plays both.
3. Track metadata (including `track_authorization`) is cached for five minutes;
   an expired authorization is detected and refreshed transparently.

### Full length playback

Since 2024 SoundCloud marks many tracks as `policy: "SNIP"`, which limits
anonymous playback to a 30 second preview. Providing an `oauthToken` (from a
logged in session, e.g. `Authorization: OAuth <token>` requests on
`soundcloud.com`) makes the plugin request full length streams for accounts
entitled to them:

```ts
soundcloud({ oauthToken: process.env.SOUNDCLOUD_TOKEN });
```

## Supported URLs

```
https://soundcloud.com/<artist>/<track>
https://soundcloud.com/<artist>/sets/<set>
https://www.soundcloud.com/…  •  https://m.soundcloud.com/…
```

## License

MIT © Fluxo
