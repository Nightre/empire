import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player } from "./schema/MyRoomState";

export class MyRoom extends Room<MyRoomState> {
  maxClients = 4;
  state = new MyRoomState(100, 80);

  onCreate(options: any) {
    this.onMessage("place_tile", (client, message) => {
      this.state.map[message.index] = 3
    });

    this.onMessage("pos", (client, message) => {
      this.state.players.get(client.sessionId).assign(message)
    })
  }

  onJoin(client: Client, options: any) {
    this.state.players.set(client.sessionId, new Player().assign({
      username: options.username,
      x: 1000,
      y: 200,
    }))
    client.send("joined")
  }

  onLeave(client: Client, consented: boolean) {
    this.state.players.delete(client.sessionId)
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
