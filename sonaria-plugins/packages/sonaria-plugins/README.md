# sonaria-plugins

All-in-one plugin suite for [Sonaria](https://www.npmjs.com/package/sonaria) —
function-call setups in the style of the `@distube/*` plugin ecosystem.

```bash
bun add sonaria-plugins
# or: npm install sonaria-plugins
```

## Quick start

```ts
import { Sonaria, voice } from "sonaria";
import { sonariaPlugins } from "sonaria-plugins";
import { Client } from "seyfert";

const client = new Client({ plugins: [voice()] });

const sonaria = new Sonaria(client, {
  plugins: sonariaPlugins({
    deezer: { arl: process.env.DEEZER_ARL },
    spotify: { clientId: process.env.SPOTIFY_ID, clientSecret: process.env.SPOTIFY_SECRET },
  }),
});
```

`sonariaPlugins()` returns every source in the recommended registration order:

| # | Source      | Plugin              | Package                    | Streams directly |
| - | ----------- | ------------------- | -------------------------- | ---------------- |
| 1 | Deezer      | `deezer()`          | `sonaria-plugin-deezer`    | ARL / mirror     |
| 2 | YouTube     | `youtube()`         | `sonaria-plugin-youtube`   | yt-dlp           |
| 3 | SoundCloud  | `soundcloud()`      | `sonaria-plugin-soundcloud`| API              |
| 4 | Spotify     | `spotify()`         | `sonaria-plugin-spotify`   | mirror only      |
| 5 | Apple Music | `applemusic()`      | `sonaria-plugin-applemusic`| mirror only      |

Deezer, YouTube and SoundCloud are **extractor** plugins: they can stream.
Spotify and Apple Music are **info** plugins: they resolve links with original
metadata and Sonaria mirrors playback through the extractors in registration
order (**Deezer → YouTube → SoundCloud**).

You can also use the individual factories directly:

```ts
import { deezer, soundcloud, spotify, youtube, applemusic } from "sonaria-plugins";

const plugins = [
  deezer({ arl: process.env.DEEZER_ARL }),
  youtube({ downloader: "auto" }),
  soundcloud(),
  spotify(),
  applemusic(),
];
```

## `sonariaPlugins(options)`

| Option       | Type                          | Description                                        |
| ------------ | ----------------------------- | -------------------------------------------------- |
| `deezer`     | `DeezerPluginOptions \| false`     | Deezer options, `false` to leave the source out. |
| `youtube`    | `YouTubePluginOptions \| false`    | YouTube options.                                  |
| `soundcloud` | `SoundCloudPluginOptions \| false` | SoundCloud options.                               |
| `spotify`    | `SpotifyPluginOptions \| false`    | Spotify options.                                  |
| `applemusic` | `AppleMusicPluginOptions \| false` | Apple Music options.                              |

Everything from the individual packages is re-exported from the umbrella, so a
single dependency is enough:

```ts
import { deezer, SpotifyPlugin, parseDeezerUrl } from "sonaria-plugins";
```

## How mirror playback works

1. A user sends a Spotify or Apple Music link.
2. The info plugin resolves it into a `Song`/`Playlist` with
   `playFromSource: false` and the **original metadata** (title, artists,
   duration, cover, album).
3. When the song starts, Sonaria calls `createSearchQuery(song)` and searches
   the registered extractor plugins **in registration order** — Deezer first,
   then YouTube, then SoundCloud.
4. The queue keeps showing the original Spotify/Apple Music metadata while the
   extractor streams the audio.

## Packages

- [`sonaria-plugin-core`](../core) — shared internals (fetch, cache, errors, mirror helpers, yt-dlp wrapper, Blowfish).
- [`sonaria-plugin-deezer`](../deezer) — Deezer extractor (ARL + decrypting proxy, previews, mirror).
- [`sonaria-plugin-youtube`](../youtube) — YouTube extractor (yt-dlp direct/download/manual, Innertube metadata).
- [`sonaria-plugin-soundcloud`](../soundcloud) — SoundCloud extractor (api-v2, progressive/HLS, SNIP handling).
- [`sonaria-plugin-spotify`](../spotify) — Spotify info plugin (Web API or public embed metadata).
- [`sonaria-plugin-applemusic`](../applemusic) — Apple Music info plugin (iTunes lookup + page data).

## License

MIT © Fluxo
