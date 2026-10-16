import { spawn } from "node:child_process";
import { unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ExtractorPlugin, Playlist, type ResolveOptions, SonariaError, Song } from "sonaria";

const { YtDlpPath, YtDlpCookies, YtDlpExtractorArgs, YtDlpPoToken } = import.meta.env;

const YoutubeExecutable = YtDlpPath ?? "yt-dlp";
const YoutubeCookies = YtDlpCookies ?? "";
const YoutubeCookiesFile = join(tmpdir(), "YTCookies.txt");
const YoutubeExtractorArgs = YtDlpExtractorArgs ?? "";
const YoutubePoToken = YtDlpPoToken ?? "";
const YoutubeSource = "youtube";
const YoutubeAudioFormat = "bestaudio[acodec=opus]/bestaudio/best";
const YoutubeTimeoutMs = 30_000;
const YoutubeMaxPlaylistSize = 100;
const YoutubeVideoIdPattern = /^[\w-]{11}$/;
const YoutubeStreamPath = "/stream/";
const YoutubeStreamContentType = "application/octet-stream";
const YoutubeInfoSafetyMs = 1_800_000;
const YoutubeInfoDefaultTtlMs = 1_800_000;
const YoutubeInfoMaxEntries = 100;
const YoutubePrefetchMaxEntries = 6;
const YoutubePrefetchMaxConcurrent = 2;
const YoutubeHosts = new Set(["youtube.com", "youtu.be", "youtube-nocookie.com"]);

interface YtDlpInfo {
    id?: string;
    title?: string;
    fulltitle?: string;
    duration?: number;
    is_live?: boolean;
    live_status?: string;
    age_limit?: number;
    uploader?: string;
    channel?: string;
    uploader_url?: string;
    channel_url?: string;
    view_count?: number;
    like_count?: number;
    thumbnail?: string;
    thumbnails?: { url?: string }[];
    webpage_url?: string;
    url?: string;
    entries?: YtDlpInfo[];
}

interface ParsedYoutubeUrl {
    type: "video" | "playlist";
    id: string;
}

function javascriptRuntimeArgs(): string[] {
    const execPath = process.execPath;
    if (!execPath) return [];

    const versions = process.versions as Record<string, string | undefined>;

    return ["--js-runtimes", `${versions.bun ? "bun" : "node"}:${execPath}`];
}

let cookiesWritten = false;

function cookiesPath(): string | undefined {
    if (!YoutubeCookies) return undefined;

    if (!YoutubeCookies.includes("\n") && !YoutubeCookies.includes("\t")) return YoutubeCookies;

    if (!cookiesWritten) {
        try {
            writeFileSync(YoutubeCookiesFile, YoutubeCookies, { mode: 0o600 });
            cookiesWritten = true;
        } catch {
            return undefined;
        }
    }

    return YoutubeCookiesFile;
}

function baseArgs(): string[] {
    const args = [
        "--ignore-config",
        "--no-warnings",
        "--no-progress",
        "--no-check-certificates",
        "--socket-timeout",
        "10",
        "--retries",
        "2",
        ...javascriptRuntimeArgs(),
    ];

    const cookies = cookiesPath();
    if (cookies) args.push("--cookies", cookies);
    if (YoutubePoToken) args.push("--extractor-args", `youtube:po_token=web.gvs+${YoutubePoToken};player_client=web,default`);
    if (YoutubeExtractorArgs) args.push("--extractor-args", YoutubeExtractorArgs);

    return args;
}

function normalizeHost(host: string): string {
    return host.replace(/^(?:www|m|music)\./, "");
}

