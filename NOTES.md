# Catatan Analisis — Aichan Music

> Catatan hasil analisa cepat. Dipakai sebagai konteks untuk pekerjaan berikutnya.
> Update file ini kalau ada perubahan besar.

## 1. Ringkasan

Bot Discord musik bernama **Aichan Music** (`Meloowwwdy...`), versi `0.0.1`.
Stack utama: **Bun + TypeScript + Seyfert v5**, database **(PostgreSQL via `Bun.SQL` + Redis)**,
plus **Yuna** (command parser & watcher) dan **@slipher/cooldown** (cooldown middleware).

Status repo saat analisa: sumber terlihat masih fase awal/refactor. Beberapa fitur
(command `avatar`, `chat`) hanya tersisa string di file bahasa, command-nya sudah tidak ada.

## 2. Struktur

```
app/
  index.ts                  # bootstrap client, plugins, registry type augmentation
  AichanMusic.ts            # CustomClient + default options (prefix, defaults error handler, presence)
  commands/
    Developer/  eval.ts, shell.ts      # onlyForDev, dibatasi DevGuilds
    Music/      play.ts, skip.ts, stop.ts, pause.ts, resume.ts, nowplaying.ts,
                queue.ts, volume.ts, loop.ts, shuffle.ts, remove.ts, seek.ts, leave.ts
    Utility/    help.ts, language.ts, ping.ts, prefix.ts, stats.ts
  components/
    Button/default.ts, StringSelect/default.ts
  database/
    index.ts                # class AIODatabase (Postgres/Bun.SQL + Redis), cache helper, guild/custom CRUD
  events/Client/
    botReady.ts, messageCreate.ts
  languages/  en.ts, id.ts  # semua string user-facing
  middlewares/
    command.interface.ts    # global middleware: onlyForDev + set locale per guild + log
  plugins/
    database.plugin.ts      # createPlugin -> ctx.db & client.db
    music.plugin.ts         # createPlugin -> ctx.music (MusicService dibuat saat setup)
    webhook.plugin.ts       # createPlugin -> ctx.webhook & client.webhook (Discord webhook helper)
  utils/
    function.ts             # getUser, generateCases, setLocale/resolveLocale, pattern
    logger.ts               # customize Logger (RAM usage), global error handlers
    music.service.ts        # wrapper Sonaria + event PlaySong/AddSong/AddList/Finish/DeleteQueue/Error/Debug
    music.utils.ts          # formatTrack/formatDuration/nowPlayingEmbed/ensureVoiceChannel/requireQueue
    youtube.extractor.ts    # ExtractorPlugin Sonaria berbasis binary yt-dlp
assets/
  config.ts                 # bot, colors, emoji
  commands.template.ts      # template command baru
```

## 3. Alur runtime penting

- `app/index.ts` mendaftarkan plugin: Yuna, cooldown, `voice()` (Sonaria), Database, Music, Webhook; lalu `new Client(...)`
  dengan `globalMiddlewares` dari `middlewares/index.ts`.
- `voice()` dari Sonaria menambahkan intent `GuildVoiceStates`, menyediakan `client.voice`/`ctx.voice`, dan `setup()`-nya
  memanggil `manager.attach(client)`. `MusicPlugin.setup()` membuat `MusicService` (Sonaria) setelah semua client map plugin
  terpasang, sehingga `client.voice` sudah tersedia.
- Type module augmentation ada di `index.ts` (`SeyfertRegistry`, `ExtraProps.onlyForDev`, `ExtendContext.config/readyAt`).
- Middleware `command.interface.ts`: cek `onlyForDev`, ambil locale guild dari DB lalu `setLocale()` (in-memory Map)
  dan override `ctx.t`, lalu log penggunaan command.
- Prefix message dihitung di `AichanMusic.ts` (`commands.prefix`), termasuk prefix custom per guild via `db.getPrefix`.
- Lokalisasi: default `en`, alias `en-US`/`id-ID`. File bahasa harus selalu sinkron `en` & `id`.

