import { Client, Room } from "colyseus.js";

class GameClient {
    client: Client
    room?: Room

    constructor() {
        this.client = new Client(import.meta.env.VITE_SERVER_URL)
    }

    async join() {
        const client = this.client
        const username = "无名氏" //prompt("名字") || "无名氏"
        try {
            const room = await client.joinOrCreate("room", { username });
            this.room = room
            console.log("joined successfully", room);
        } catch (e) {
            console.error("join error", e);
        }
    }
}

export default GameClient