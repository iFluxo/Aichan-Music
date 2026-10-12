import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./app/database/drizzle.schema.ts",
    out: "./drizzle",
    dialect: "turso",
    dbCredentials: {
        url: import.meta.env.TursoUrl,
        authToken: import.meta.env.TursoAuthToken,
    },
});
