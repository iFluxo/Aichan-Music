import { createPlugin } from "seyfert";
import type { Client } from "../AichanMusic";
import { MusicManager } from "./music.manager";

export function MusicPlugin(connectedLog: boolean = false) {
    let instance: MusicManager | undefined;
    const getMusic = (client: Client) => (instance ??= new MusicManager(client, connectedLog));

    return createPlugin({
        name: "Music",
        ctx: {
            music: (_interaction, client) => getMusic(client as Client),
        },
        setup(client) {
            getMusic(client as Client);
            client.logger.info(`[${this.name}-Plugin] loaded`);
        },
    });
}
