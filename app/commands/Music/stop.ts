import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, Declare, MessageFlags } from "seyfert";
import { requireQueue } from "../../utils/music.utils";

@Declare({
    name: "stop",
    aliases: ["dc", "disconnect"],
    description: "Stop the player and clear the queue.",
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
})
@Cooldown.user(1_000)
export default class StopCommand extends Command {
    async run(ctx: CommandContext) {
        const translate = ctx.t.get();
        const queue = await requireQueue(ctx);

        if (!queue) return;

        await queue.stop();

        await ctx.editOrReply({ content: translate.music.stop.stopped, flags: MessageFlags.Ephemeral });
    }
}
