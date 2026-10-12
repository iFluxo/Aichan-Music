import { createEvent, MessageFlags } from "seyfert";

import { buildCommandsList } from "../../commands/General/help";

export default createEvent({
    data: {
        name: "messageCreate",
    },
    async run(message, client) {
        if (message.author.bot) return;

        const id = client.me?.id;
        if (!id) return;

        const content = message.content.trim();
        const isMentionOnly = content === `<@${id}>` || content === `<@!${id}>`;
        if (!isMentionOnly) return;

        try {
            const db = (client as unknown as { db: { getLocale(id: string): Promise<string> } }).db;
            const locale = message.guildId ? await db.getLocale(message.guildId) : (client.langs.defaultLang ?? "en");
            const translate = client.t(locale).get();
            const container = await buildCommandsList(client, translate);

            await message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
                allowed_mentions: { parse: [] },
            });
        } catch (error) {
            client.logger.error(error);
        }
    },
});
