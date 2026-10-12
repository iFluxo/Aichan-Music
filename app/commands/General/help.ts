import { readdirSync } from "node:fs";
import { join } from "node:path";
import { Cooldown } from "@slipher/cooldown";
import {
    Command,
    type CommandContext,
    Container,
    createStringOption,
    Declare,
    type DefaultLocale,
    MessageFlags,
    Options,
    type RESTGetAPIApplicationCommandsResult,
    Separator,
    TextDisplay,
} from "seyfert";
import type { UsingClient } from "seyfert/lib/commands/applications/shared";
import { emojis as categoryEmoji } from "#config";

const APP_COMMANDS_TTL = 300_000;

let appCommandsCache: { data: RESTGetAPIApplicationCommandsResult | undefined; expires: number } | undefined;

const helpOptions = {
    command: createStringOption({
        description: "Input a command name.",
        async autocomplete(interaction) {
            const query = interaction.getInput().toLowerCase();
            const commands = interaction.client.commands.values.filter((cmd) => !cmd.props.onlyForDev);
            const names = commands
                .map((cmd) => cmd.name)
                .filter((name) => name.toLowerCase().includes(query))
                .slice(0, 25)
                .map((name) => ({ name, value: name }));

            await interaction.respond(names);
        },
    }),
};

@Declare({
    name: "help",
    aliases: ["h"],
    description: "Displaying commands list and usage helper.",
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
    botPermissions: ["EmbedLinks"],
})
@Cooldown.user(3_000)
@Options(helpOptions)
export default class HelpCommand extends Command {
    async run(ctx: CommandContext<typeof helpOptions>) {
        const translate = ctx.t.get();

        if (ctx.options?.command?.length) await helpSpecific(ctx, translate);
        else
            await ctx.editOrReply({
                components: [await buildCommandsList(ctx.client, translate)],
                flags: MessageFlags.IsComponentsV2,
            });
    }
}

async function helpSpecific(ctx: CommandContext<typeof helpOptions>, translate: DefaultLocale) {
    const cmdToSearch = ctx.options.command;
    if (!cmdToSearch) return;

    await ctx.editOrReply({
        components: [new Container().addComponents(new TextDisplay().setContent(translate.help.specific.searching(cmdToSearch)))],
        flags: MessageFlags.IsComponentsV2,
    });

    const commands = ctx.client.commands.values.filter((cmd) => !cmd.props.onlyForDev);
    const commandOwned =
        commands.find((cmd) => cmd.name === cmdToSearch.toLowerCase()) ??
        commands.find((cmd) => cmd instanceof Command && cmd.aliases?.includes(cmdToSearch.toLowerCase()));

    if (!commandOwned)
        return await ctx.editOrReply({
            components: [new Container().addComponents(new TextDisplay().setContent(translate.help.specific.notFound(cmdToSearch)))],
            flags: MessageFlags.IsComponentsV2,
        });

    const appCommands = await getAppCommands(ctx.client);
    const commandNameSlash = convertToSlash(appCommands, commandOwned.name);

    const commandAliases = commandOwned instanceof Command ? (commandOwned.aliases ?? []) : [];
    const aliasesText = commandAliases.length
        ? ` ( ${commandAliases.map((name) => convertToSlash(appCommands, commandOwned.name).replace(commandOwned.name, name)).join(", ")} )`
        : "";

    const container = new Container().addComponents(
        new TextDisplay().setContent(`## ${commandNameSlash}${aliasesText}\n${commandDescription(translate, commandOwned.name)}`),
        new Separator(),
        new TextDisplay().setContent(
            `- ${translate.help.specific.category(commandOwned.__filePath?.split("/").at(-2))}\n- ${translate.help.specific.cooldown(msToSecond(commandOwned.cooldown?.interval ?? 1000))}`,
        ),
    );

    await ctx.editOrReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
}

export async function buildCommandsList(client: UsingClient, translate: DefaultLocale): Promise<Container> {
    const commands = client.commands.values.filter((cmd) => !cmd.props.onlyForDev);
    const appCommands = await getAppCommands(client);

    const commandComponents = [];
    const commandsRoot = join(import.meta.dir, "..");
    const categories = readdirSync(commandsRoot).filter((name) => name !== "Developer");

    for (const category of categories) {
        commandComponents.push(
            new Separator(),
            new TextDisplay().setContent(
                `### \`${categoryEmoji[`#${category}` as keyof typeof categoryEmoji]}\` ${category}\n- - ${commands
                    .filter((cmd) => cmd.__filePath?.split("/").at(-2) === category)
                    .map((cmd) => convertToSlash(appCommands, cmd.name))
                    .join(", ")}`,
            ),
        );
    }

    return new Container().addComponents(
        new TextDisplay().setContent(
            `## ${translate.help.list.title}\n${translate.help.list.description(convertToSlash(appCommands, "help"))}`,
        ),
        ...commandComponents,
    );
}

async function getAppCommands(client: UsingClient): Promise<RESTGetAPIApplicationCommandsResult | undefined> {
    const now = Date.now();

    if (appCommandsCache && appCommandsCache.expires > now) {
        return appCommandsCache.data;
    }

    const data = await client.proxy.applications(client.applicationId)?.commands?.get();
    appCommandsCache = { data, expires: now + APP_COMMANDS_TTL };

    return data;
}

function convertToSlash(appCommands: RESTGetAPIApplicationCommandsResult | undefined, name: string) {
    const command = appCommands?.find((cmd) => cmd.name === name?.toLowerCase());
    return command ? `</${name?.toLowerCase()}:${command.id}>` : `\`/${name?.toLowerCase()}\``;
}

function commandDescription(translate: DefaultLocale, name: string) {
    const entry = translate[name as keyof DefaultLocale];
    return entry && "description" in entry ? entry.description : "";
}

function msToSecond(ms: number) {
    return Math.floor((ms / 1000) % 60);
}
