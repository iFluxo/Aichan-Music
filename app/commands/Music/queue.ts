import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, createIntegerOption, Declare, Embed, Options } from "seyfert";
import { colors, emoji } from "#config";
import { formatTrack, requireQueue } from "../../utils/music.utils";

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
        const queue = await requireQueue(ctx);

        if (!queue) return;

        const current = queue.songs[0];
        const upcoming = queue.songs.slice(1);

        if (!current) {
            await ctx.editOrReply({ content: translate.music.queue.empty });
            return;
        }

        const pages = Math.max(1, Math.ceil(upcoming.length / QueuePageSize));
        const page = Math.min(Math.max(ctx.options.page ?? 1, 1), pages);
        const start = (page - 1) * QueuePageSize;
        const songs = upcoming.slice(start, start + QueuePageSize);

        const sections: string[] = [
            `**${translate.music.queue.nowPlaying}**\n> ${formatTrack(current)} • ${
                current.isLive ? `${emoji.music.live} LIVE` : current.formattedDuration
            }`,
        ];

        if (songs.length) {
            const lines = songs
                .map(
                    (song, index) =>
                        `> \`${start + index + 1}.\` ${formatTrack(song)} • ${
                            song.isLive ? `${emoji.music.live} LIVE` : song.formattedDuration
                        }`,
                )
                .join("\n");

            sections.push(`**${translate.music.queue.upcoming}**\n${lines}`);
        }

        const embed = new Embed()
            .setColor(colors.Primary)
            .setTitle(translate.music.queue.title)
            .setDescription(sections.join("\n\n"))
            .setFooter({ text: translate.music.queue.footer(upcoming.length, page, pages) });

        await ctx.editOrReply({ embeds: [embed] });
    }
}
