import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, createStringOption, Declare, MessageFlags, Options } from "seyfert";
import { requirePlayer } from "../../plugins/music.utils";

const loopOptions = {
    mode: createStringOption({
        description: "Loop mode.",
        required: false,
        choices: [
            { name: "Off", value: "none" },
            { name: "Track", value: "track" },
            { name: "Queue", value: "queue" },
        ],
    }),
};

@Declare({
    name: "loop",
    aliases: ["repeat"],
    description: "Cycle the loop mode for the queue.",
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
})
@Cooldown.user(1_000)
@Options(loopOptions)
export default class LoopCommand extends Command {
    async run(ctx: CommandContext<typeof loopOptions>) {
        const translate = ctx.t.get();
        const player = await requirePlayer(ctx);

        if (!player || !ctx.guildId) return;

        const mode = ctx.options.mode
            ? ctx.music.setLoop(ctx.guildId, ctx.options.mode as "none" | "track" | "queue")
            : ctx.music.cycleLoop(ctx.guildId);

        await ctx.editOrReply({ content: translate.music.loop.set(translate.music.loop.modes[mode]), flags: MessageFlags.Ephemeral });
    }
}
