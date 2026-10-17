# sonaria-plugin-spotify

Spotify info plugin for [Sonaria](https://www.npmjs.com/package/sonaria) — function-call setup in the
style of the `@distube/*` plugin ecosystem.

- **Original Spotify metadata** for tracks, albums, playlists and artists.
- **Mirror playback**: Spotify cannot be streamed directly, so Sonaria looks the
  song up through the registered extractor plugins using `createSearchQuery()`
  (Deezer → YouTube → SoundCloud by registration order).
- **Works without credentials**: falls back to the public embed page when no
  `clientId`/`clientSecret` (or `accessToken`) is configured.

## Install

```bash
bun add sonaria-plugin-spotify
# or: npm install sonaria-plugin-spotify
```

## Quick start

```ts
import { deezer, soundcloud, spotify, youtube } from "sonaria-plugins";

const sonaria = new Sonaria(client, {
  // Info plugins resolve links, extractor plugins play them.
  plugins: [
    spotify({ clientId: process.env.SPOTIFY_ID, clientSecret: process.env.SPOTIFY_SECRET }),
    deezer({ arl: process.env.DEEZER_ARL }),
    youtube(),
    soundcloud(),
  ],
});
```

Every plugin is a plain factory function — `spotify()`, `deezer()`, `youtube()`,
`soundcloud()`, `applemusic()` — exactly like `@distube/spotify`.

## Options

| Option          | Type                          | Default                          | Description                                                              |
| --------------- | ----------------------------- | -------------------------------- | ------------------------------------------------------------------------ |
| `clientId`      | `string`                      | –                                | Spotify application client id (Web API).                                 |
| `clientSecret`  | `string`                      | –                                | Spotify application client secret (Web API).                             |
| `accessToken`   | `string`                      | –                                | Ready to use bearer token, skips the credentials exchange.                |
| `embedFallback` | `boolean`                     | `true`                           | Use the public embed page when the Web API is unavailable.                |
| `maxTracks`     | `number`                      | `100`                            | Maximum tracks resolved from albums/playlists/artists.                    |
| `relatedLimit`  | `number`                      | `10`                             | Tracks returned by `getRelatedSongs` (artist top tracks).                 |
| `searchQuery`   | `(song: Song) => string`      | `"<name> <artist>"`              | Builds the mirror lookup query.                                           |
| `timeout`       | `number`                      | `15_000`                         | Request timeout in ms.                                                    |
| `debug`         | `(message: string) => void`   | –                                | Verbose logging hook.                                                     |

## How mirror playback works

1. You send a Spotify link. The plugin resolves it into a `Song`/`Playlist`
   with `playFromSource: false` and **Spotify's metadata** (title, artists,
   duration, cover, album).
2. When the song starts, Sonaria calls `createSearchQuery(song)` and searches
   with the **extractor plugins in registration order**
   (Deezer → YouTube → SoundCloud by default).
3. The matching extractor resolves the actual stream. Queue embeds and "now
   playing" messages keep showing the original Spotify metadata.

## Getting credentials

1. Create an app at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard).
2. Copy the **Client ID** and **Client Secret** into `SPOTIFY_ID` /
   `SPOTIFY_SECRET`.

Credentials unlock paginated albums/playlists, artist top tracks and exact
durations. Without them the plugin still reads the embed page, which covers
tracks, albums, playlists and artist top tracks (with some truncation).

## Supported URLs

```
https://open.spotify.com/track/<id>     • https://open.spotify.com/intl-xx/track/<id>
https://open.spotify.com/album/<id>
https://open.spotify.com/playlist/<id>
https://open.spotify.com/artist/<id>
spotify:track:<id> | spotify:album:<id> | spotify:playlist:<id> | spotify:artist:<id>
```

## License

MIT © Fluxo