function parseYoutubeUrl(input: string): ParsedYoutubeUrl | null {
    let url: URL;
    try {
        url = new URL(input);
    } catch {
        return null;
    }

    const host = url.hostname.toLowerCase();
    if (!YoutubeHosts.has(normalizeHost(host))) return null;

    const list = url.searchParams.get("list");
    let videoId = url.searchParams.get("v");
    if (host.endsWith("youtu.be")) videoId = url.pathname.slice(1).split("/")[0] ?? null;

    const pathMatch = /^\/(?:shorts|live|embed|v)\/([\w-]{11})/.exec(url.pathname);
    if (pathMatch) videoId = pathMatch[1];

    const isVideo = Boolean(videoId && YoutubeVideoIdPattern.test(videoId));
    const isMix = Boolean(list?.startsWith("RD"));

    if (list && /^[\w-]+$/.test(list) && !(isMix && isVideo)) return { type: "playlist", id: list };
    if (isVideo && videoId) return { type: "video", id: videoId };

    return null;
}

function summarizeStderr(stderr: string): string {
    return stderr
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(-3)
        .join(" | ");
}

function runYtDlp(extraArgs: string[], target: string): Promise<YtDlpInfo> {
    const args = [...baseArgs(), ...extraArgs, "-J", "--", target];

    return new Promise((resolve, reject) => {
        const child = spawn(YoutubeExecutable, args, { stdio: ["ignore", "pipe", "pipe"] });

        let stdout = "";
        let stderr = "";
        let settled = false;
        let timer: ReturnType<typeof setTimeout> | undefined;

        const finish = (error: Error | null, value?: YtDlpInfo) => {
            if (settled) return;

            settled = true;
            if (timer) clearTimeout(timer);

            if (error) {
                reject(error);
                return;
            }

            resolve(value as YtDlpInfo);
        };

        timer = setTimeout(() => {
            child.kill("SIGKILL");
            finish(new Error("yt-dlp timed out"));
        }, YoutubeTimeoutMs);

        timer.unref?.();

        child.stdout?.setEncoding("utf8");
        child.stderr?.setEncoding("utf8");

        child.stdout?.on("data", (chunk: string) => {
            stdout += chunk;
        });

        child.stderr?.on("data", (chunk: string) => {
            stderr += chunk;
        });

        child.on("error", (error) => {
            console.error(`[yt-dlp] spawn failed for '${YoutubeExecutable}': ${error.message}`);
            finish(error);
        });

        child.on("close", (code) => {
            if (code !== 0) {
                const message = stderr.trim() || `yt-dlp exited with code ${code ?? "unknown"}`;

                console.error(`[yt-dlp] failed (${target}): ${summarizeStderr(message)}`);
                finish(new Error(message));
                return;
            }

            try {
                finish(null, JSON.parse(stdout) as YtDlpInfo);
            } catch {
                finish(new Error("yt-dlp returned invalid JSON"));
            }
        });
    });
}

interface InfoFile {
    path: string;
    expiresAt: number;
}

interface PrefetchEntry {
    chunks: Uint8Array[];
    done: boolean;
    child?: ReturnType<typeof spawn>;
    waiters: Set<() => void>;
}

const infoFiles = new Map<string, InfoFile>();
const prefetches = new Map<string, PrefetchEntry>();

function removeInfoFile(path: string): void {
    try {
        unlinkSync(path);
    } catch {
        return;
    }
}

function infoTtl(url: string): number {
    const match = /[?&]expire=(\d+)/.exec(url);
    const expire = match ? Number(match[1]) : 0;

    if (expire > 0) return Math.max(0, expire * 1000 - Date.now() - YoutubeInfoSafetyMs);

    return YoutubeInfoDefaultTtlMs;
}

function infoFileFor(id: string): string | undefined {
    const entry = infoFiles.get(id);
    if (!entry) return undefined;

    if (entry.expiresAt > Date.now()) return entry.path;

    infoFiles.delete(id);
    removeInfoFile(entry.path);

    return undefined;
}

function downloadArgs(id: string, infoPath?: string): string[] {
    return infoPath
        ? ["-J", infoPath, "-f", YoutubeAudioFormat, "-o", "-"]
        : ["--no-playlist", "-f", YoutubeAudioFormat, "-o", "-", "--", `https://www.youtube.com/watch?v=${id}`];
}

function wakePrefetch(entry: PrefetchEntry): void {
    const waiters = [...entry.waiters];
    entry.waiters.clear();
    for (const waiter of waiters) waiter();
}

