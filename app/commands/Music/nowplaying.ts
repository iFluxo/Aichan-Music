import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, Declare, MessageFlags } from "seyfert";
import { nowPlayingEmbed, requireQueue } from "../../utils/music.utils";

@Declare({
    name: "nowplaying",
    aliases: ["np", "current"],
    description: "Show the currently playing track.",
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
    botPermissions: ["EmbedLinks"],
})
@Cooldown.user(1_000)
export default class NowPlayingCommand extends Command {
    async run(ctx: CommandContext) {
        const translate = ctx.t.get();
        const queue = await requireQueue(ctx);

        if (!queue) return;

        const current = queue.songs[0];

        if (!current) {
            await ctx.editOrReply({ content: translate.music.queue.empty, flags: MessageFlags.Ephemeral });
            return;
        }

        await ctx.editOrReply({ embeds: [nowPlayingEmbed(translate, current, queue.currentTime)] });
    }
}
