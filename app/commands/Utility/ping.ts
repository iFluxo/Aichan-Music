import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, Declare, Embed, MessageFlags } from "seyfert";

import { colors } from "#config";

@Declare({
    name: "ping",
    aliases: [],
    description: "Showing client, runtime & database latency.",
    contexts: ["Guild", "BotDM"],
    integrationTypes: ["GuildInstall", "UserInstall"],
    botPermissions: ["EmbedLinks"],
})
@Cooldown.user(1_000)
export default class PingCommand extends Command {
    async run(ctx: CommandContext) {
        const translate = ctx.t.get();

        const dbPing = await ctx.db.ping();
        const ping = ctx.client?.gateway?.latency;
        const pong = ctx.interaction?.createdTimestamp ?? ctx.message?.createdTimestamp ?? Date.now();

        const embed = new Embed()
            .setColor(colors.Primary)
            .setTitle(translate.ping.title)
            .setDescription(translate.ping.description)
            .addFields(
                {
                    name: `\`${state(ping)}\` ${translate.ping.client.title}`,
                    value: translate.ping.client.value(ping),
                    inline: true,
                },
                {
                    name: `\`${state(Date.now() - pong)}\` ${translate.ping.runtime.title}`,
                    value: translate.ping.runtime.value(Date.now() - pong),
                    inline: true,
                },
                {
                    name: `\`${state(dbPing.latency)}\` ${translate.ping.database.title}`,
                    value: translate.ping.database.value(dbPing.latency),
                    inline: true,
                },
            );

        await ctx.editOrReply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral,
        });
    }
}

function state(ping?: number) {
    if (ping === undefined) return "🔴";
    return ping <= 100 ? "🟢" : ping <= 200 ? "🟡" : "🔴";
}
