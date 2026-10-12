import { AIODatabase } from "app/database/index";
import type { Client } from "app/structures/Client";
import { createPlugin } from "seyfert";

export function DatabasePlugin(connectedLog: boolean = false) {
    let instance: AIODatabase | undefined;
    const getDatabase = (client: Client) => (instance ??= new AIODatabase(client, connectedLog));

    return createPlugin({
        name: "Database",
        ctx: {
            db: (_interaction, client) => getDatabase(client as Client),
        },
        client: {
            db: (client) => getDatabase(client as Client),
        },
        setup(client) {
            client.logger.info(`[${this.name}-Plugin] loaded`);
        },
    });
}
