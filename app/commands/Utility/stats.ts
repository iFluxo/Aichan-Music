import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, Declare, Embed } from "seyfert";

import { colors } from "#config";

@Declare({
    name: "stats",
    aliases: ["st"],
    description: "Showing about bot statistics.",
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
    botPermissions: ["EmbedLinks"],
})
@Cooldown.user(1_000)
export default class Template extends Command {
    async run(ctx: CommandContext) {
        const translate = ctx.t.get();
        const { cache, gateway } = ctx.client;
        const fields = translate.stats.fields;

        const embed = new Embed()
            .setColor(colors.Primary)
            .setTitle(translate.stats.title)
            .setDescription(ctx.command.description)
            .addFields(
                { name: `🏠 ${fields.guilds}`, value: `${cache.guilds?.count() ?? 0}`, inline: true },
                { name: `👥 ${fields.users}`, value: `${cache.users?.count() ?? 0}`, inline: true },
                { name: `💬 ${fields.channels}`, value: `${cache.channels?.count("*") ?? 0}`, inline: true },
                { name: `🎭 ${fields.roles}`, value: `${cache.roles?.count("*") ?? 0}`, inline: true },
                { name: `😀 ${fields.emojis}`, value: `${cache.emojis?.count("*") ?? 0}`, inline: true },
                { name: `⚡ ${fields.latency}`, value: `${gateway.latency} ms`, inline: true },
                { name: `⏱️ ${fields.uptime}`, value: `<t:${ctx.readyAt}:R>`, inline: true },
            );

        await ctx.editOrReply({ embeds: [embed] });
    }
}
