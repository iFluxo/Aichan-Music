import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/tursodatabase-sync";
import mongoose from "mongoose";
import { colors, config } from "#config";
import type { Client } from "../structures/Client";

import { CustomTable, GuildTable, type SelectCustom, type SelectGuild } from "./drizzle.schema";

export enum CacheKeys {
    Custom = "custom",
    Guild = "guild",
    Color = "guild:color",
    Locale = "guild:locale",
    Prefixs = "guild:prefixs",
}

export type PingTarget = "drizzle" | "mongodb" | "redis";

export interface PingResult {
    target: PingTarget;

    latency: number;

    connected: boolean;
}

export class AIODatabase {
    protected readonly drizzle: ReturnType<typeof drizzle>;
    readonly cache: Bun.RedisClient;

    readonly mongo = mongoose;

    protected readonly client: Client;

    constructor(client: Client, connectedLog: boolean = false) {
        this.client = client;

        const tursoPath = Bun.env.TursoPath ?? "local.db";
        const tursoUrl = Bun.env.TursoUrl;
        const tursoAuthToken = Bun.env.TursoAuthToken;
        const redisUrl = Bun.env.RedisUrl;
        const mongoUrl = Bun.env.MongoUrl;

        if (!tursoUrl) {
            throw new Error("Missing environment variable: TursoUrl");
        }

        if (!tursoAuthToken) {
            throw new Error("Missing environment variable: TursoAuthToken");
        }

        if (!redisUrl) {
            throw new Error("Missing environment variable: RedisUrl");
        }

        if (!mongoUrl) {
            throw new Error("Missing environment variable: MongoUrl");
        }

        this.drizzle = drizzle({
            connection: {
                path: tursoPath,
                url: tursoUrl,
                authToken: tursoAuthToken,
            },
        });
        if (connectedLog) this.client.logger.info("[Database: Turso] Connected");

        this.cache = new Bun.RedisClient(redisUrl);
        this.cache
            .connect()
            .then(() => {
                if (connectedLog) this.client.logger.info("[Database: Redis] Connected");
            })
            .catch((error) => this.client.logger.info("[Database: Redis] Connection error:", error));

        mongoose
            .connect(mongoUrl)
            .then(() => {
                if (connectedLog) this.client.logger.info("[Database: MongoDB] Connected");
            })
            .catch((error) => this.client.logger.error("[Database: MongoDB] Connection error:", error));
    }

    private getCacheKey(namespace: CacheKeys, id: string): string {
        return `${namespace}:${id}`;
    }

    private async getCache<T>(namespace: CacheKeys, id: string): Promise<T | null> {
        const key = this.getCacheKey(namespace, id);
        const value = await this.cache.get(key);

        if (value === null) {
            return null;
        }

        try {
            return JSON.parse(value) as T;
        } catch {
            return value as T;
        }
    }

    private async setCache(namespace: CacheKeys, id: string, value: unknown): Promise<void> {
        const key = this.getCacheKey(namespace, id);

        await this.cache.set(key, JSON.stringify(value));
    }

    private async deleteCache(namespace: CacheKeys, id: string): Promise<void> {
        const key = this.getCacheKey(namespace, id);

        await this.cache.del(key);
    }

    public async ping(target: PingTarget = "drizzle"): Promise<PingResult> {
        const start = performance.now();

        try {
            switch (target) {
                case "mongodb": {
                    if (mongoose.connection.readyState !== 1) {
                        throw new Error("MongoDB is not connected");
                    }

                    await mongoose.connection.db?.command({
                        ping: 1,
                    });

                    break;
                }

                case "redis": {
                    await this.cache.ping();
                    break;
                }

                case "drizzle": {
                    await this.drizzle.select().from(CustomTable).where(eq(CustomTable.id, "ping-test"));

                    break;
                }

                default: {
                    throw new Error(`Unsupported ping target: ${target}`);
                }
            }

            return {
                target,
                latency: Math.round(performance.now() - start),
                connected: true,
            };
        } catch {
            return {
                target,
                latency: Math.round(performance.now() - start),
                connected: false,
            };
        }
    }

    public async getCustoms(): Promise<SelectCustom[]> {
        return this.drizzle.select().from(CustomTable);
    }

    public async getGuilds(): Promise<SelectGuild[]> {
        return this.drizzle.select().from(GuildTable);
    }

    private async upsertCustom(id: SelectCustom["id"], data: SelectCustom["data"]): Promise<void> {
        await this.drizzle
            .insert(CustomTable)
            .values({
                id,
                data,
            })
            .onConflictDoUpdate({
                target: CustomTable.id,
                set: {
                    data,
                },
            });
    }

