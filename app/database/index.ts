import { bot, colors } from "#config";
import type { Client } from "../AichanMusic";

export enum CacheKeys {
    Custom = "custom",
    Guild = "guild",
}

export type PingTarget = "postgres" | "redis";

export interface PingResult {
    target: PingTarget;

    latency: number;

    connected: boolean;
}

export type CustomValue = string | number | boolean | object | unknown[] | null;

export interface SelectCustom {
    id: string;

    data: CustomValue;
}

export interface SelectGuild {
    id: string;

    color: number | null;

    locale: string | null;

    prefixs: string[] | null;
}

export class AIODatabase {
    protected readonly sql: Bun.SQL;

    readonly cache: Bun.RedisClient;

    protected readonly client: Client;

    private schemaReady = false;

    constructor(client: Client, connectedLog: boolean = false) {
        this.client = client;

        const postgresHost = import.meta.env.PostgresHost ?? "localhost";
        const postgresPort = import.meta.env.PostgresPort ?? "5432";
        const postgresDatabase = import.meta.env.PostgresDatabase;
        const postgresUsername = import.meta.env.PostgresUsername ?? "postgres";
        const postgresPassword = import.meta.env.PostgresPassword ?? "";
        const postgresUrl =
            import.meta.env.PostgresUrl ??
            `postgres://${encodeURIComponent(postgresUsername)}:${encodeURIComponent(postgresPassword)}@${postgresHost}:${postgresPort}/${postgresDatabase}`;
        const redisUrl = import.meta.env.RedisUrl;

        if (!postgresDatabase) {
            throw new Error("Missing environment variable: PostgresDatabase");
        }

        if (!redisUrl) {
            throw new Error("Missing environment variable: RedisUrl");
        }

        this.sql = new Bun.SQL({
            url: postgresUrl,
            tls: {
                rejectUnauthorized: true,
                ca: import.meta.env.PostgresSslCa?.replace(/\\n/g, "\n"),
            },
        });
        this.sql
            .connect()
            .then(() => {
                if (connectedLog) this.client.logger.info("[Database: Postgres] Connected");
            })
            .catch((error) => this.client.logger.error("[Database: Postgres] Connection error:", error));

        this.cache = new Bun.RedisClient(redisUrl);
        this.cache
            .connect()
            .then(() => {
                if (connectedLog) this.client.logger.info("[Database: Redis] Connected");
            })
            .catch((error) => this.client.logger.info("[Database: Redis] Connection error:", error));
    }

    private async ensureSchema(): Promise<void> {
        if (this.schemaReady) {
            return;
        }

        await this.sql`
            CREATE TABLE IF NOT EXISTS custom (
                id TEXT PRIMARY KEY,
                data JSONB
            )
        `;

        await this.sql`
            CREATE TABLE IF NOT EXISTS guild (
                id TEXT PRIMARY KEY,
                color INTEGER,
                locale TEXT,
                prefixs JSONB
            )
        `;

        this.schemaReady = true;
    }