function prefetchInProgress(): number {
    let count = 0;
    for (const entry of prefetches.values()) if (!entry.done) count += 1;

    return count;
}

function evictPrefetches(): void {
    while (prefetches.size > YoutubePrefetchMaxEntries) {
        let removed = false;

        for (const [id, entry] of prefetches) {
            if (!entry.done) continue;

            prefetches.delete(id);
            removed = true;
            break;
        }

        if (!removed) break;
    }
}

function startPrefetch(id: string): PrefetchEntry {
    const existing = prefetches.get(id);
    if (existing) return existing;

    const entry: PrefetchEntry = { chunks: [], done: false, waiters: new Set() };
    prefetches.set(id, entry);

    evictPrefetches();

    let stderr = "";
    let bytes = 0;

    const attempt = (useInfo: boolean) => {
        const infoPath = useInfo ? infoFileFor(id) : undefined;
        const child = spawn(YoutubeExecutable, [...baseArgs(), ...downloadArgs(id, infoPath)], { stdio: ["ignore", "pipe", "pipe"] });
        entry.child = child;
        stderr = "";

        child.stdout?.on("data", (chunk: Buffer) => {
            entry.chunks.push(new Uint8Array(chunk));
            bytes += chunk.length;
            wakePrefetch(entry);
        });

        child.stderr?.setEncoding("utf8");
        child.stderr?.on("data", (chunk: string) => {
            stderr += chunk;
        });

        const finish = (code: number | null) => {
            if (code !== 0 && bytes === 0) {
                if (infoPath) {
                    infoFiles.delete(id);
                    removeInfoFile(infoPath);
                    attempt(false);
                    return;
                }

                if (stderr.trim()) console.error(`[yt-dlp] stream failed (${id}): ${summarizeStderr(stderr)}`);
            }

            entry.done = true;
            wakePrefetch(entry);
        };

        child.on("error", () => finish(1));
        child.on("close", (code) => finish(code));
    };

    attempt(true);

    return entry;
}

function prefetch(id: string): void {
    if (prefetches.has(id)) return;
    if (prefetchInProgress() >= YoutubePrefetchMaxConcurrent) return;

    startPrefetch(id);
}

function prefetchStream(entry: PrefetchEntry, signal: AbortSignal): ReadableStream<Uint8Array> {
    let index = 0;
    let cancelled = false;

    return new ReadableStream<Uint8Array>({
        async pull(controller) {
            while (!cancelled && !signal.aborted) {
                if (index < entry.chunks.length) {
                    controller.enqueue(entry.chunks[index]);
                    index += 1;
                    return;
                }

                if (entry.done) break;

                await new Promise<void>((resolve) => entry.waiters.add(resolve));
            }

            if (cancelled) return;

            try {
                controller.close();
            } catch {
                return;
            }
        },
        cancel() {
            cancelled = true;
            wakePrefetch(entry);
        },
    });
}

let streamServer: ReturnType<typeof Bun.serve> | undefined;
let streamServerPort = 0;

function streamUrlFor(id: string): string {
    if (!streamServer) {
        streamServer = Bun.serve({
            hostname: "127.0.0.1",
            port: 0,
            idleTimeout: 0,
            fetch(request) {
                const id = new URL(request.url).pathname.slice(YoutubeStreamPath.length);

                if (!YoutubeVideoIdPattern.test(id)) return new Response("Not found", { status: 404 });
                if (request.method === "HEAD")
                    return new Response(null, { status: 200, headers: { "content-type": YoutubeStreamContentType } });

                return new Response(prefetchStream(startPrefetch(id), request.signal), {
                    headers: { "content-type": YoutubeStreamContentType, "cache-control": "no-store" },
                });
            },
        });

        streamServerPort = streamServer.port ?? 0;
    }

    return `http://127.0.0.1:${streamServerPort}${YoutubeStreamPath}${id}`;
}

