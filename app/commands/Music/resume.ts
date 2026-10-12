import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, Declare, MessageFlags } from "seyfert";
import { requirePlayer } from "../../plugins/music.utils";

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
        const player = await requirePlayer(ctx);

        if (!player || !ctx.guildId) return;

        if (!player.paused) {
            await ctx.editOrReply({ content: translate.music.resume.already, flags: MessageFlags.Ephemeral });
            return;
        }

        await ctx.music.setPaused(ctx.guildId, false);

        await ctx.editOrReply({ content: translate.music.resume.resumed, flags: MessageFlags.Ephemeral });
    }
}
