import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, Declare, MessageFlags } from "seyfert";
import { requirePlayer } from "../../plugins/music.utils";

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
        const player = await requirePlayer(ctx);

        if (!player || !ctx.guildId) return;

        const count = ctx.music.shuffle(ctx.guildId);

        await ctx.editOrReply({
            content: count < 2 ? translate.music.shuffle.notEnough : translate.music.shuffle.shuffled(count),
            flags: MessageFlags.Ephemeral,
        });
    }
}
