import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, Declare, MessageFlags } from "seyfert";
import { requireQueue } from "../../utils/music.utils";

@Declare({
    name: "leave",
    aliases: ["lv"],
    description: "Disconnect the bot from the voice channel.",
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
})
@Cooldown.user(1_000)
export default class LeaveCommand extends Command {
    async run(ctx: CommandContext) {
        const translate = ctx.t.get();
        const queue = await requireQueue(ctx);

        if (!queue) return;

        queue.voice.leave();

        await ctx.editOrReply({ content: translate.music.leave.left, flags: MessageFlags.Ephemeral });
    }
}
