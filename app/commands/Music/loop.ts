import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, createStringOption, Declare, MessageFlags, Options } from "seyfert";
import { RepeatMode } from "sonaria";
import { requireQueue } from "../../utils/music.utils";

const LoopModes = {
    none: RepeatMode.Disabled,
    track: RepeatMode.Song,
    queue: RepeatMode.Queue,
} as const;

const LoopNames: Record<RepeatMode, keyof typeof LoopModes> = {
    [RepeatMode.Disabled]: "none",
    [RepeatMode.Song]: "track",
    [RepeatMode.Queue]: "queue",
};

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
        const queue = await requireQueue(ctx);

        if (!queue) return;

        const selected = ctx.options.mode as keyof typeof LoopModes | undefined;
        let mode: RepeatMode;

        if (selected) {
            queue.repeatMode = LoopModes[selected];
            mode = queue.repeatMode;
        } else {
            mode = queue.setRepeatMode();
        }

        await ctx.editOrReply({
            content: translate.music.loop.set(translate.music.loop.modes[LoopNames[mode]]),
            flags: MessageFlags.Ephemeral,
        });
    }
}
