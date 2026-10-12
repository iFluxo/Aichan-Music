import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, createStringOption, Declare, MessageFlags, Options } from "seyfert";
import { LoadType } from "shoukaku";
import { lavalink } from "#config";
import { ensureVoiceChannel, nowPlayingEmbed } from "../../plugins/music.utils";

const playOptions = {
    query: createStringOption({
        description: "Song name, URL or search query.",
        required: true,
    }),
};

function buildIdentifier(query: string): string {
    const trimmed = query.trim();

    return /^[a-z]+:\/\//i.test(trimmed) || /^[a-z]+search:/i.test(trimmed) ? trimmed : `${lavalink.Search}:${trimmed}`;
}

@Declare({
    name: "play",
    aliases: ["p"],
    description: "Play a track or playlist from a search query or URL.",
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
    botPermissions: ["EmbedLinks", "Connect", "Speak"],
})
@Cooldown.user(1_000)
@Options(playOptions)
export default class PlayCommand extends Command {
    async run(ctx: CommandContext<typeof playOptions>) {
        const translate = ctx.t.get();
        const guildId = ctx.guildId;

        if (!guildId) {
            await ctx.editOrReply({ content: translate.common.onlyInGuild, flags: MessageFlags.Ephemeral });
            return;
        }

        const channelId = await ensureVoiceChannel(ctx);

        if (!channelId) return;

        const result = await ctx.music.resolve(buildIdentifier(ctx.options.query)).catch(() => undefined);

        if (!result) {
            await ctx.editOrReply({ content: translate.music.errors.nodeUnavailable, flags: MessageFlags.Ephemeral });
            return;
        }

        if (result.loadType === LoadType.EMPTY) {
            await ctx.editOrReply({ content: translate.music.errors.noResults, flags: MessageFlags.Ephemeral });
            return;
        }

        if (result.loadType === LoadType.ERROR) {
            await ctx.editOrReply({ content: translate.music.errors.loadFailed, flags: MessageFlags.Ephemeral });
            return;
        }

        const playlistName = result.loadType === LoadType.PLAYLIST ? result.data.info.name : null;
        const tracks =
            result.loadType === LoadType.PLAYLIST
                ? result.data.tracks
                : result.loadType === LoadType.SEARCH
                  ? result.data.slice(0, 1)
                  : [result.data];

        if (!tracks.length) {
            await ctx.editOrReply({ content: translate.music.errors.noResults, flags: MessageFlags.Ephemeral });
            return;
        }

        const player = ctx.music.player(guildId) ?? (await ctx.music.join(guildId, channelId).catch(() => null));

        if (!player) {
            await ctx.editOrReply({ content: translate.music.errors.joinFailed, flags: MessageFlags.Ephemeral });
            return;
        }

        const queue = ctx.music.getQueue(guildId);

        queue.textChannelId = ctx.channelId;
        queue.endMessage = translate.music.play.ended;

        if (!queue.current) {
            const [first, ...rest] = tracks;

            await ctx.music.play(guildId, first);
            ctx.music.enqueue(guildId, rest);

            await ctx.editOrReply({ embeds: [nowPlayingEmbed(translate, first)] });
            return;
        }

        ctx.music.enqueue(guildId, tracks);

        await ctx.editOrReply({
            content: playlistName
                ? translate.music.play.playlistAdded(playlistName, tracks.length)
                : translate.music.play.added(tracks[0].info.title, queue.tracks.length),
        });
    }
}
