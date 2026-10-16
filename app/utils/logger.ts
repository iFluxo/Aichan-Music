process.on("unhandledRejection", (info: unknown) => console.error("UnhandledRejection?!", info));
process.on("uncaughtException", (info: unknown) => console.error("UncaughtException?!", info));

import { Logger } from "seyfert";
import { formatMemoryUsage } from "seyfert/lib/common/it/logger";

const loggerMemory = Logger as unknown as { __memoryCache: { rss: number; ts: number } };

Logger.customize((_logger, level, args) => {
    const now = Date.now();

    if (now - loggerMemory.__memoryCache.ts > 1000) {
        loggerMemory.__memoryCache = { rss: process.memoryUsage?.()?.rss ?? 0, ts: now };
    }
    const color = Logger.colorFunctions.get(level) ?? Logger.noColor;
    return [
        formatMemoryUsage(loggerMemory.__memoryCache.rss).replace("RAM Usage ", ""),
        `${color(Logger.prefixes.get(level) ?? "DEBUG")} >`,
        ...args,
    ];
});
