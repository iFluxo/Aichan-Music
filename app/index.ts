import "./plugins/utils.logger";

import { type CooldownMiddlewares, type CooldownResult, cooldown } from "@slipher/cooldown";
import {
    type AnyContext,
    definePlugins,
    Formatter,
    type LocaleString,
    type ParseClient,
    type ParseGlobalMiddlewares,
    type Client as SeyfertClient,
} from "seyfert";
import { Yuna } from "yunaforseyfert";
import type * as config from "#config";
import type en from "./languages/en";
import * as globalMiddlewares from "./middlewares/index";
import { DatabasePlugin } from "./plugins/database.plugin";
import { resolveLocale } from "./plugins/utils.function";
import { WebhookPlugin } from "./plugins/webhook.plugin";
import { Client } from "./structures/Client";

function cooldownMessage(result: CooldownResult, context: AnyContext): string {
    const guildId = (context as { guildId?: string | null }).guildId;
    const client = context.client as {
        t(locale: string): { get(): { middleware: { cooldown(time?: string): string } } };
    };

    return client.t(resolveLocale(guildId)).get().middleware.cooldown(Formatter.timestamp(result.retryAfter));
}

const plugins = definePlugins(
    Yuna.plugin({
        parser: { syntax: { namedOptions: ["-", "--"] } },
    }),
    DatabasePlugin(true),
    WebhookPlugin({
        log: import.meta.env.WebhookLogUrl ?? "",
    }),
    cooldown({
        middleware: {
            global: true,
            message: cooldownMessage,
        },
    }),
);

declare module "seyfert" {
    interface SeyfertRegistry {
        client: ParseClient<SeyfertClient<true>>;
        plugins: typeof plugins;
        middlewares: CooldownMiddlewares<"cooldown"> & typeof globalMiddlewares;
        langs: typeof en;
    }

    interface GlobalMetadata extends ParseGlobalMiddlewares<typeof globalMiddlewares> {}

    interface ExtraProps {
        onlyForDev?: boolean;
    }

    interface InternalOptions {
        withPrefix: true | false;
    }
}

declare module "seyfert/lib/commands/applications/shared" {
    interface ExtendContext {
        config: typeof config;
        readyAt: number;
    }
}

const client = new Client({
    globalMiddlewares: Object.keys(globalMiddlewares),
    plugins,
});

client.setServices({
    middlewares: globalMiddlewares,
    langs: {
        default: "en",
        aliases: {
            en: ["en-US" as unknown as LocaleString],
            id: ["id-ID" as unknown as LocaleString],
        },
    },
});
