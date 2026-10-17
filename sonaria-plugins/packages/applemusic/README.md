# sonaria-plugin-applemusic

Apple Music info plugin for [Sonaria](https://www.npmjs.com/package/sonaria) — function-call setup in the
style of the `@distube/*` plugin ecosystem.

- **Original Apple Music metadata** for tracks, albums, playlists and artists.
- **Mirror playback**: Apple Music cannot be streamed directly, so Sonaria looks
  the song up through the registered extractor plugins using
  `createSearchQuery()` (Deezer → YouTube → SoundCloud by registration order).
- **No credentials required**: tracks and albums come from the public iTunes
  lookup API, playlists and artist top songs from the Apple Music page's
  `serialized-server-data` JSON.

## Install

```bash
bun add sonaria-plugin-applemusic
# or: npm install sonaria-plugin-applemusic
```

## Quick start

```ts
import { deezer, applemusic, soundcloud, youtube } from "sonaria-plugins";

const sonaria = new Sonaria(client, {
  // Info plugins resolve links, extractor plugins play them.
  plugins: [
    applemusic({ storefront: "us" }),
    deezer({ arl: process.env.DEEZER_ARL }),
    youtube(),
    soundcloud(),
  ],
});
```

Every plugin is a plain factory function — `applemusic()`, `deezer()`,
`youtube()`, `soundcloud()`, `spotify()` — exactly like `@distube/applemusic`.

## Options

| Option         | Type                        | Default                          | Description                                             |
| -------------- | --------------------------- | -------------------------------- | ------------------------------------------------------- |
| `storefront`   | `string`                    | `"us"`                           | Storefront used for page URLs (`us`, `id`, `gb`, …).     |
| `maxTracks`    | `number`                    | `100`                            | Maximum tracks resolved from albums/playlists/artists.   |
| `relatedLimit` | `number`                    | `10`                             | Tracks returned by `getRelatedSongs` (artist top songs). |
| `searchQuery`  | `(song: Song) => string`    | `"<name> <artist>"`              | Builds the mirror lookup query.                          |
| `timeout`      | `number`                    | `15_000`                         | Request timeout in ms.                                   |
| `debug`        | `(message: string) => void` | –                                | Verbose logging hook.                                    |

## How mirror playback works

1. You send an Apple Music link. The plugin resolves it into a
   `Song`/`Playlist` with `playFromSource: false` and **Apple Music's metadata**
   (title, artists, duration, cover, album).
2. When the song starts, Sonaria calls `createSearchQuery(song)` and searches
   with the **extractor plugins in registration order**
   (Deezer → YouTube → SoundCloud by default).
3. The matching extractor resolves the actual stream. Queue embeds and "now
   playing" messages keep showing the original Apple Music metadata.

## Notes

- Album and track data come from the [iTunes Lookup API](https://performance-partners.apple.com/search-api);
  when that fails the plugin falls back to scraping the album page.
- Playlists are limited to the first page of the web view (~50 tracks),
  the same list the Apple Music site renders initially.
- The storefront in the URL (`/us/`, `/id/`, …) is respected when resolving.

## Supported URLs

```
https://music.apple.com/<country>/album/<slug>/<id>
https://music.apple.com/<country>/album/<slug>/<id>?i=<trackId>
https://music.apple.com/<country>/song/<slug>/<id>
https://music.apple.com/<country>/playlist/<slug>/pl.<hash>
https://music.apple.com/<country>/artist/<slug>/<id>
```

The country segment is optional (`https://music.apple.com/album/...`).

## License

MIT © Fluxo
