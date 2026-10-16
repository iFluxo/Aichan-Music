import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, createIntegerOption, Declare, MessageFlags, Options } from "seyfert";
import { formatDuration, requireQueue } from "../../utils/music.utils";

const seekOptions = {
    position: createIntegerOption({
        description: "Position in seconds.",
        required: true,
        min_value: 0,
    }),
};

@Declare({
    name: "seek",
    aliases: ["position"],
    description: "Seek to a position in the current track.",
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
})
@Cooldown.user(1_000)
@Options(seekOptions)
export default class SeekCommand extends Command {
    async run(ctx: CommandContext<typeof seekOptions>) {
        const translate = ctx.t.get();
        const queue = await requireQueue(ctx);

        if (!queue) return;

        const current = queue.songs[0];

        if (!current || current.isLive || current.duration <= 0) {
            await ctx.editOrReply({ content: translate.music.seek.invalid, flags: MessageFlags.Ephemeral });
            return;
        }

        const position = Math.min(Math.max(Math.floor(ctx.options.position), 0), current.duration);

        try {
            await queue.seek(position);

            await ctx.editOrReply({
                content: translate.music.seek.seeked(formatDuration(position)),
                flags: MessageFlags.Ephemeral,
            });
        } catch {
            await ctx.editOrReply({ content: translate.music.seek.invalid, flags: MessageFlags.Ephemeral });
        }
    }
}