## 4. Konvensi (lihat `AGENTS.md`)

- **Tanpa komentar di kode.**
- Konstanta user-defined & import pakai **PascalCase** (`SPIN_DELAY_MS` → `SpinDelayMs`, akronim jadi kata: `Id`, `Ai`, `Ms`, `Ttl`).
- Kecuali identifier library/API yang wajib snake_case (option Seyfert seperti `min_value`, field payload Discord seperti `allowed_mentions`, nama kolom DB).
- Emoji dekoratif terpusat di `assets/config.ts`.
- Sebelum selesai: `bunx tsc --noEmit` dan `bunx @biomejs/biome check .`.

### Catatan drift konvensi vs kode
- `AGENTS.md` menyebut export `emoji` (singular) dan `{ emoji } from "#config"` — sudah sesuai: `assets/config.ts` mengekspor
  `emoji` dengan key `#Developer/#Music/#Utility`, `error`, dan sub-objek `music.*`. `help.ts` memakai
  `import { emoji as categoryEmoji } from "#config"`.
- `AGENTS.md` menyebut item catalog `app/plugins/items.ts` yang **tidak ada** di repo ini. Kemungkinan konvensi hasil copy dari project lain — perlu disesuaikan.

## 5. Status kesehatan

Sudah **bersih** per perbaikan terakhir:
- `bunx tsc --noEmit` → **OK** (exit 0).
- `bunx @biomejs/biome check .` → **0 warning / 0 error** (45 file dicek).
- `bun build app/index.ts --target=bun` → **OK** (semua import resolve).
- Catatan: instalasi `@types/node`/`typescript`/`@types/bun` sempat rusak karena hardlink cache bun
  (file jadi tidak terbaca — error `Invalid argument` di environment ini). Solusi: hapus `~/.bun/install/cache`
  lalu `bun install` ulang. Kalau muncul lagi, ulangi langkah yang sama.

## 6. Temuan / kandidat perbaikan

### Sudah diperbaiki
> Catatan: poin 6–8 di bawah menyangkut `MusicManager`/Shoukaku lama yang **sudah dihapus** pada migrasi ke Sonaria (lihat sub-bagian "Migrasi musik"); poin 9 (base Alpine) digantikan oleh poin 16.
1. ✅ **Bug prefix** — `app/AichanMusic.ts:33` diperbaiki dari `.bot` menjadi `.config` (lalu `.config.bot`).
2. ✅ **`stats.ts`** — import & variabel tak terpakai (`formatMemoryUsage`, `memory`) kini dipakai untuk field memori (RSS), memakai key bahasa `stats.fields.memory` yang sudah ada.
3. ✅ **Instalasi dependencies** — cache bun lama dibersihkan sehingga `@types/node`/`typescript` terpasang lengkap.
4. ✅ **Migrasi Turso/Drizzle → Postgres/Bun.SQL** — hapus `drizzle-orm`, `drizzle-kit`, `@tursodatabase/serverless`,
   `drizzle.config.ts`, dan `app/database/drizzle.schema.ts`. `AIODatabase` sekarang pakai `new SQL(options)` dari `bun`
   (`hostname/port/database/username/password`), tabel dibuat otomatis (`CREATE TABLE IF NOT EXISTS`) di `ensureSchema()`,
   kolom JSON pakai `JSONB`. Script `db:*` di `package.json` dihapus.
