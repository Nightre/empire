import { Client, getStateCallbacks, Room } from "colyseus.js";
import { MyRoomState } from "../../server/src/rooms/schema/MyRoomState"

class GameClient {
    client: Client
    room?: Room<MyRoomState>
    $: ReturnType<typeof getStateCallbacks<MyRoomState>>
    constructor() {
        this.client = new Client(import.meta.env.VITE_SERVER_URL)
    }

    async join() {
        const client = this.client;
        const username = "无名氏" + Math.round(Math.random() * 100);

        const room = await client.joinOrCreate<MyRoomState>("room", { username });
        this.room = room;
        console.log("joined successfully", room.state);

        this.$ = getStateCallbacks(this.room);

        await new Promise<void>((resolve) => {
            room.onStateChange.once(() => resolve());
        });
    }

    getPlayerState(sessionId?: string) {
        return this.room!.state.players.get(sessionId ?? this.room!.sessionId)
    }
}

export default GameClient