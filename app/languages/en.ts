import { emoji } from "#config";

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

    music: {
        play: {
            description: "Play a track or playlist from a search query or URL.",
            options: {
                query: "Song name, URL or search query.",
            },
            added: (title: string, position: number) => `${emoji.music.add} Added **${title}** to the queue (${position}).`,
            playlistAdded: (name: string, count: number) => `${emoji.music.add} Added **${count}** tracks from **${name}** to the queue.`,
            ended: `${emoji.music.ended} The queue has ended, leaving the voice channel.`,
        },
        skip: {
            description: "Skip the current track.",
            options: {
                amount: "How many tracks to skip.",
            },
            skipped: (title: string) => `${emoji.music.skip} Skipped **${title}**.`,
            noNext: `${emoji.error} There is no next track to skip to.`,
        },
        stop: {
            description: "Stop the player and clear the queue.",
            stopped: `${emoji.music.ended} Stopped the player and cleared the queue.`,
        },
        pause: {
            description: "Pause the current track.",
            paused: `${emoji.music.pause} Paused the player.`,
            already: `${emoji.error} The player is already paused.`,
        },
        resume: {
            description: "Resume the current track.",
            resumed: `${emoji.music.resume} Resumed the player.`,
            already: `${emoji.error} The player is not paused.`,
        },
        nowplaying: {
            description: "Show the currently playing track.",
            title: "Now Playing",
            fields: {
                author: "Author",
                duration: "Duration",
                position: "Position",
            },
        },
        queue: {
            description: "Show the current queue.",
            options: {
                page: "Queue page.",
            },
            title: "Queue",
            nowPlaying: "Now Playing",
            upcoming: "Upcoming",
            empty: `${emoji.error} The queue is empty.`,
            footer: (length: number, page: number, pages: number) => `${length} tracks • Page ${page}/${pages}`,
        },
        volume: {
            description: "Set the player volume.",
            options: {
                volume: "Volume percentage (0-200).",
            },
            set: (volume: number) => `${emoji.music.volume} Set the volume to **${volume}%**.`,
        },
        loop: {
            description: "Cycle the loop mode for the queue.",
            options: {
                mode: "Loop mode.",
            },
            modes: {
                none: "off",
                track: "track",
                queue: "queue",
            },
            set: (mode: string) => `${emoji.music.loop} Set the loop mode to **${mode}**.`,
        },
        shuffle: {
            description: "Shuffle the queued tracks.",
            shuffled: (count: number) => `${emoji.music.shuffle} Shuffled **${count}** queued tracks.`,
            notEnough: `${emoji.error} There are not enough queued tracks to shuffle.`,
        },
        remove: {
            description: "Remove a track from the queue.",
            options: {
                position: "Queue position to remove.",
            },
            removed: (title: string) => `${emoji.music.remove} Removed **${title}** from the queue.`,
            invalid: `${emoji.error} Invalid queue position.`,
        },
        seek: {
            description: "Seek to a position in the current track.",
            options: {
                position: "Position in seconds.",
            },
            seeked: (time: string) => `${emoji.music.seek} Seeked to **${time}**.`,
            invalid: `${emoji.error} Cannot seek this track.`,
        },
        leave: {
            description: "Disconnect the bot from the voice channel.",
            left: `${emoji.music.leave} Left the voice channel.`,
        },
        errors: {
            noVoice: `${emoji.error} You need to join a voice channel first.`,
            notSameChannel: `${emoji.error} You need to be in the same voice channel as me.`,
            noQueue: `${emoji.error} I'm not playing anything right now.`,
            noResults: `${emoji.error} No results found for that query.`,
            loadFailed: `${emoji.error} Failed to load that track.`,
            nsfw: `${emoji.error} I cannot play age-restricted content in a non-NSFW channel.`,
            joinFailed: `${emoji.error} I couldn't join your voice channel.`,
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
