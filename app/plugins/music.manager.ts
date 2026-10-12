import { Connectors, type LavalinkResponse, type Player, Shoukaku, type ShoukakuOptions, type Track } from "shoukaku";
import { lavalink } from "#config";
import type { Client } from "../AichanMusic";

export type LoopMode = "none" | "track" | "queue";

export interface MusicQueue {
    tracks: Track[];

    loop: LoopMode;

    current: Track | null;

    textChannelId: string | null;

    endMessage: string | null;
}

const LoopOrder: LoopMode[] = ["none", "track", "queue"];

export class MusicManager {
    readonly shoukaku: Shoukaku;

    readonly queues = new Map<string, MusicQueue>();

    constructor(
        private readonly client: Client,
        connectedLog: boolean = false,
    ) {
        const options: ShoukakuOptions = {
            resume: true,
            resumeTimeout: 30,
            resumeByLibrary: true,
            reconnectTries: 3,
            reconnectInterval: 5,
            moveOnDisconnect: false,
        };

        this.shoukaku = new Shoukaku(
            new Connectors.Seyfert(client),
            [
                {
                    name: lavalink.Name,
                    url: lavalink.Url,
                    auth: lavalink.Auth,
                    secure: lavalink.Secure,
                },
            ],
            options,
        );

        if (connectedLog) {
            this.shoukaku
                .on("ready", (name) => this.client.logger.info(`[Lavalink] Node ready: ${name}`))
                .on("error", (name, error) => this.client.logger.error(`[Lavalink] Node error (${name}):`, error))
                .on("close", (name, code, reason) => this.client.logger.warn(`[Lavalink] Node closed (${name}): ${code} ${reason}`))
                .on("disconnect", (name, count) => this.client.logger.warn(`[Lavalink] Node disconnected (${name}): ${count}`))
                .on("reconnecting", (name, left, interval) =>
                    this.client.logger.warn(`[Lavalink] Reconnecting (${name}): ${left} tries left in ${interval}ms`),
                );
        }
    }

    getQueue(guildId: string): MusicQueue {
        let queue = this.queues.get(guildId);

        if (!queue) {
            queue = {
                tracks: [],
                loop: "none",
                current: null,
                textChannelId: null,
                endMessage: null,
            };

            this.queues.set(guildId, queue);
        }

        return queue;
    }

    player(guildId: string): Player | undefined {
        return this.shoukaku.players.get(guildId);
    }

    nodeReady(): boolean {
        return this.shoukaku.getIdealNode() !== undefined;
    }

    async resolve(query: string): Promise<LavalinkResponse | undefined> {
        const node = this.shoukaku.getIdealNode();

        if (!node) return undefined;

        return node.rest.resolve(query);
    }

    async join(guildId: string, channelId: string): Promise<Player> {
        const existing = this.player(guildId);

        if (existing) return existing;

        const player = await this.shoukaku.joinVoiceChannel({
            guildId,
            shardId: this.client.gateway.calculateShardId(guildId),
            channelId,
            deaf: true,
        });

        this.wirePlayer(guildId, player);

        return player;
    }

    async play(guildId: string, track: Track): Promise<void> {
        const player = this.player(guildId);

        if (!player) throw new Error("Player is not connected");

        this.getQueue(guildId).current = track;

        await player.playTrack({ track: { encoded: track.encoded } });
    }

    enqueue(guildId: string, tracks: Track[]): void {
        this.getQueue(guildId).tracks.push(...tracks);
    }

    async skip(guildId: string, amount: number = 1): Promise<Track | null> {
        const queue = this.getQueue(guildId);
        const player = this.player(guildId);

        if (!player) return null;

        const skipped = queue.current;

        if (queue.loop === "queue" && skipped) {
            queue.tracks.push(skipped);
        }

        if (amount > 1) {
            queue.tracks.splice(0, amount - 1);
        }

        const next = queue.tracks.shift() ?? null;
        queue.current = next;

        if (next) {
            await player.playTrack({ track: { encoded: next.encoded } });
        } else if (skipped) {
            await player.stopTrack();
        }

        return skipped;
    }