5. ✅ **Hapus MongoDB/mongoose** — `mongoose` dihapus, `PingTarget` tinggal `"postgres" | "redis"`, env `MongoUrl` dibuang.
6. ✅ **Lavalink node tidak pernah konek / tidak ada log (akar masalah sebenarnya)** — plugin sebelumnya mendeklarasikan
   `client: { music: ... }`. Seyfert mengeksekusi factory plugin `client` **secara eager di konstruktor `BaseClient`**
   (`installPluginClientMaps` → `value: factory(client)`), sehingga `new MusicManager(...)` berjalan **sebelum** subclass
   menimpa `client.events` dengan `EventHandler` asli. Akibatnya handler `RAW` milik `Connectors.Seyfert` tertulis ke
   `CustomEventHandler` sementara lalu hilang, jadi node tidak pernah ditambah saat `READY` dan update voice juga tidak
   pernah diteruskan. Perbaikan: **hapus `client: { music }`** (tidak dipakai di mana pun; command memakai `ctx.music`).
   Sekarang `MusicManager` dibuat di `setup()` (EventHandler asli sudah terpasang, token sudah di-set) dan `RAW` bertahan.
7. ✅ **`TypeError: Header 'User-Id' has invalid value`** — muncul saat node di-`addNode` dengan id bot yang belum valid.
   Karena `MusicManager` dulu dibuat eager di konstruktor klien, `rest.options.token` masih bernilai sentinel `"INVALID"`,
   sehingga `client.botId` = `Buffer.from("INVALID", "base64")` = `" U@,\u0000"` (mengandung byte NUL) dan Bun menolak
   header `User-Id`. Sekarang `MusicManager.connect()` memvalidasi id (`/^\d{17,20}$/`) sebelum `addNode`, memakai
   `client.me?.id ?? client.botId`, dan menunggu (retry tiap 2 detik) + memberi warning jelas kalau token salah/kosong.
8. ✅ **`reconnectInterval` salah satuan** — Shoukaku memakai **detik**, bukan milidetik. Nilai lama `5_000` = ~83 menit
   sebelum retry; sekarang `5` (detik). Label log juga diperbaiki (`s`, bukan `ms`).
9. ✅ **Dockerfile boros & build lambat** — ganti base `oven/bun:latest` (≈181 MB compressed) → `oven/bun:1-alpine`
   (≈91 MB compressed), multi-stage, dan `bun install --production` (devDependencies seperti biome/typescript tidak ikut).
   `bun.lock` di-unignore supaya build deterministik. Terverifikasi: dengan hanya `node_modules` produksi + file yang di-COPY,
   `bun start` berjalan normal.

### Masih terbuka (opsional, bukan error)
10. **String bahasa tanpa command** — blok `avatar` dan `chat` ada di `en.ts`/`id.ts` tapi command-nya tidak ada. Entah dihapus (tinggal bersihkan) atau command-nya akan dibuat lagi (konfirmasi dulu).
11. **`resolveLocale`/`setLocale`** pakai Map in-memory. Guild yang belum pernah menjalankan command akan fallback ke `en` pada cooldown message & messageCreate sampai middleware mengisi Map.
12. **`AGENTS.md` drift** — menyebut `emoji` (padahal kode `emojis`) dan file `app/plugins/items.ts` yang tidak ada. Perlu disesuaikan.
13. **`GroqApiKey`** di `.env.example` belum dipakai di kode manapun.

### Migrasi musik: Shoukaku/Lavalink → Sonaria
14. ✅ **Ganti total Shoukaku/Lavalink dengan `sonaria`** — `shoukaku` dihapus dari dependency, config `lavalink` di
    `assets/config.ts` dan env `Lavalink*` di `.env.example` dibuang. Musik kini memakai library **`sonaria`** (voice
    native + FFmpeg) dengan extractor YouTube berbasis binary **`yt-dlp`** (`app/utils/youtube.extractor.ts`,
    env opsional `YtDlpPath`/`YtDlpCookies`/`YtDlpExtractorArgs`/`YtDlpPoToken`). Semua 13 command di `app/commands/Music/`
    di-porting ke API `Queue` Sonaria (`play/jump/shuffle/setRepeatMode/seek/setVolume/stop` + `queue.voice.leave()`).
