import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, createStringOption, Declare, MessageFlags, Options } from "seyfert";
import { isTextChannelInstance, SonariaError } from "sonaria";
import { ensureVoiceChannel } from "../../utils/music.utils";

const playOptions = {
    query: createStringOption({
        description: "Song name, URL or search query.",
        required: true,
    }),
};

const NoResultErrors = new Set([
    "NoResult",
    "CannotResolveSong",
    "NotSupportedUrl",
    "EmptyPlaylist",
    "EmptyFilteredPlaylist",
    "NoExtractorPlugin",
]);

const JoinErrors = new Set(["VoiceConnectFailed", "VoiceReconnectFailed", "VoiceMissingPerms", "VoiceFull"]);

@Declare({
    name: "play",
    aliases: ["p"],
    description: "Play a track or playlist from a search query or URL.",
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
    botPermissions: ["EmbedLinks", "Connect", "Speak"],
})
@Cooldown.user(1_000)
@Options(playOptions)
export default class PlayCommand extends Command {
    async run(ctx: CommandContext<typeof playOptions>) {
        const translate = ctx.t.get();
        const voiceChannel = await ensureVoiceChannel(ctx);

        if (!voiceChannel) return;

        await ctx.deferReply(true);

        const textChannel = ctx.channel("cache");

        try {
            await ctx.music.sonaria.play(voiceChannel, ctx.options.query, {
                member: ctx.member ?? undefined,
                textChannel: isTextChannelInstance(textChannel) ? textChannel : undefined,
            });
        } catch (error) {
            let content = translate.music.errors.loadFailed;

            if (error instanceof SonariaError) {
                if (NoResultErrors.has(error.errorCode)) content = translate.music.errors.noResults;
                else if (JoinErrors.has(error.errorCode)) content = translate.music.errors.joinFailed;
                else if (error.errorCode === "NonNsfw") content = translate.music.errors.nsfw;
            }

            await ctx.editOrReply({ content, flags: MessageFlags.Ephemeral });
            return;
        }

        await ctx.deleteResponse().catch(() => undefined);
    }
}
