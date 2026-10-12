import { type CommandContext, type DefaultLocale, Embed, MessageFlags } from "seyfert";
import type { Player, Track } from "shoukaku";
import { colors } from "#config";

export function formatDuration(ms: number): string {
    const totalSeconds = Math.floor((Number.isFinite(ms) ? ms : 0) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (value: number) => value.toString().padStart(2, "0");

    return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export function formatTrack(track: Track): string {
    return track.info.uri ? `[${track.info.title}](${track.info.uri})` : track.info.title;
}

export function nowPlayingEmbed(translate: DefaultLocale, track: Track): Embed {
    const labels = translate.music.nowplaying;

    const embed = new Embed()
        .setColor(colors.Primary)
        .setTitle(labels.title)
        .setDescription(formatTrack(track))
        .addFields(
            { name: labels.fields.author, value: track.info.author, inline: true },
            {
                name: labels.fields.duration,
                value: track.info.isStream ? "🔴 LIVE" : formatDuration(track.info.length),
                inline: true,
            },
        );

    if (track.info.artworkUrl) {
        embed.setThumbnail(track.info.artworkUrl);
    }

    return embed;
}

export async function getMemberChannelId(ctx: CommandContext): Promise<string | null> {
    if (!ctx.guildId) return null;

    const state = await ctx.client.cache.voiceStates?.get(ctx.author.id, ctx.guildId);

    return state?.channelId ?? null;
}

export async function ensureVoiceChannel(ctx: CommandContext): Promise<string | null> {
    const translate = ctx.t.get();
    const userChannel = await getMemberChannelId(ctx);

    if (!userChannel || !ctx.guildId) {
        await ctx.editOrReply({ content: translate.music.errors.noVoice, flags: MessageFlags.Ephemeral });
        return null;
    }

    const botChannel = ctx.music.shoukaku.connections.get(ctx.guildId)?.channelId ?? null;

    if (botChannel && botChannel !== userChannel) {
        await ctx.editOrReply({ content: translate.music.errors.notSameChannel, flags: MessageFlags.Ephemeral });
        return null;
    }

    return userChannel;
}

export async function requirePlayer(ctx: CommandContext): Promise<Player | null> {
    const channelId = await ensureVoiceChannel(ctx);

    if (!channelId || !ctx.guildId) return null;

    const player = ctx.music.player(ctx.guildId);

    if (!player) {
        await ctx.editOrReply({ content: ctx.t.get().music.errors.noPlayer, flags: MessageFlags.Ephemeral });
        return null;
    }

    return player;
}