15. ✅ **Struktur disamakan dengan `/app/Aichan`** — helper dipindah ke `app/utils/` (`function.ts`, `logger.ts`),
    `music.manager.ts`/`music.utils.ts` lama dihapus dan digantikan `music.service.ts`/`music.utils.ts`, `MusicPlugin`
    hanya mengekspos `ctx.music` (instance `Sonaria` dibuat **lazy** saat `ctx.music` pertama diakses, bukan di `setup()`),
    dan export config `emojis` → `emoji`.
    Bot keluar dari voice channel lewat listener `DeleteQueue` (menutup semua jalur: selesai natural, error, `stop`, disconnect eksternal).
16. ✅ **Dockerfile** — base diganti `oven/bun:1-debian` supaya FFmpeg + binary standalone `yt-dlp` bisa berjalan
    (Alpine/musl tidak bisa menjalankan binary PyInstaller yt-dlp). FFmpeg dan yt-dlp di-install saat build
    (asset yt-dlp dipilih berdasarkan `TARGETARCH`).
17. ⚠️ **Catatan**: eksekusi audio belum diuji end-to-end di environment analisa (tidak ada FFmpeg/yt-dlp/Docker).
    Verifikasi yang tersedia: `tsc` bersih, `biome` bersih, dan smoke-test pemuatan 13 command + logika `validate`/error
    extractor. Saat deploy, pastikan IP server tidak diblokir YouTube (umum terjadi di datacenter).
18. ✅ **Inisialisasi `Sonaria` dibuat lazy** — `MusicPlugin.setup()` sebelumnya langsung membuat `MusicService`/`Sonaria`,
    padahal `client.gateway` baru dibuat *setelah* `setupPlugins()` di dalam `Client.start()`. Akibatnya `isClientInstance`
    Sonaria menolak client (`Expected 'Client' for 'client'`). Instance sekarang dibuat saat `ctx.music` pertama diakses
    (yaitu saat command berjalan, gateway sudah siap).
19. ✅ **Setelan `yt-dlp` disamakan dengan referensi** (`umutxyp/MusicBot`) — argumen dasar kini `--ignore-config
    --no-warnings --no-progress --no-check-certificates --socket-timeout 10 --retries 2 --js-runtimes <bun|node>:${process.execPath}`.
    `--js-runtimes` wajib agar yt-dlp bisa menyelesaikan tantangan nsig/EJS YouTube. Format audio
    `bestaudio[acodec=opus]/bestaudio/best`, metadata + stream URL diambil dalam satu panggilan `--dump-single-json`
    (single video/search) lalu stream URL di-cache sampai kedaluwarsa (`expire`). Playlist memakai `--flat-playlist
    --playlist-end 100`.

## 7. Perintah npm/bun

```
bun start        # jalankan bot
bun run ts:check # tsc --noEmit
bun run biome:check
```

## 8. Environment (.env)

`Token, PostgresHost, PostgresPort, PostgresDatabase, PostgresUsername, PostgresPassword, RedisUrl, ConfigLocale, ConfigPrefixs, ConfigDevs, ConfigGuilds, YtDlpPath, YtDlpCookies, YtDlpExtractorArgs, YtDlpPoToken, WebhookLogUrl`

- Postgres: `PostgresHost` (default `localhost`), `PostgresPort` (default `5432`), `PostgresUsername` (default `postgres`),
  `PostgresPassword` (default kosong); hanya `PostgresDatabase` yang wajib diisi. Koneksi dibuat via options object `Bun.SQL`
  (bukan `PostgresUrl`).
- Musik: `YtDlpPath` (path binary `yt-dlp`, default `yt-dlp` dari PATH), `YtDlpCookies` (opsional: path file cookies, atau
  langsung isi file format Netscape — otomatis ditulis ke temp file),
  `YtDlpExtractorArgs` (argumen `--extractor-args` tambahan, opsional), dan `YtDlpPoToken` (PO token YouTube untuk
  `player_client=web,default`, opsional). Ketika login/bot-check YouTube mengganggu, isi `YtDlpCookies`.
- Env `Lavalink*` sudah dihapus (tidak dipakai lagi). `GroqApiKey` hanya ada di catatan lama, tidak ada di `.env.example`.
