import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player } from "./schema/MyRoomState";

export class MyRoom extends Room<MyRoomState> {
  maxClients = 4;
  state = new MyRoomState(100, 80);

  onCreate(options: any) {

  }

  onJoin(client: Client, options: any) {
    const player = new Player().assign({
      username: options.username,
    })

    this.state.players.set(client.sessionId, player)
    client.send("joined")
  }

  onLeave(client: Client, consented: boolean) {
    this.state.players.delete(client.sessionId)
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
