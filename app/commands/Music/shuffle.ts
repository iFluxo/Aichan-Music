import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, Declare, MessageFlags } from "seyfert";
import { requireQueue } from "../../utils/music.utils";

@Declare({
    name: "shuffle",
    aliases: ["mix"],
    description: "Shuffle the queued tracks.",
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
})
@Cooldown.user(1_000)
export default class ShuffleCommand extends Command {
    async run(ctx: CommandContext) {
        const translate = ctx.t.get();
        const queue = await requireQueue(ctx);

        if (!queue) return;

        const count = Math.max(0, queue.songs.length - 1);

        await queue.shuffle();

        await ctx.editOrReply({
            content: count < 2 ? translate.music.shuffle.notEnough : translate.music.shuffle.shuffled(count),
            flags: MessageFlags.Ephemeral,
        });
    }
}
