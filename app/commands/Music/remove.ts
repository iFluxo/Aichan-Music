import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, createIntegerOption, Declare, MessageFlags, Options } from "seyfert";
import { requireQueue } from "../../utils/music.utils";

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
        const queue = await requireQueue(ctx);

        if (!queue) return;

        const position = ctx.options.position;
        const removed = position > 0 && position < queue.songs.length ? queue.songs.splice(position, 1)[0] : undefined;

        await ctx.editOrReply({
            content: removed ? translate.music.remove.removed(removed.name ?? "Unknown") : translate.music.remove.invalid,
            flags: MessageFlags.Ephemeral,
        });
    }
}
