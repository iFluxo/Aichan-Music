import { type AllGuildVoiceChannels, type CommandContext, type DefaultLocale, Embed, MessageFlags } from "seyfert";
import { isSupportedVoiceChannel, type Queue, type Song } from "sonaria";
import { colors, emoji } from "#config";

export function formatTrack(song: Song): string {
    return song.url ? `[${song.name ?? "Unknown"}](${song.url})` : (song.name ?? "Unknown");
}

export function formatDuration(seconds: number): string {
    const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    const pad = (value: number) => value.toString().padStart(2, "0");

    return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${pad(minutes)}:${pad(secs)}`;
}

export function nowPlayingEmbed(translate: DefaultLocale, song: Song, position?: number): Embed {
    const labels = translate.music.nowplaying;

    const embed = new Embed()
        .setColor(colors.Primary)
        .setTitle(labels.title)
        .setDescription(formatTrack(song))
        .addFields(
            { name: labels.fields.author, value: song.uploader.name ?? "Unknown", inline: true },
            {
                name: labels.fields.duration,
                value: song.isLive ? `${emoji.music.live} LIVE` : song.formattedDuration,
                inline: true,
            },
        );

    if (typeof position === "number") {
        embed.addFields({ name: labels.fields.position, value: formatDuration(position), inline: true });
    }

    if (song.thumbnail) embed.setThumbnail(song.thumbnail);

    return embed;
}

export async function ensureVoiceChannel(ctx: CommandContext): Promise<AllGuildVoiceChannels | null> {
    const translate = ctx.t.get();
    const voiceChannel = ctx.member?.voice("cache")?.channel("cache");

    if (!voiceChannel || !isSupportedVoiceChannel(voiceChannel)) {
        await ctx.editOrReply({ content: translate.music.errors.noVoice, flags: MessageFlags.Ephemeral });

        return null;
    }

    if (ctx.guildId) {
        const botChannelId = ctx.music.sonaria.getQueue(ctx.guildId)?.voice.channelId;

        if (botChannelId && botChannelId !== voiceChannel.id) {
            await ctx.editOrReply({ content: translate.music.errors.notSameChannel, flags: MessageFlags.Ephemeral });

            return null;
        }
    }

    return voiceChannel;
}

export async function requireQueue(ctx: CommandContext): Promise<Queue | null> {
    const voiceChannel = await ensureVoiceChannel(ctx);

    if (!voiceChannel || !ctx.guildId) return null;

    const queue = ctx.music.sonaria.getQueue(ctx.guildId);

    if (!queue) {
        await ctx.editOrReply({ content: ctx.t.get().music.errors.noQueue, flags: MessageFlags.Ephemeral });

        return null;
    }

    return queue;
}
