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

        const available = queue.songs.length - 1;

        if (available < 1) {
            await ctx.editOrReply({ content: translate.music.skip.noNext, flags: MessageFlags.Ephemeral });
            return;
        }

        const amount = Math.min(ctx.options.amount ?? 1, available);

        try {
            await queue.jump(amount, { requeue: queue.repeatMode === RepeatMode.Queue });
        } catch (error) {
            ctx.client.logger.error(`[Music] skip failed in guild ${queue.id}:`, error);

            await ctx.editOrReply({ content: translate.music.errors.loadFailed, flags: MessageFlags.Ephemeral });
            return;
        }

        await ctx.editOrReply({
            content: translate.music.skip.skipped(skipped.name ?? "Unknown"),
            flags: MessageFlags.Ephemeral,
        });
    }
}
