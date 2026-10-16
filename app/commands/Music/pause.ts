import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, Declare, MessageFlags } from "seyfert";
import { requireQueue } from "../../utils/music.utils";

@Declare({
    name: "pause",
    aliases: [],
    description: "Pause the current track.",
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
})
@Cooldown.user(1_000)
export default class PauseCommand extends Command {
    async run(ctx: CommandContext) {
        const translate = ctx.t.get();
        const queue = await requireQueue(ctx);

        if (!queue) return;

        if (queue.paused) {
            await ctx.editOrReply({ content: translate.music.pause.already, flags: MessageFlags.Ephemeral });
            return;
        }

        await queue.pause();

        await ctx.editOrReply({ content: translate.music.pause.paused, flags: MessageFlags.Ephemeral });
    }
}
