import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, Declare, MessageFlags } from "seyfert";
import { requirePlayer } from "../../plugins/music.utils";

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
        const player = await requirePlayer(ctx);

        if (!player || !ctx.guildId) return;

        if (player.paused) {
            await ctx.editOrReply({ content: translate.music.pause.already, flags: MessageFlags.Ephemeral });
            return;
        }

        await ctx.music.setPaused(ctx.guildId, true);

        await ctx.editOrReply({ content: translate.music.pause.paused, flags: MessageFlags.Ephemeral });
    }
}
