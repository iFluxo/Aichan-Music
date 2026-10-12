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
    General/    help.ts, ping.ts, stats.ts
    Utility/    language.ts, prefix.ts
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
    webhook.plugin.ts       # createPlugin -> ctx.webhook & client.webhook (Discord webhook helper)
    utils.function.ts       # getUser, generateCases, setLocale/resolveLocale, pattern
    utils.logger.ts         # customize Logger (RAM usage), global error handlers
assets/
  config.ts                 # bot, colors, emojis
  commands.template.ts      # template command baru
```

## 3. Alur runtime penting

- `app/index.ts` mendaftarkan plugin: Yuna, Database, Webhook, cooldown; lalu `new Client(...)`
  dengan `globalMiddlewares` dari `middlewares/index.ts`.
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
- `AGENTS.md` menyebut export `emoji` (singular) dan `{ emoji } from "#config"`, tetapi kode memakai **`emojis`** (plural) dengan key `#Developer/#General/#Utility`. Kode pakai `import { emojis as categoryEmoji } from "#config"` di `help.ts`.
- `AGENTS.md` menyebut item catalog `app/plugins/items.ts` yang **tidak ada** di repo ini. Kemungkinan konvensi hasil copy dari project lain — perlu disesuaikan.

## 5. Status kesehatan

Sudah **bersih** per perbaikan terakhir:
- `bunx tsc --noEmit` → **OK** (exit 0).
- `bunx @biomejs/biome check .` → **0 warning / 0 error** (28 file dicek).
- `bun build app/index.ts --target=bun` → **OK** (semua import resolve).
- Catatan: instalasi `@types/node`/`typescript`/`@types/bun` sempat rusak karena hardlink cache bun
  (file jadi tidak terbaca — error `Invalid argument` di environment ini). Solusi: hapus `~/.bun/install/cache`
  lalu `bun install` ulang. Kalau muncul lagi, ulangi langkah yang sama.

## 6. Temuan / kandidat perbaikan

### Sudah diperbaiki
1. ✅ **Bug prefix** — `app/AichanMusic.ts:33` diperbaiki dari `.bot` menjadi `.config` (lalu `.config.bot`).
2. ✅ **`stats.ts`** — import & variabel tak terpakai (`formatMemoryUsage`, `memory`) kini dipakai untuk field memori (RSS), memakai key bahasa `stats.fields.memory` yang sudah ada.
3. ✅ **Instalasi dependencies** — cache bun lama dibersihkan sehingga `@types/node`/`typescript` terpasang lengkap.
4. ✅ **Migrasi Turso/Drizzle → Postgres/Bun.SQL** — hapus `drizzle-orm`, `drizzle-kit`, `@tursodatabase/serverless`,
   `drizzle.config.ts`, dan `app/database/drizzle.schema.ts`. `AIODatabase` sekarang pakai `new SQL(options)` dari `bun`
   (`hostname/port/database/username/password`), tabel dibuat otomatis (`CREATE TABLE IF NOT EXISTS`) di `ensureSchema()`,
   kolom JSON pakai `JSONB`. Script `db:*` di `package.json` dihapus.
5. ✅ **Hapus MongoDB/mongoose** — `mongoose` dihapus, `PingTarget` tinggal `"postgres" | "redis"`, env `MongoUrl` dibuang.

### Masih terbuka (opsional, bukan error)
6. **String bahasa tanpa command** — blok `avatar` dan `chat` ada di `en.ts`/`id.ts` tapi command-nya tidak ada. Entah dihapus (tinggal bersihkan) atau command-nya akan dibuat lagi (konfirmasi dulu).
7. **`resolveLocale`/`setLocale`** pakai Map in-memory. Guild yang belum pernah menjalankan command akan fallback ke `en` pada cooldown message & messageCreate sampai middleware mengisi Map.
8. **`AGENTS.md` drift** — menyebut `emoji` (padahal kode `emojis`) dan file `app/plugins/items.ts` yang tidak ada. Perlu disesuaikan.
9. **`GroqApiKey`** di `.env.example` belum dipakai di kode manapun.

## 7. Perintah npm/bun

```
bun start        # jalankan bot
bun run ts:check # tsc --noEmit
bun run biome:check
```

## 8. Environment (.env)

`Token, PostgresHost, PostgresPort, PostgresDatabase, PostgresUsername, PostgresPassword, RedisUrl, ConfigLocale, ConfigPrefixs, ConfigDevs, ConfigGuilds, WebhookLogUrl, GroqApiKey`

- Postgres: `PostgresHost` (default `localhost`), `PostgresPort` (default `5432`), `PostgresUsername` (default `postgres`),
  `PostgresPassword` (default kosong); hanya `PostgresDatabase` yang wajib diisi. Koneksi dibuat via options object `Bun.SQL`
  (bukan `PostgresUrl`).
- Catatan: `GroqApiKey` belum dipakai di kode manapun saat analisa.