function rememberInfo(info: YtDlpInfo): void {
    const id = info.id;

    if (!id || !YoutubeVideoIdPattern.test(id) || info.entries || !info.url) return;

    const path = join(tmpdir(), `aichan-yt-${id}.json`);

    try {
        writeFileSync(path, JSON.stringify(info), { mode: 0o600 });
    } catch {
        return;
    }

    infoFiles.delete(id);
    infoFiles.set(id, { path, expiresAt: Date.now() + infoTtl(info.url) });

    while (infoFiles.size > YoutubeInfoMaxEntries) {
        const oldest = infoFiles.keys().next().value;
        if (oldest === undefined) break;

        const entry = infoFiles.get(oldest);
        infoFiles.delete(oldest);
        if (entry) removeInfoFile(entry.path);
    }

    prefetch(id);
}

export class YoutubeExtractor extends ExtractorPlugin {
    async validate(url: string): Promise<boolean> {
        return parseYoutubeUrl(url) !== null;
    }

    async resolve<T>(url: string, options: ResolveOptions<T>): Promise<Song<T> | Playlist<T>> {
        const parsed = parseYoutubeUrl(url);
        if (!parsed) throw new SonariaError("NotSupportedUrl");

        if (parsed.type === "playlist") {
            const info = await runYtDlp(
                ["--flat-playlist", "--yes-playlist", "--playlist-end", String(YoutubeMaxPlaylistSize)],
                `https://www.youtube.com/playlist?list=${parsed.id}`,
            );

            const songs = (info.entries ?? []).filter((entry) => Boolean(entry.id)).map((entry) => this.buildSong(entry, options));

            if (!songs.length) throw new SonariaError("EmptyPlaylist");

            return new Playlist<T>(
                {
                    source: YoutubeSource,
                    songs,
                    id: parsed.id,
                    name: info.title ?? "YouTube playlist",
                    url: `https://www.youtube.com/playlist?list=${parsed.id}`,
                    thumbnail: songs[0].thumbnail,
                },
                options,
            );
        }

        const info = await runYtDlp(["--no-playlist", "-f", YoutubeAudioFormat], `https://www.youtube.com/watch?v=${parsed.id}`);

        rememberInfo(info);

        return this.buildSong(info, options);
    }

    async searchSong<T>(query: string, options: ResolveOptions<T>): Promise<Song<T> | null> {
        const result = await runYtDlp(["-f", YoutubeAudioFormat], `ytsearch1:${query}`);
        const info = result.entries ? result.entries.find((entry) => Boolean(entry.id)) : result;

        if (!info?.id) return null;

        rememberInfo(info);

        return this.buildSong(info, options);
    }

    async getStreamURL<T>(song: Song<T>): Promise<string> {
        if (!YoutubeVideoIdPattern.test(song.id)) throw new SonariaError("NoStreamUrl", song.id);

        return streamUrlFor(song.id);
    }

    getRelatedSongs(): Song[] {
        return [];
    }

    private buildSong<T>(info: YtDlpInfo, options: ResolveOptions<T>): Song<T> {
        const id = info.id ?? "";
        const isLive = info.is_live === true || info.live_status === "is_live";

        return new Song<T>(
            {
                plugin: this,
                source: YoutubeSource,
                playFromSource: true,
                id,
                name: info.title ?? info.fulltitle ?? id,
                url: YoutubeVideoIdPattern.test(id) ? `https://www.youtube.com/watch?v=${id}` : (info.webpage_url ?? info.url),
                isLive,
                duration: isLive ? 0 : Math.round(info.duration ?? 0),
                thumbnail: info.thumbnail ?? info.thumbnails?.at(-1)?.url,
                views: typeof info.view_count === "number" ? info.view_count : undefined,
                likes: typeof info.like_count === "number" ? info.like_count : undefined,
                uploader: {
                    name: info.uploader ?? info.channel,
                    url: info.uploader_url ?? info.channel_url,
                },
                ageRestricted: typeof info.age_limit === "number" ? info.age_limit >= 18 : undefined,
            },
            options,
        );
    }
}
