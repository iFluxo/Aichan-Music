import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, createIntegerOption, Declare, MessageFlags, Options } from "seyfert";
import { requireQueue } from "../../utils/music.utils";

const volumeOptions = {
    volume: createIntegerOption({
        description: "Volume percentage (0-200).",
        required: true,
        min_value: 0,
        max_value: 200,
    }),
};

@Declare({
    name: "volume",
    aliases: ["vol"],
    description: "Set the player volume.",
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
})
@Cooldown.user(1_000)
@Options(volumeOptions)
export default class VolumeCommand extends Command {
    async run(ctx: CommandContext<typeof volumeOptions>) {
        const translate = ctx.t.get();
        const queue = await requireQueue(ctx);

        if (!queue) return;

        queue.setVolume(ctx.options.volume);

        await ctx.editOrReply({
            content: translate.music.volume.set(ctx.options.volume),
            flags: MessageFlags.Ephemeral,
        });
    }
}
