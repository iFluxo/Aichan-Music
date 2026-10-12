import os from "node:os";
import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, Declare, Embed } from "seyfert";
import { formatMemoryUsage } from "seyfert/lib/common/it/logger";

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
        const memory = process.memoryUsage();
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
                { name: `🧑 ${fields.members}`, value: `${cache.members?.count("*") ?? 0}`, inline: true },
                { name: `📚 ${fields.messages}`, value: `${cache.messages?.count("*") ?? 0}`, inline: true },
                { name: `⚡ ${fields.latency}`, value: `${gateway.latency} ms`, inline: true },
                { name: `🗄️ ${fields.shards}`, value: `${gateway.totalShards}`, inline: true },
                { name: `🖥️ ${fields.os}`, value: `\`${os.type()}\``, inline: true },
                { name: `📀 ${fields.release}`, value: `\`${os.release()}\``, inline: true },
                { name: `🏗️ ${fields.arch}`, value: `\`${os.platform()}\` \`${os.machine()}\``, inline: true },
                {
                    name: `🧠 ${fields.cpu}`,
                    value: `\`${os.cpus()[0]?.model ?? "Unknown"}\` ( \`${os.cpus().length}\` cores )`,
                    inline: true,
                },
                { name: `💾 ${fields.memory}`, value: `\`${formatMemoryUsage(memory.rss)}\``, inline: true },
                { name: `⏱️ ${fields.uptime}`, value: `<t:${ctx.readyAt}:R>`, inline: true },
            );

        await ctx.editOrReply({ embeds: [embed] });
    }
}
