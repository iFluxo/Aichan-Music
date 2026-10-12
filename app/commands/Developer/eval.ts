import {
    Command,
    type CommandContext,
    createIntegerOption,
    createStringOption,
    Declare,
    Embed,
    Formatter,
    MessageFlags,
    Options,
} from "seyfert";
import { DeclareParserConfig, ParserRecommendedConfig, Watch, Yuna } from "yunaforseyfert";

import { config } from "#config";

const { inspect } = Bun;

const evalOptions = {
    code: createStringOption({
        description: "Some code.",
    }),
    depth: createIntegerOption({
        description: "Depth of the result.",
        min_value: 0,
    }),
};

@Declare({
    name: "eval",
    aliases: [],
    description: "No explanation.",
    defaultMemberPermissions: ["ManageGuild", "Administrator"],
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    guildId: config.DevGuilds,
    props: {
        onlyForDev: true,
    },
})

@Options(evalOptions)
@DeclareParserConfig(ParserRecommendedConfig.Eval)
export default class EvalCommand extends Command {
    @Watch({
        beforeCreate(ctx) {
            const watcher = Yuna.watchers.find(ctx.client, {
                userId: ctx.author.id,
                command: this,
            });
            if (!watcher) return;

            watcher.stop("Another Execution");
        },
        onStop(reason) {
            const timestamp = Math.trunc(Date.now() / 1000);
            this.ctx?.editOrReply({
                content: "",
                embeds: [
                    new Embed()
                        .setDescription(this.ctx?.t.get().dev.eval.watcherEnded("Eval command", reason, timestamp))
                        .setColor("Greyple"),
                ],
            });
        },
    })
    async run(ctx: CommandContext<typeof evalOptions>) {
        const { client, options, channelId } = ctx;

        const translate = ctx.t.get();
        const start = Date.now();
        const depth = options?.depth ?? 0;

        let code = options?.code;
        let output = null;
        let typecode: string | undefined;

        await client.channels.typing(channelId);

        if (!code?.length)
            return await ctx.editOrReply({
                embeds: [new Embed().setDescription(translate.dev.eval.empty).setColor("Red")],
                flags: MessageFlags.Ephemeral,
            });

        try {
            if (typeof output !== "string") {
                if (/^(?:\(?)\s*await\b/.test(code.toLowerCase())) code = `(async () => ${code})()`;

                output = await eval(code ?? "");
                typecode = typeof output;
                output = inspect(output, { depth }).replace(
                    import.meta.env.Token ?? "No Token Found!?",
                    "X".repeat(import.meta.env.Token?.length ?? 1),
                );
            }

            await ctx.editOrReply({
                embeds: [
                    new Embed()
                        .setColor("Green")
                        .setDescription(
                            `${output?.length > 4083 ? Formatter.codeBlock(`${(output ?? "").slice(0, 4080)}...`, "js").trim() : Formatter.codeBlock(output ?? "", "js")}`,
                        )
                        .setTimestamp()
                        .setFooter({
                            text: translate.dev.eval.type(typecode ?? "undefined", Math.floor(Date.now() - start)),
                        }),
                ],
            });
        } catch (error) {
            await ctx.editOrReply({
                embeds: [
                    new Embed()
                        .setColor("Red")
                        .setDescription(Formatter.codeBlock(inspect(error).slice(0, 4080), "js"))
                        .setTimestamp()
                        .setFooter({
                            text: translate.dev.eval.errorType(Math.floor(Date.now() - start)),
                        }),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }
    }
}
