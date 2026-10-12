import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, createIntegerOption, Declare, Embed, Options } from "seyfert";
import { colors } from "#config";
import { ensureVoiceChannel, formatDuration, formatTrack } from "../../plugins/music.utils";

const QueuePageSize = 10;

const queueOptions = {
    page: createIntegerOption({
        description: "Queue page.",
        required: false,
        min_value: 1,
    }),
};

@Declare({
    name: "queue",
    aliases: ["q"],
    description: "Show the current queue.",
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
    botPermissions: ["EmbedLinks"],
})
@Cooldown.user(1_000)
@Options(queueOptions)
export default class QueueCommand extends Command {
    async run(ctx: CommandContext<typeof queueOptions>) {
        const translate = ctx.t.get();
        const channelId = await ensureVoiceChannel(ctx);

        if (!channelId || !ctx.guildId) return;

        const queue = ctx.music.getQueue(ctx.guildId);

        if (!queue.current && !queue.tracks.length) {
            await ctx.editOrReply({ content: translate.music.queue.empty });
            return;
        }

        const pages = Math.max(1, Math.ceil(queue.tracks.length / QueuePageSize));
        const page = Math.min(Math.max(ctx.options.page ?? 1, 1), pages);
        const start = (page - 1) * QueuePageSize;
        const tracks = queue.tracks.slice(start, start + QueuePageSize);

        const sections: string[] = [];

        if (queue.current) {
            sections.push(
                `**${translate.music.queue.nowPlaying}**\n> ${formatTrack(queue.current)} • ${formatDuration(queue.current.info.length)}`,
            );
        }

        if (tracks.length) {
            const lines = tracks
                .map((track, index) => `> \`${start + index + 1}.\` ${formatTrack(track)} • ${formatDuration(track.info.length)}`)
                .join("\n");

            sections.push(`**${translate.music.queue.upcoming}**\n${lines}`);
        }

        const embed = new Embed()
            .setColor(colors.Primary)
            .setTitle(translate.music.queue.title)
            .setDescription(sections.join("\n\n"))
            .setFooter({ text: translate.music.queue.footer(queue.tracks.length, page, pages) });

        await ctx.editOrReply({ embeds: [embed] });
    }
}
