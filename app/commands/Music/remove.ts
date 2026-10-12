import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, createIntegerOption, Declare, MessageFlags, Options } from "seyfert";
import { requirePlayer } from "../../plugins/music.utils";

const removeOptions = {
    position: createIntegerOption({
        description: "Queue position to remove.",
        required: true,
        min_value: 1,
    }),
};

@Declare({
    name: "remove",
    aliases: ["rm"],
    description: "Remove a track from the queue.",
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
})
@Cooldown.user(1_000)
@Options(removeOptions)
export default class RemoveCommand extends Command {
    async run(ctx: CommandContext<typeof removeOptions>) {
        const translate = ctx.t.get();
        const player = await requirePlayer(ctx);

        if (!player || !ctx.guildId) return;

        const removed = ctx.music.remove(ctx.guildId, ctx.options.position);

        await ctx.editOrReply({
            content: removed ? translate.music.remove.removed(removed.info.title) : translate.music.remove.invalid,
            flags: MessageFlags.Ephemeral,
        });
    }
}
