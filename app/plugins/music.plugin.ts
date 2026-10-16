import { createPlugin } from "seyfert";
import type { Client } from "../AichanMusic";
import { MusicService } from "../utils/music.service";

export function MusicPlugin(connectedLog: boolean = false) {
    let instance: MusicService | undefined;
    const getMusic = (client: Client) => (instance ??= new MusicService(client, connectedLog));

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
