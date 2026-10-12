import { ComponentCommand, type ComponentContext } from "seyfert";

export default class Default extends ComponentCommand {
    componentType = "Button" as const;

    async run(ctx: ComponentContext<typeof this.componentType>) {
        return await ctx.editOrReply({ content: ctx.t.get().components.button });
    }
}
