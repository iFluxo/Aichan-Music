import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, createStringOption, Declare, Embed, MessageFlags, Options } from "seyfert";

import { colors } from "#config";
import { getUser } from "#utils/function";

const avatarOptions = {
    user: createStringOption({
        description: "The user id, name or mention to get the avatar from.",
        required: false,
    }),
};

@Declare({
    name: "avatar",
    aliases: ["ava", "av"],
    description: "Showing the user global and guild avatar.",
    contexts: ["Guild", "BotDM"],
    integrationTypes: ["GuildInstall", "UserInstall"],
    botPermissions: ["EmbedLinks"],
})
@Cooldown.user(1_000)
@Options(avatarOptions)
export default class AvatarCommand extends Command {
    async run(ctx: CommandContext<typeof avatarOptions>) {
        const translate = ctx.t.get();
        const resolved = await getUser(ctx, ctx.options?.user);
        const isMember = "user" in resolved;

        const user = isMember ? resolved.user : resolved;
        const globalAvatar = user.avatarURL({ size: 2048 });
        const guildAvatar = isMember
            ? resolved.avatarURL({ exclude: true, size: 2048 })
            : ctx.member && "user" in ctx.member && ctx.member.user.id === user.id
              ? ctx.member.avatarURL({ exclude: true, size: 2048 })
              : null;

        const embed = new Embed()
            .setColor(colors.Primary)
            .setAuthor({ name: user.id })
            .setTitle(translate.avatar.title(user.globalName ?? user.name))
            .setURL(guildAvatar ?? undefined)
            .setImage(guildAvatar ?? globalAvatar);

        await ctx.editOrReply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral,
        });
    }
}
