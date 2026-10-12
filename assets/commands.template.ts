import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, Declare } from "seyfert";

@Declare({
    name: "",
    aliases: [],
    description: "",
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
    botPermissions: ["EmbedLinks"],
})
@Cooldown.user(1_000)
export default class Template extends Command {
    async run(ctx: CommandContext) {
        await ctx.write({ content: "Hi, from template" });
    }
}
