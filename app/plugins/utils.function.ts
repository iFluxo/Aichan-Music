import type { CommandContext, GuildMemberStructure, UserStructure } from "seyfert";

const MENTION_PATTERN = /^<@!?(\d+)>$/;
const ID_PATTERN = /^\d{15,20}$/;

export type UserResolvable = GuildMemberStructure | UserStructure;

function candidateNames(user: UserStructure): string[] {
    return [user.username, user.globalName, user.name]
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.toLowerCase());
}

function matchesMember(member: GuildMemberStructure, query: string): boolean {
    const names = candidateNames(member.user);
    if (member.nick) names.push(member.nick.toLowerCase());
    return names.includes(query);
}

function resolveMention(ctx: CommandContext): UserResolvable | undefined {
    return ctx.message?.mentions?.users?.[0];
}

export function generateCases(word: string) {
    const result = [];
    const total = 1 << word.length;

    for (let i = 0; i < total; i++) {
        let str = "";

        for (let j = 0; j < word.length; j++) {
            if (i & (1 << j)) {
                str += word[j].toUpperCase();
            } else {
                str += word[j].toLowerCase();
            }
        }

        result.push(str);
    }

    return result;
}

export async function getUser(ctx: CommandContext, query = ""): Promise<UserResolvable> {
    const input = query.trim().toLowerCase();
    const guildId = ctx.guildId;

    if (!input) {
        return resolveMention(ctx) ?? ctx.author;
    }

    const id = input.match(MENTION_PATTERN)?.[1] ?? (ID_PATTERN.test(input) ? input : undefined);

    if (id) {
        if (guildId) {
            const cachedMember = await ctx.client.cache.members?.get(id, guildId);
            if (cachedMember) return cachedMember;

            try {
                return await ctx.client.members.fetch(guildId, id);
            } catch {}
        }

        const cachedUser = await ctx.client.cache.users?.get(id);
        if (cachedUser) return cachedUser;

        try {
            return await ctx.client.users.fetch(id);
        } catch {
            return resolveMention(ctx) ?? ctx.author;
        }
    }

    if (guildId) {
        try {
            const members = await ctx.client.cache.members?.values(guildId);
            if (members?.length) {
                const member = members.find((entry) => matchesMember(entry, input));
                if (member) return member;
            }

            const allMembers = await ctx.client.members.list(guildId, { limit: 1000 });
            const member = allMembers?.find((entry) => matchesMember(entry, input));
            if (member) return member;
        } catch {}
    }

    try {
        const users = await ctx.client.cache.users?.values();
        if (users?.length) {
            const user = users.find((entry) => candidateNames(entry).includes(input));
            if (user) return user;
        }
    } catch {}

    return resolveMention(ctx) ?? ctx.author;
}

const localeCache = new Map<string, string>();

export function setLocale(guildId: string, locale: string) {
    localeCache.set(guildId, locale);
}

export function resolveLocale(guildId: string | null | undefined, fallback = "en") {
    return guildId ? (localeCache.get(guildId) ?? fallback) : fallback;
}
