# sonaria-plugin-youtube

YouTube extractor plugin for [Sonaria](https://www.npmjs.com/package/sonaria) — function-call setup in the
style of the `@distube/*` plugin ecosystem.

- **Three downloader modes**: yt-dlp direct URLs, yt-dlp downloads, or your
  own manual downloader callback.
- **Innertube fallback** for search, video metadata and playlists when yt-dlp
  is missing (playback still needs yt-dlp or a manual downloader, because
  YouTube's player requires signature deciphering).
- Playlists, related songs (YouTube Mix), views/likes/live metadata.

## Install

```bash
bun add sonaria-plugin-youtube
# or: npm install sonaria-plugin-youtube
```

yt-dlp is optional: use your system binary, let the plugin bootstrap one with
`autoInstall`, or bring your own downloader.

## Quick start

```ts
import { Client } from "seyfert";
import { Sonaria, voice } from "sonaria";
import { youtube } from "sonaria-plugin-youtube";

const client = new Client({ plugins: [voice()] });

const sonaria = new Sonaria(client, {
  plugins: [youtube({ ytdlp: { autoInstall: true } })],
});
```

## Downloader modes

| `downloader` | Behaviour                                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| `"auto"`     | yt-dlp direct URL, falling back to a download when the format needs merging (default).                |
| `"direct"`   | `yt-dlp -f … -j` → uses `info.url` (a temporary `googlevideo.com` URL).                               |
| `"download"` | yt-dlp downloads the audio to disk and the plugin hands Sonaria a `file://` URL.                      |
| `"manual"`   | Your `download` callback returns a file path or URL — no yt-dlp required.                             |

```ts
// Let yt-dlp download and keep files for 30 minutes (default cleanup).
youtube({ downloader: "download", downloadDir: "/var/cache/music" });

// Bring your own downloader (private API, pre-downloaded library, …).
youtube({
  downloader: "manual",
  download: async ({ id, url, song }) => {
    return await myDownloader(id); // "/music/abc.opus" or "https://…"
  },
});
```

## Options

| Option              | Type                              | Default                                             | Description                                                   |
| ------------------- | --------------------------------- | --------------------------------------------------- | ------------------------------------------------------------- |
| `downloader`        | `"auto" \| "direct" \| "download" \| "manual"` | `"auto"`                               | How playable audio is obtained.                               |
| `download`          | `(info) => string`                | –                                                   | Manual downloader for `"manual"`.                             |
| `ytdlp`             | `YtDlpOptions`                    | –                                                   | `path`, `cookiesFromBrowser`, `autoInstall`, `cacheDir`, `format`, `args`, … |
| `downloadDir`       | `string`                          | yt-dlp cache `/downloads`                           | Target of `"download"` mode.                                  |
| `cleanupDownloads`  | `boolean`                         | `true`                                              | Delete downloaded files after playback.                       |
| `downloadTtlMs`     | `number`                          | `1_800_000`                                         | Cleanup delay in ms.                                          |
| `format`            | `string`                          | `"bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best"` | yt-dlp format selector.                                 |
| `innertube`         | `boolean \| InnertubeOptions`     | `true`                                              | Innertube fallback for search/metadata.                       |
| `search`            | `"auto" \| "ytdlp" \| "innertube"`| `"auto"`                                            | Preferred search backend.                                     |
| `playlistLimit`     | `number`                          | `100`                                               | Videos resolved from a playlist URL.                          |
| `searchLimit`       | `number`                          | `1`                                                 | Results considered by `searchSong`.                           |
| `relatedLimit`      | `number`                          | `10`                                                | Tracks returned by `getRelatedSongs`.                         |
| `debug`             | `(message: string) => void`       | –                                                   | Verbose logging hook.                                         |

## Search fallback chain

`searchSong()` returns `null` when playback is impossible (no yt-dlp and no
manual downloader), so a registration order like
**Spotify → Apple Music → Deezer → YouTube → SoundCloud** keeps working: the
next plugin in Sonaria's list answers the query instead.

## Supported URLs

```
https://www.youtube.com/watch?v=<id>
https://youtu.be/<id>
https://www.youtube.com/shorts/<id> | /embed/<id> | /live/<id>
https://www.youtube.com/playlist?list=<id>
```

## License

MIT © Fluxo
