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

export const lavalink = {
    Name: import.meta.env.LavalinkName ?? "default",
    Url: import.meta.env.LavalinkUrl ?? "localhost:2333",
    Auth: import.meta.env.LavalinkAuth ?? "youshallnotpass",
    Secure: (import.meta.env.LavalinkSecure ?? "false") === "true",
    Search: import.meta.env.LavalinkSearch ?? "ytsearch",
};

export const emojis = {
    "#Developer": "🔐",
    "#Music": "🎵",
    "#Utility": "🛠️",
};
