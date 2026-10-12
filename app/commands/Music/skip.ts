import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, createIntegerOption, Declare, MessageFlags, Options } from "seyfert";
import { requirePlayer } from "../../plugins/music.utils";

const skipOptions = {
    amount: createIntegerOption({
        description: "How many tracks to skip.",
        required: false,
        min_value: 1,
        max_value: 50,
    }),
};

@Declare({
    name: "skip",
    aliases: ["s", "next"],
    description: "Skip the current track.",
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
})
@Cooldown.user(1_000)
@Options(skipOptions)
export default class SkipCommand extends Command {
    async run(ctx: CommandContext<typeof skipOptions>) {
        const translate = ctx.t.get();
        const player = await requirePlayer(ctx);

        if (!player || !ctx.guildId) return;

        const skipped = await ctx.music.skip(ctx.guildId, ctx.options.amount ?? 1);

        await ctx.editOrReply({
            content: skipped ? translate.music.skip.skipped(skipped.info.title) : translate.music.queue.empty,
            flags: MessageFlags.Ephemeral,
        });
    }
}
