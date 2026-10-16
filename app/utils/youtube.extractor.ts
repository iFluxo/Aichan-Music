import { spawn } from "node:child_process";
import { ExtractorPlugin, Playlist, type ResolveOptions, SonariaError, Song } from "sonaria";

const { YtDlpPath, YtDlpCookies } = import.meta.env;

const YoutubeExecutable = YtDlpPath ?? "yt-dlp";
const YoutubeCookies = YtDlpCookies ?? "";
const YoutubeSource = "youtube";
const YoutubeStreamFormat = "bestaudio/best";
const YoutubeTimeoutMs = 20_000;
const YoutubeUrlPattern =
    /(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|live\/|embed\/|playlist\?list=)|youtu\.be\/)[\w-]+/i;

interface YtDlpInfo {
    id?: string;
    title?: string;
    duration?: number;
    is_live?: boolean;
    age_limit?: number;
    uploader?: string;
    channel?: string;
    uploader_url?: string;
    channel_url?: string;
    view_count?: number;
    thumbnail?: string;
    thumbnails?: { url?: string }[];
    webpage_url?: string;
    url?: string;
    entries?: YtDlpInfo[];
}

function cookiesArgs(): string[] {
    return YoutubeCookies ? ["--cookies", YoutubeCookies] : [];
}

function runYtDlp(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn(YoutubeExecutable, args, { stdio: ["ignore", "pipe", "pipe"] });

        let stdout = "";
        let stderr = "";
        let settled = false;

        const timer = setTimeout(() => {
            if (settled) return;

            settled = true;
            child.kill("SIGKILL");
            reject(new Error("yt-dlp timed out"));
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
            if (settled) return;

            settled = true;
            clearTimeout(timer);
            reject(error);
        });

        child.on("close", (code) => {
            if (settled) return;

            settled = true;
            clearTimeout(timer);

            if (code === 0) {
                resolve(stdout);
                return;
            }

            reject(new Error(stderr.trim() || `yt-dlp exited with code ${code ?? "unknown"}`));
        });
    });
}

export class YoutubeExtractor extends ExtractorPlugin {
    async validate(url: string): Promise<boolean> {
        return YoutubeUrlPattern.test(url);
    }

    async resolve<T>(url: string, options: ResolveOptions<T>): Promise<Song<T> | Playlist<T>> {
        if (this.isPlaylist(url)) {
            const playlist = await this.dumpPlaylist(url);
            const songs = (playlist.entries ?? []).filter((entry) => Boolean(entry.id)).map((entry) => this.buildSong(entry, options));

            if (!songs.length) throw new SonariaError("NoResult", url);

            return new Playlist<T>(
                {
                    source: YoutubeSource,
                    songs,
                    id: playlist.id,
                    name: playlist.title,
                    url: playlist.webpage_url ?? url,
                    thumbnail: this.pickThumbnail(playlist),
                },
                options,
            );
        }

        const info = await this.dumpVideo(url);

        return this.buildSong(info, options);
    }

    async searchSong<T>(query: string, options: ResolveOptions<T>): Promise<Song<T> | null> {
        try {
            const info = await this.dumpVideo(`ytsearch1:${query}`);

            return this.buildSong(info, options);
        } catch {
            return null;
        }
    }

    async getStreamURL<T>(song: Song<T>): Promise<string> {
        const url = song.url;

        if (!url) throw new SonariaError("CannotGetStreamUrl", song.id);

        const streamUrl = await this.dumpStreamUrl(url);

        if (!streamUrl) throw new SonariaError("NoStreamUrl", song.id);

        return streamUrl;
    }

    getRelatedSongs(): Song[] {
        return [];
    }

    private isPlaylist(url: string): boolean {
        return /[?&]list=/.test(url) && !/[?&](?:v|videoId)=/.test(url) && !/youtu\.be\//i.test(url);
    }

    private buildSong<T>(info: YtDlpInfo, options: ResolveOptions<T>): Song<T> {
        const id = info.id ?? "";
        const url = info.webpage_url ?? (id ? `https://www.youtube.com/watch?v=${id}` : info.url);

        return new Song<T>(
            {
                source: YoutubeSource,
                id,
                name: info.title ?? "Unknown",
                url,
                isLive: info.is_live === true,
                duration: typeof info.duration === "number" ? Math.round(info.duration) : 0,
                thumbnail: this.pickThumbnail(info),
                views: typeof info.view_count === "number" ? info.view_count : undefined,
                uploader: {
                    name: info.uploader ?? info.channel,
                    url: info.uploader_url ?? info.channel_url,
                },
                ageRestricted: typeof info.age_limit === "number" ? info.age_limit >= 18 : undefined,
                playFromSource: true,
                plugin: this,
            },
            options,
        );
    }

    private pickThumbnail(info: YtDlpInfo): string | undefined {
        return info.thumbnail ?? info.thumbnails?.[0]?.url;
    }

    private async dumpVideo(target: string): Promise<YtDlpInfo> {
        const output = await runYtDlp([
            "--dump-single-json",
            "--no-playlist",
            "--no-warnings",
            "--skip-download",
            ...cookiesArgs(),
            target,
        ]);

        return JSON.parse(output) as YtDlpInfo;
    }

    private async dumpPlaylist(url: string): Promise<YtDlpInfo> {
        const output = await runYtDlp([
            "--dump-single-json",
            "--yes-playlist",
            "--flat-playlist",
            "--no-warnings",
            "--skip-download",
            ...cookiesArgs(),
            url,
        ]);

        return JSON.parse(output) as YtDlpInfo;
    }

    private async dumpStreamUrl(url: string): Promise<string> {
        const output = await runYtDlp([
            "--no-playlist",
            "--no-warnings",
            "--skip-download",
            "--get-url",
            "-f",
            YoutubeStreamFormat,
            ...cookiesArgs(),
            url,
        ]);

        return (
            output
                .split(/\r?\n/)
                .find((line) => line.startsWith("http"))
                ?.trim() ?? ""
        );
    }
}