    public async addCustom(id: SelectCustom["id"], data: SelectCustom["data"]): Promise<SelectCustom["data"]> {
        const oldData = await this.getCustom(id);

        let newData: SelectCustom["data"];

        if (Array.isArray(oldData)) {
            newData = [...oldData, data] as SelectCustom["data"];
        } else if (typeof oldData === "number" && typeof data === "number") {
            newData = (oldData + data) as SelectCustom["data"];
        } else if (
            typeof oldData === "object" &&
            oldData !== null &&
            typeof data === "object" &&
            data !== null &&
            !Array.isArray(oldData) &&
            !Array.isArray(data)
        ) {
            newData = {
                ...oldData,
                ...data,
            } as SelectCustom["data"];
        } else {
            newData = data;
        }

        await this.upsertCustom(id, newData);

        await this.setCache(CacheKeys.Custom, id, newData);

        return newData;
    }

    public async getCustom(id: SelectCustom["id"]): Promise<SelectCustom["data"] | null> {
        const cached = await this.getCache<SelectCustom["data"]>(CacheKeys.Custom, id);

        if (cached !== null) {
            return cached;
        }

        const [row] = await this.drizzle.select().from(CustomTable).where(eq(CustomTable.id, id));

        if (!row) {
            return null;
        }

        await this.setCache(CacheKeys.Custom, id, row.data);

        return row.data;
    }

    public async setCustom(id: SelectCustom["id"], data: SelectCustom["data"]): Promise<SelectCustom["data"]> {
        await this.upsertCustom(id, data);

        await this.setCache(CacheKeys.Custom, id, data);

        return data;
    }

    public async deleteCustom(id: SelectCustom["id"]): Promise<void> {
        await this.drizzle.delete(CustomTable).where(eq(CustomTable.id, id));

        await this.deleteCache(CacheKeys.Custom, id);
    }

    private async upsertGuild(id: SelectGuild["id"], data: Partial<Omit<SelectGuild, "id">>): Promise<void> {
        await this.drizzle
            .insert(GuildTable)
            .values({
                id,
                ...data,
            })
            .onConflictDoUpdate({
                target: GuildTable.id,
                set: {
                    ...data,
                },
            });
    }

    public async getGuildById(id: SelectGuild["id"]): Promise<SelectGuild | null> {
        const cached = await this.getCache<SelectGuild>(CacheKeys.Guild, id);

        if (cached !== null) {
            return cached;
        }

        const [row] = await this.drizzle.select().from(GuildTable).where(eq(GuildTable.id, id));

        if (!row) {
            return null;
        }

        await this.setCache(CacheKeys.Guild, id, row);

        return row;
    }

    public async getColor(id: SelectGuild["id"]): Promise<number> {
        const guild = await this.getGuildById(id);

        return guild?.color ?? colors.Primary;
    }

    public async getLocale(id: SelectGuild["id"]): Promise<string> {
        const guild = await this.getGuildById(id);

        return guild?.locale ?? config.Locale;
    }

    public async getPrefix(id: SelectGuild["id"]): Promise<string[]> {
        const guild = await this.getGuildById(id);

        return guild?.prefixs ?? config.CommandPrefixs;
    }

    public async setColor(id: SelectGuild["id"], color: SelectGuild["color"]): Promise<number> {
        await this.upsertGuild(id, {
            color,
        });

        const guild = await this.getGuildById(id);

        await this.setCache(CacheKeys.Guild, id, {
            ...(guild ?? { id }),
            color,
        });

        await this.setCache(CacheKeys.Color, id, color);

        return color;
    }

    public async setLocale(id: SelectGuild["id"], locale: SelectGuild["locale"]): Promise<string> {
        await this.upsertGuild(id, {
            locale,
        });

        const guild = await this.getGuildById(id);

        await this.setCache(CacheKeys.Guild, id, {
            ...(guild ?? { id }),
            locale,
        });

        await this.setCache(CacheKeys.Locale, id, locale);

        return locale;
    }

    public async setPrefix(id: SelectGuild["id"], prefixs: SelectGuild["prefixs"]): Promise<string[]> {
        await this.upsertGuild(id, {
            prefixs,
        });

        const guild = await this.getGuildById(id);

        await this.setCache(CacheKeys.Guild, id, {
            ...(guild ?? { id }),
            prefixs,
        });

        await this.setCache(CacheKeys.Prefixs, id, prefixs);

        return prefixs;
    }

    public async deleteGuild(id: SelectGuild["id"]): Promise<void> {
        await this.drizzle.delete(GuildTable).where(eq(GuildTable.id, id));

        await Promise.all([
            this.deleteCache(CacheKeys.Guild, id),
            this.deleteCache(CacheKeys.Color, id),
            this.deleteCache(CacheKeys.Locale, id),
            this.deleteCache(CacheKeys.Prefixs, id),
        ]);
    }
}
