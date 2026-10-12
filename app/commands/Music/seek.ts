import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, createIntegerOption, Declare, MessageFlags, Options } from "seyfert";
import { formatDuration, requirePlayer } from "../../plugins/music.utils";

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
        const player = await requirePlayer(ctx);

        if (!player || !ctx.guildId) return;

        const position = await ctx.music.seek(ctx.guildId, ctx.options.position);

        await ctx.editOrReply({
            content: position === null ? translate.music.seek.invalid : translate.music.seek.seeked(formatDuration(position * 1000)),
            flags: MessageFlags.Ephemeral,
        });
    }
}
