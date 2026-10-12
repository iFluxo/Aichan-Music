import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, createStringOption, Declare, Embed, MessageFlags, Options } from "seyfert";

import { colors, config } from "#config";

const prefixOptions = {
    prefixs: createStringOption({
        description: "Add extra prefixes or reset the command prefix for this server.",
        required: false,
    }),
};

@Declare({
    name: "prefix",
    aliases: ["prf", "pf"],
    description: "Set an extra command prefix or reset to defaults for this server.",
    defaultMemberPermissions: ["ManageGuild"],
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
    botPermissions: ["EmbedLinks"],
})
@Cooldown.user(3_000)
@Options(prefixOptions)
export default class PrefixCommand extends Command {
    async run(ctx: CommandContext<typeof prefixOptions>) {
        const translate = ctx.t.get();
        const guildId = ctx.guildId;

        if (!guildId) {
            return await ctx.editOrReply({
                content: translate.common.onlyInGuild,
                flags: MessageFlags.Ephemeral,
            });
        }

        const input = ctx.options?.prefixs?.trim();

        if (!input) {
            const current = await ctx.db.getPrefix(guildId);

            return await ctx.editOrReply({
                embeds: [
                    new Embed()
                        .setColor(colors.Primary)
                        .setDescription(translate.prefix.current(current.map((prefix) => `\`${prefix}\``).join(", "))),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        if (input.toLowerCase() === "default" || input.toLowerCase() === "reset") {
            const reseted = await ctx.db.setPrefix(guildId, config.CommandPrefixs);

            return await ctx.editOrReply({
                embeds: [
                    new Embed()
                        .setColor(colors.Primary)
                        .setDescription(translate.prefix.reset(reseted.map((prefix) => `\`${prefix}\``).join(", "))),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        const extra = [...new Set(input.split(/\s+/).filter((prefix) => prefix.length > 0))];

        if (!extra.length || extra.length > 10 || extra.some((prefix) => prefix.length > 5)) {
            return await ctx.editOrReply({
                embeds: [new Embed().setColor("Red").setDescription(translate.prefix.invalid)],
                flags: MessageFlags.Ephemeral,
            });
        }

        const updated = await ctx.db.setPrefix(guildId, [...new Set([...config.CommandPrefixs, ...extra])]);

        await ctx.editOrReply({
            embeds: [
                new Embed()
                    .setColor(colors.Primary)
                    .setDescription(translate.prefix.updated(updated.map((prefix) => `\`${prefix}\``).join(", "))),
            ],
            flags: MessageFlags.Ephemeral,
        });
    }
}
