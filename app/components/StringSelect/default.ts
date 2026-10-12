import { ComponentCommand, type ComponentContext } from "seyfert";

export default class Default extends ComponentCommand {
    componentType = "StringSelect" as const;

    async run(ctx: ComponentContext<typeof this.componentType>) {
        return await ctx.editOrReply({ content: ctx.t.get().components.select });
    }
}
