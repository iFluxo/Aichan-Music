import { type CommandContext, createMiddleware } from "seyfert";

import { setLocale } from "#utils/function";

async function getGuildLocale(context: CommandContext, guildId: string): Promise<string> {
    const fallback = context.client.langs.defaultLang ?? "en";

    try {
        return (await context.db.getLocale(guildId)) ?? fallback;
    } catch {
        return fallback;
    }
}

async function getGuildName(context: CommandContext): Promise<string | undefined> {
    try {
        return (await context.guild())?.name;
    } catch {
        return undefined;
    }
}

export const commandInterface = createMiddleware<void, CommandContext>(async ({ context, next, stop }) => {
    if (context.command.props?.onlyForDev && !context.config.config.Developers.includes(context.author.id)) return stop();

    if (context.guildId) {
        const locale = await getGuildLocale(context, context.guildId);

        setLocale(context.guildId, locale);

        Object.defineProperty(context, "t", {
            configurable: true,
            value: context.client.t(locale),
        });
    }

    context.client.logger.info(
        `${context.author.username} (${context.author.id}) used /${context?.resolver?.fullCommandName} in ${await getGuildName(context)}`,
    );
    return next();
});
