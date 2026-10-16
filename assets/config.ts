const { ConfigLocale, ConfigPrefixs, ConfigDevs, ConfigGuilds } = import.meta.env;

export const bot = {
    Locale: ConfigLocale ?? "en",
    CommandPrefixs: ConfigPrefixs?.split(",") ?? ["h", "h!"],
    Developers: ConfigDevs?.split(",") ?? ["561170896480501790"],
    DevGuilds: ConfigGuilds?.split(",") ?? ["1041813867640131665"],
};

export const colors = {
    Primary: 0xe0e3ff,
    Secondary: 0x5865f2,
};

export const emoji = {
    "#Developer": "🔐",
    "#Music": "🎵",
    "#Utility": "🛠️",
    error: "❌",
    music: {
        add: "➕",
        ended: "⏹️",
        skip: "⏭️",
        pause: "⏸️",
        resume: "▶️",
        seek: "⏩",
        shuffle: "🔀",
        loop: "🔁",
        volume: "🔊",
        remove: "🗑️",
        leave: "👋",
        live: "🔴",
    },
};
