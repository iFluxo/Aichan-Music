import { config } from "seyfert";

export default config.bot({
    token: import.meta.env.Token ?? "Invalid Bot Token!",
    locations: {
        base: "app",
        commands: "commands",
        components: "components",
        events: "events",
        langs: "languages",
    },
    intents: ["Guilds", "GuildMessages", "MessageContent"],
});
