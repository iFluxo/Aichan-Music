import type { MessageCreateBodyRequest } from "seyfert/lib/common/types/write";
import { Events, type Playlist, type Queue, Sonaria, type Song } from "sonaria";
import { applemusic, deezer, soundcloud, spotify, youtube } from "sonaria-plugins";
import type { Client } from "../AichanMusic";
import { resolveLocale } from "./function";
import { nowPlayingEmbed } from "./music.utils";

export class MusicService {
    readonly sonaria: Sonaria;

    private readonly ffmpegLog: string[] = [];

    constructor(
        private readonly client: Client,
        private readonly connectedLog: boolean = false,
    ) {
        this.sonaria = new Sonaria(client, {
            plugins: [
                applemusic(),
                deezer({
                    arl: import.meta.env.DEEZER_ARL,
                    masterDecryptKey: import.meta.env.DEEZER_MDK,
                }),
                soundcloud(),
                spotify(),
                youtube({
                    downloader: "auto",
                    ytdlp: { autoInstall: true },
                }),
            ],
            emitAddSongWhenCreatingQueue: false,
            emitAddListWhenCreatingQueue: false,
        });

        this.sonaria
            .on(Events.PlaySong, (queue, song) => void this.onPlaySong(queue, song))
            .on(Events.AddSong, (queue, song) => void this.onAddSong(queue, song))
            .on(Events.AddList, (queue, playlist) => void this.onAddList(queue, playlist))
            .on(Events.Finish, (queue) => void this.onFinish(queue))
            .on(Events.DeleteQueue, (queue) => this.onDeleteQueue(queue))
            .on(Events.Error, (error, queue) => void this.onError(error, queue))
            .on(Events.FfmpegDebug, (message) => {
                this.ffmpegLog.push(message);
                if (this.ffmpegLog.length > 30) this.ffmpegLog.shift();

                this.client.logger.debug(`[ffmpeg] ${message}`);
            })
            .on(Events.Debug, (message) => {
                if (this.connectedLog) this.client.logger.debug(`[Sonaria] ${message}`);
            });
    }

    getQueue(guildId: string): Queue | undefined {
        return this.sonaria.getQueue(guildId);
    }

    private translate(guildId: string) {
        return this.client.t(resolveLocale(guildId)).get();
    }

    private async write(queue: Queue, body: MessageCreateBodyRequest): Promise<void> {
        if (!queue.textChannel) {
            this.client.logger.warn(`[Music] No text channel bound to queue in guild ${queue.id}; skipping message`);
            return;
        }

        try {
            await queue.textChannel.messages.write(body);
        } catch (error) {
            this.client.logger.error(`[Music] Failed to send message in guild ${queue.id}:`, error);
        }
    }

    private async onPlaySong(queue: Queue, song: Song): Promise<void> {
        await this.write(queue, { embeds: [nowPlayingEmbed(this.translate(queue.id), song)] });
    }

    private async onAddSong(queue: Queue, song: Song): Promise<void> {
        const translate = this.translate(queue.id);

        await this.write(queue, {
            content: translate.music.play.added(song.name ?? "Unknown", Math.max(1, queue.songs.length - 1)),
        });
    }

    private async onAddList(queue: Queue, playlist: Playlist): Promise<void> {
        const translate = this.translate(queue.id);

        await this.write(queue, {
            content: translate.music.play.playlistAdded(playlist.name ?? "Playlist", playlist.songs.length),
        });
    }

    private async onFinish(queue: Queue): Promise<void> {
        await this.write(queue, { content: this.translate(queue.id).music.play.ended });
    }

    private onDeleteQueue(queue: Queue): void {
        queue.voice.leave();
    }

    private async onError(error: Error, queue: Queue): Promise<void> {
        const ffmpegTail = this.ffmpegLog.splice(0).slice(-8).join(" | ");
        const detail = ffmpegTail ? ` | ffmpeg: ${ffmpegTail}` : "";

        this.client.logger.error(`[Music] Playback error in guild ${queue.id}: ${error.name}: ${error.message}${detail}`);

        await this.write(queue, { content: this.translate(queue.id).music.errors.loadFailed });
    }
}
