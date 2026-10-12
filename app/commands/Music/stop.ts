import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, Declare, MessageFlags } from "seyfert";
import { ensureVoiceChannel } from "../../plugins/music.utils";

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
        const channelId = await ensureVoiceChannel(ctx);

        if (!channelId || !ctx.guildId) return;

        await ctx.music.stop(ctx.guildId);

        await ctx.editOrReply({ content: translate.music.stop.stopped, flags: MessageFlags.Ephemeral });
    }
}
