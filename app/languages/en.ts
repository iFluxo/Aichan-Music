export default {
    metadata: {
        name: "English",
        code: "en",
    },

    common: {
        onlyInGuild: "This command can only be used inside a server.",
        deferReply: "Sending request...",
    },

    errors: {
        run: "Something went wrong!",
        options: "Invalid options provided.",
        permissions: (permissions: string) => `You need ${permissions} permissions to use this command.`,
        botPermissions: (permissions: string) => `I need ${permissions} permissions to run this command.`,
    },

    middleware: {
        cooldown: (time?: string) => `This command is cooling down. Try again ${time}.`,
    },

    help: {
        description: "Displaying commands list and usage helper.",
        options: {
            command: "Input a command name.",
        },
        list: {
            title: "Commands list",
            description: (helpSlash?: string) => `This is a list of commands. Use ${helpSlash} for more spesific command info.`,
        },
        specific: {
            searching: (cmdName?: string) => `*Searching command with name \`${cmdName}\`...*`,
            notFound: (cmdName?: string) => `Command with name \`${cmdName}\` is not found.`,
            aliases: (list?: string) => `aliases: ${list}`,
            category: (name?: string) => `category: \`${name}\``,
            cooldown: (cd?: number) => `cooldown: \`${cd} seconds\``,
        },
    },

    avatar: {
        description: "Showing the user global and guild avatar.",
        options: {
            user: "The user id, name or mention to get the avatar from.",
        },
        title: (name?: string) => `${name ?? "User"}'s Avatar`,
    },

    chat: {
        description: "Chat with a friendly AI assistant.",
        options: {
            message: "What do you want to talk about. Send `reset` to clear the conversation.",
        },
        empty: "`❌` Provide a message to chat with the AI.",
        reset: "`🔄` Conversation history has been cleared.",
        unavailable: "`❌` The AI is unavailable right now. Please try again in a moment.",
        footer: "Powered by Pollinations.ai",
    },

    prefix: {
        description: "Set an extra command prefix or reset to defaults for this server.",
        options: {
            prefixs: "Add extra prefixes or reset the command prefix for this server.",
        },
        current: (list?: string) =>
            `\`ℹ️\` Current prefixes: ${list}\n\nUsage:\n- \`prefix <prefix...>\` — add extra prefixes on top of the defaults\n- \`prefix reset\` — reset to the default prefixes only`,
        reset: (list?: string) => `✅ Prefix has been reset to: ${list}`,
        updated: (list?: string) => `✅ Prefix has been updated to: ${list}`,
        invalid: "`❌` Provide 1-10 unique prefixes, each at most 5 characters long.",
    },

    language: {
        description: "Change the bot language for this server.",
        options: {
            locale: "Language code to set.",
        },
        current: (current?: string, list?: string) =>
            `\`ℹ️\` Current language: ${current}\nAvailable:\n${list}\n\nUsage: \`language <locale>\` — set the bot language for this server.`,
        notSupported: (input?: string, list?: string) => `\`❌\` Language \`${input}\` is not supported.\nAvailable:\n${list}`,
        updated: (locale?: string, name?: string) => `✅ Language has been set to \`${locale}\`${name ? ` (${name})` : ""}.`,
    },

    ping: {
        title: "Latency",
        description: "Showing client, runtime and database latency.",
        client: {
            title: "Client",
            value: (ping?: number) => `\`${ping ?? 0} ms\``,
        },
        database: {
            title: "Database",
            value: (ping?: number) => `\`${ping ?? 0} ms\``,
        },
        runtime: {
            title: "Runtime",
            value: (ping?: number) => `\`${ping ?? 0} ms\``,
        },
    },

    stats: {
        description: "Showing about bot statistics.",
        title: "Statistics Information",
        fields: {
            guilds: "Total Guilds",
            users: "Total Users",
            channels: "Total Channels",
            roles: "Total Roles",
            emojis: "Total Emojis",
            members: "Total Members",
            messages: "Total Messages",
            latency: "Latency",
            shards: "Shards",
            os: "OS",
            release: "Release",
            arch: "Arch",
            cpu: "CPU",
            memory: "Memory ( RSS )",
            uptime: "Uptime",
        },
    },

    components: {
        button: "Hello World from Button",
        select: "Hello World from Select Menu",
        error: "Component error!",
        modalError: "Modal error!",
    },

    dev: {
        eval: {
            empty: "`❌` Input code!",
            watcherEnded: (name: string, reason: string, timestamp: number) =>
                `\`📕\` ${name} watcher ended <t:${timestamp}:R>. (\`${reason}\`)`,
            type: (typecode: string, ms: number) => `Type: ${typecode} | ${ms}ms`,
            errorType: (ms: number) => `Type: Error | ${ms}ms`,
        },
        shell: {
            empty: "`❌` Input command!",
            watcherEnded: (name: string, reason: string, timestamp: number) =>
                `> ${name} watcher ended <t:${timestamp}:R>. (\`${reason}\`)`,
            footer: (ms: number) => `Unix Shell | ${ms} ms`,
            errorFooter: (ms: number) => `Error | ${ms} ms`,
        },
    },
};
