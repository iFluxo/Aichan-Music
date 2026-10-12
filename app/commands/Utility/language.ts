import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, createStringOption, Declare, Embed, MessageFlags, Options } from "seyfert";

import { colors } from "#config";
import { setLocale } from "#utils/function";

const languageOptions = {
    locale: createStringOption({
        description: "Language code to set.",
        required: false,
        async autocomplete(interaction) {
            const query = interaction.getInput().toLowerCase();
            const available = Object.keys(interaction.client.langs.values);

            await interaction.respond(
                available
                    .filter((locale) => locale.toLowerCase().includes(query))
                    .slice(0, 25)
                    .map((locale) => ({
                        name: `${locale} (${interaction.client.langs.values[locale]?.metadata?.name ?? "Unknown"})`,
                        value: locale,
                    })),
            );
        },
    }),
};

@Declare({
    name: "language",
    aliases: ["lang", "lg"],
    description: "Change the bot language for this server.",
    defaultMemberPermissions: ["ManageGuild"],
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
    botPermissions: ["EmbedLinks"],
})
@Cooldown.user(3_000)
@Options(languageOptions)
export default class LanguageCommand extends Command {
    async run(ctx: CommandContext<typeof languageOptions>) {
        const translate = ctx.t.get();
        const guildId = ctx.guildId;

        if (!guildId) {
            return await ctx.editOrReply({
                content: translate.common.onlyInGuild,
                flags: MessageFlags.Ephemeral,
            });
        }

        const available = Object.keys(ctx.client.langs.values);
        const displayLocale = (locale: string) =>
            `\`${locale}\`${ctx.client.langs.values[locale]?.metadata?.name ? ` (${ctx.client.langs.values[locale]?.metadata?.name})` : ""}`;
        const availableLine = (locale: string) => `- ${displayLocale(locale)}`;
        const availableText = available.map(availableLine).join("\n");
        const input = ctx.options?.locale?.trim();

        if (!input) {
            const current = await ctx.db.getLocale(guildId);

            return await ctx.editOrReply({
                embeds: [
                    new Embed().setColor(colors.Primary).setDescription(translate.language.current(displayLocale(current), availableText)),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        const resolved = ctx.client.langs.getLocale(input);

        if (!available.includes(resolved)) {
            return await ctx.editOrReply({
                embeds: [new Embed().setColor("Red").setDescription(translate.language.notSupported(input, availableText))],
                flags: MessageFlags.Ephemeral,
            });
        }

        const updated = await ctx.db.setLocale(guildId, resolved);

        setLocale(guildId, updated);

        await ctx.editOrReply({
            embeds: [
                new Embed()
                    .setColor(colors.Primary)
                    .setDescription(translate.language.updated(updated, ctx.client.langs.values[updated]?.metadata?.name)),
            ],
            flags: MessageFlags.Ephemeral,
        });
    }
}
