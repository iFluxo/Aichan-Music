import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, Declare, MessageFlags } from "seyfert";
import { requireQueue } from "../../utils/music.utils";

@Declare({
    name: "resume",
    aliases: ["rs"],
    description: "Resume the current track.",
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
})
@Cooldown.user(1_000)
export default class ResumeCommand extends Command {
    async run(ctx: CommandContext) {
        const translate = ctx.t.get();
        const queue = await requireQueue(ctx);

        if (!queue) return;

        if (!queue.paused) {
            await ctx.editOrReply({ content: translate.music.resume.already, flags: MessageFlags.Ephemeral });
            return;
        }

        await queue.resume();

        await ctx.editOrReply({ content: translate.music.resume.resumed, flags: MessageFlags.Ephemeral });
    }
}
