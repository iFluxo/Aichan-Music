# sonaria-plugin-core

Shared building blocks for the [`sonaria-plugin-*`](..) suite. You normally do
not install this directly — the source packages (`sonaria-plugin-deezer`,
`sonaria-plugin-youtube`, …) depend on it.

```bash
bun add sonaria-plugin-core
# or: npm install sonaria-plugin-core
```

## What's inside

| Module      | Exports                                                        | Used for                                                                 |
| ----------- | -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `errors`    | `SonariaPluginsError`, `errorMessage`                          | Stable error codes (`DEEZER_NO_PLAYABLE_SOURCE`, `YTDLP_NOT_INSTALLED`, …). |
| `fetch`     | `request`, `requestOk`, `fetchJson`, `fetchText`, `HttpError`, `USER_AGENT`, `DEFAULT_TIMEOUT` | JSON/text HTTP helpers with timeouts and readable errors. |
| `cache`     | `TimedCache`                                                   | Small TTL cache used for tokens, client ids, streams.                    |
| `files`     | `isUrl`, `toPlayableUrl`, `sanitizeFileName`, `shortHash`      | Turning paths/URLs into playable input for FFmpeg.                       |
| `mirror`    | `searchMirror`, `resolveMirrorStream`, `isSourcePlugin`        | Resolving a song through the registered extractor plugins.               |
| `types`     | `MirrorSourceName`, `SourcePlugin`, `MirrorSearchResult`, `Awaitable` | Shared plugin interfaces.                                          |
| `ytdlp`     | `YtDlp`, `createYtDlp`, `YtDlpInfo`, `YtDlpOptions`, …         | Wrapper around the `yt-dlp` binary: locate/auto-install, search, info, download. |
| `blowfish`  | `Blowfish`, `BLOWFISH_IV`, `BLOWFISH_INIT`                     | Pure TypeScript Blowfish-CBC used to decrypt Deezer `BF_CBC_STRIPE` media. |

## Example

```ts
import { Blowfish, TimedCache, YtDlp, searchMirror } from "sonaria-plugin-core";

const cache = new TimedCache<string, string>(60_000);
cache.set("token", "…");
const token = cache.get("token") ?? "…";

const ytdlp = new YtDlp({ autoInstall: true });
const info = await ytdlp.info("https://www.youtube.com/watch?v=…");

const mirror = await searchMirror(song, plugins);
```

## Notes

- No runtime dependencies — only Node ≥ 18.17 / Bun built-ins.
- The Blowfish constants are generated from π with the original Machin formula;
  `scripts/generate-blowfish-constants.ts` regenerates them for verification.
- `YtDlp` can use a system binary or auto-install one into a cache directory
  (`~/.sonaria-plugins/ytdlp` by default).

## License

MIT © Fluxo
