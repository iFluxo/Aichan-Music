import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, Declare, MessageFlags } from "seyfert";
import { formatDuration, nowPlayingEmbed, requirePlayer } from "../../plugins/music.utils";

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
        const player = await requirePlayer(ctx);

        if (!player || !ctx.guildId) return;

        const current = ctx.music.getQueue(ctx.guildId).current;

        if (!current) {
            await ctx.editOrReply({ content: translate.music.queue.empty, flags: MessageFlags.Ephemeral });
            return;
        }

        const embed = nowPlayingEmbed(translate, current).addFields({
            name: translate.music.nowplaying.fields.position,
            value: formatDuration(player.position),
            inline: true,
        });

        await ctx.editOrReply({ embeds: [embed] });
    }
}