    async setPaused(guildId: string, paused: boolean): Promise<boolean> {
        const player = this.player(guildId);

        if (!player) return false;

        await player.setPaused(paused);

        return player.paused;
    }

    async setVolume(guildId: string, volume: number): Promise<number> {
        const player = this.player(guildId);

        if (!player) return -1;

        const clamped = Math.min(Math.max(Math.round(volume), 0), 200);

        await player.setGlobalVolume(clamped);

        return clamped;
    }

    async seek(guildId: string, seconds: number): Promise<number | null> {
        const player = this.player(guildId);
        const queue = this.getQueue(guildId);

        if (!player || !queue.current) return null;

        const duration = Math.floor(queue.current.info.length / 1000);

        if (queue.current.info.isStream || duration <= 0) return null;

        const clamped = Math.min(Math.max(Math.round(seconds), 0), duration);

        await player.seekTo(clamped * 1000);

        return clamped;
    }

    setLoop(guildId: string, mode: LoopMode): LoopMode {
        const queue = this.getQueue(guildId);

        queue.loop = mode;

        return queue.loop;
    }

    cycleLoop(guildId: string): LoopMode {
        const queue = this.getQueue(guildId);
        const index = LoopOrder.indexOf(queue.loop);

        queue.loop = LoopOrder[(index + 1) % LoopOrder.length];

        return queue.loop;
    }

    shuffle(guildId: string): number {
        const tracks = this.getQueue(guildId).tracks;

        for (let index = tracks.length - 1; index > 0; index--) {
            const random = Math.floor(Math.random() * (index + 1));

            [tracks[index], tracks[random]] = [tracks[random], tracks[index]];
        }

        return tracks.length;
    }

    remove(guildId: string, position: number): Track | null {
        const tracks = this.getQueue(guildId).tracks;
        const index = position - 1;

        if (index < 0 || index >= tracks.length) return null;

        return tracks.splice(index, 1)[0] ?? null;
    }

    async stop(guildId: string): Promise<void> {
        const queue = this.queues.get(guildId);

        if (queue) {
            queue.tracks = [];
            queue.current = null;
            queue.endMessage = null;
        }

        await this.leave(guildId);
    }

    async leave(guildId: string): Promise<void> {
        this.queues.delete(guildId);

        await this.shoukaku.leaveVoiceChannel(guildId);
    }

    private wirePlayer(guildId: string, player: Player): void {
        player.on("end", ({ reason }) => {
            if (reason === "replaced" || reason === "cleanup") return;

            this.handleEnd(guildId, player);
        });
        player.on("stuck", () => this.handleEnd(guildId, player));
        player.on("exception", () => this.handleEnd(guildId, player));
    }

    private handleEnd(guildId: string, player: Player): void {
        const queue = this.queues.get(guildId);

        if (!queue) return;

        if (queue.loop === "track" && queue.current) {
            void player.playTrack({ track: { encoded: queue.current.encoded } });
            return;
        }

        if (queue.loop === "queue" && queue.current) {
            queue.tracks.push(queue.current);
        }

        const next = queue.tracks.shift() ?? null;
        queue.current = next;

        if (next) {
            void player.playTrack({ track: { encoded: next.encoded } });
            return;
        }

        void this.finish(guildId);
    }

    private async finish(guildId: string): Promise<void> {
        const queue = this.queues.get(guildId);

        if (!queue) return;

        const { textChannelId, endMessage } = queue;

        await this.leave(guildId);

        if (!textChannelId || !endMessage) return;

        try {
            await this.client.proxy.channels(textChannelId).messages.post({ body: { content: endMessage } });
        } catch (error) {
            this.client.logger.error("[Music] Failed to send queue end message:", error);
        }
    }
}
