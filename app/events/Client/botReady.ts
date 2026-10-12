import { createEvent } from "seyfert";

export default createEvent({
    data: {
        once: true,
        name: "botReady",
    },
    async run(user, client) {
        client.logger.info("Login as", user.tag, "ready now!");
    },
});