    private parseJson<T>(value: unknown): T | null {
        if (value === null || value === undefined) {
            return null;
        }

        if (typeof value === "string") {
            try {
                return JSON.parse(value) as T;
            } catch {
                return value as T;
            }
        }

        return value as T;
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

    public async ping(target: PingTarget = "postgres"): Promise<PingResult> {
        const start = performance.now();

        try {
            switch (target) {
                case "redis": {
                    await this.cache.ping();
                    break;
                }

                case "postgres": {
                    await this.sql`SELECT 1`;

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
        await this.ensureSchema();

        const rows = await this.sql<{ id: string; data: unknown }[]>`SELECT id, data FROM custom`;

        return rows.map((row) => ({
            id: row.id,
            data: this.parseJson<CustomValue>(row.data),
        }));
    }

    public async getGuilds(): Promise<SelectGuild[]> {
        await this.ensureSchema();

        const rows = await this.sql<
            { id: string; color: number | null; locale: string | null; prefixs: unknown }[]
        >`SELECT id, color, locale, prefixs FROM guild`;

        return rows.map((row) => ({
            id: row.id,
            color: row.color ?? null,
            locale: row.locale ?? null,
            prefixs: this.parseJson<string[]>(row.prefixs) ?? null,
        }));
    }

    private async upsertCustom(id: SelectCustom["id"], data: SelectCustom["data"]): Promise<void> {
        await this.ensureSchema();

        await this.sql`
            INSERT INTO custom (id, data)
            VALUES (${id}, ${JSON.stringify(data)}::jsonb)
            ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
        `;
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

        await this.ensureSchema();

        const [row] = await this.sql<{ data: unknown }[]>`SELECT data FROM custom WHERE id = ${id}`;

        if (!row) {
            return null;
        }

        const data = this.parseJson<SelectCustom["data"]>(row.data);

        await this.setCache(CacheKeys.Custom, id, data);

        return data;
    }

    public async setCustom(id: SelectCustom["id"], data: SelectCustom["data"]): Promise<SelectCustom["data"]> {
        await this.upsertCustom(id, data);

        await this.setCache(CacheKeys.Custom, id, data);

        return data;
    }

    public async deleteCustom(id: SelectCustom["id"]): Promise<void> {
        await this.ensureSchema();

        await this.sql`DELETE FROM custom WHERE id = ${id}`;

        await this.deleteCache(CacheKeys.Custom, id);
    }

    public async getGuildById(id: SelectGuild["id"]): Promise<SelectGuild | null> {
        const cached = await this.getCache<SelectGuild>(CacheKeys.Guild, id);

        if (cached !== null) {
            return cached;
        }

        await this.ensureSchema();

        const [row] = await this.sql<{ id: string; color: number | null; locale: string | null; prefixs: unknown }[]>`
                SELECT id, color, locale, prefixs FROM guild WHERE id = ${id}
            `;

        if (!row) {
            return null;
        }

        const guild: SelectGuild = {
            id: row.id,
            color: row.color ?? null,
            locale: row.locale ?? null,
            prefixs: this.parseJson<string[]>(row.prefixs) ?? null,
        };

        await this.setCache(CacheKeys.Guild, id, guild);

        return guild;
    }

    public async getColor(id: SelectGuild["id"]): Promise<number> {
        const guild = await this.getGuildById(id);

        return guild?.color ?? colors.Primary;
    }

    public async getLocale(id: SelectGuild["id"]): Promise<string> {
        const guild = await this.getGuildById(id);

        return guild?.locale ?? bot.Locale;
    }

    public async getPrefix(id: SelectGuild["id"]): Promise<string[]> {
        const guild = await this.getGuildById(id);

        return guild?.prefixs ?? bot.CommandPrefixs;
    }

    public async setColor(id: SelectGuild["id"], color: number): Promise<number> {
        await this.ensureSchema();

        await this.sql`
            INSERT INTO guild (id, color)
            VALUES (${id}, ${color})
            ON CONFLICT (id) DO UPDATE SET color = EXCLUDED.color
        `;

        await this.deleteCache(CacheKeys.Guild, id);

        return color;
    }

    public async setLocale(id: SelectGuild["id"], locale: string): Promise<string> {
        await this.ensureSchema();

        await this.sql`
            INSERT INTO guild (id, locale)
            VALUES (${id}, ${locale})
            ON CONFLICT (id) DO UPDATE SET locale = EXCLUDED.locale
        `;

        await this.deleteCache(CacheKeys.Guild, id);

        return locale;
    }

    public async setPrefix(id: SelectGuild["id"], prefixs: string[]): Promise<string[]> {
        await this.ensureSchema();

        await this.sql`
            INSERT INTO guild (id, prefixs)
            VALUES (${id}, ${JSON.stringify(prefixs)}::jsonb)
            ON CONFLICT (id) DO UPDATE SET prefixs = EXCLUDED.prefixs
        `;

        await this.deleteCache(CacheKeys.Guild, id);

        return prefixs;
    }

    public async deleteGuild(id: SelectGuild["id"]): Promise<void> {
        await this.ensureSchema();

        await this.sql`DELETE FROM guild WHERE id = ${id}`;

        await this.deleteCache(CacheKeys.Guild, id);
    }
}
