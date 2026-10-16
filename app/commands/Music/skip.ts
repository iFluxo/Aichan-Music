import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, createIntegerOption, Declare, MessageFlags, Options } from "seyfert";
import { RepeatMode } from "sonaria";
import { requireQueue } from "../../utils/music.utils";

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
        const queue = await requireQueue(ctx);

        if (!queue) return;

        const skipped = queue.songs[0];

        if (!skipped) {
            await ctx.editOrReply({ content: translate.music.queue.empty, flags: MessageFlags.Ephemeral });
            return;
        }

        const amount = ctx.options.amount ?? 1;

        try {
            await queue.jump(amount, { requeue: queue.repeatMode === RepeatMode.Queue });
        } catch {
            await queue.stop();
        }

        await ctx.editOrReply({
            content: translate.music.skip.skipped(skipped.name ?? "Unknown"),
            flags: MessageFlags.Ephemeral,
        });
    }
}
