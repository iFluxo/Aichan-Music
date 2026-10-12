import { createPlugin } from "seyfert";

export type PluginOptions = Record<string, string>;

export interface WebhookData {
    id: string;
    token: string;
}

export type WebhookMessage = string | Record<string, unknown>;

export interface Webhook {
    data: WebhookData;

    send(message: WebhookMessage): Promise<unknown>;

    edit(messageId: string, message: WebhookMessage): Promise<unknown>;

    fetch(messageId: string): Promise<unknown>;

    delete(messageId: string): Promise<void>;
}

export interface WebhookCollection {
    [hookName: string]: Webhook | string;
}

export function WebhookPlugin(options: PluginOptions = {}) {
    const collection: WebhookCollection = {};

    return createPlugin({
        name: "Webhook",

        client: {
            webhook: () => collection,
        },

        ctx: {
            webhook: () => collection,
        },

        async setup(client) {
            let size = 0;

            for (const [hookName, webhookUrl] of Object.entries(options)) {
                const data = getData(webhookUrl);

                if (!data) {
                    client.logger.warn(`[${this.name}-Plugin] WEBHOOK URL for "${hookName}" is not valid!`);

                    continue;
                }

                collection[hookName] = createWebhook(data);

                size++;
            }

            client.logger.info(`[${this.name}-Plugin] ${size} loaded`);
        },
    });
}

function createWebhook(data: WebhookData): Webhook {
    const { id, token } = data;

    return {
        data,

        async send(message) {
            return request(`/webhooks/${id}/${token}?wait=true`, {
                method: "POST",
                body: normalizeMessage(message),
            });
        },

        async edit(messageId, message) {
            return request(`/webhooks/${id}/${token}/messages/${messageId}`, {
                method: "PATCH",
                body: normalizeMessage(message),
            });
        },

        async fetch(messageId) {
            return request(`/webhooks/${id}/${token}/messages/${messageId}`, {
                method: "GET",
            });
        },

        async delete(messageId) {
            await request(`/webhooks/${id}/${token}/messages/${messageId}`, {
                method: "DELETE",
            });
        },
    };
}

function normalizeMessage(message: WebhookMessage): Record<string, unknown> {
    if (typeof message === "string") {
        return {
            content: message,
        };
    }

    return message;
}

async function request<T = unknown>(
    path: string,
    options: {
        method: "GET" | "POST" | "PATCH" | "DELETE";

        body?: Record<string, unknown>;
    },
    attempt = 0,
): Promise<T> {
    const response = await fetch(`https://discord.com/api/v10${path}`, {
        method: options.method,

        headers: {
            Accept: "application/json",

            ...(options.body
                ? {
                      "Content-Type": "application/json",
                  }
                : {}),
        },

        ...(options.body
            ? {
                  body: JSON.stringify(options.body),
              }
            : {}),
    });

    if ((response.status === 429 || response.status >= 500) && attempt < 3) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "1");

        await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter, 1) * 1000));

        return request<T>(path, options, attempt + 1);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    const contentType = response.headers.get("content-type") ?? "";

    let result: unknown;

    if (contentType.includes("application/json")) {
        result = await response.json();
    } else {
        result = await response.text();
    }

    if (!response.ok) {
        const error = new Error(`Discord API Error ${response.status}: ${response.statusText}`) as Error & {
            status: number;
            body: unknown;
        };

        error.status = response.status;
        error.body = result;

        throw error;
    }

    return result as T;
}

function getData(webhookUrl: string): WebhookData | null {
    if (typeof webhookUrl !== "string" || webhookUrl.length === 0) {
        return null;
    }

    const match = webhookUrl
        .trim()
        .match(/^https?:\/\/(?:ptb\.|canary\.)?discord\.com\/api(?:\/v\d{1,2})?\/webhooks\/(\d{17,20})\/([^/?#\s]+)\/?$/i);

    if (!match) {
        return null;
    }

    const [, id, token] = match;

    if (!id || !token) {
        return null;
    }

    return {
        id,
        token,
    };
}
