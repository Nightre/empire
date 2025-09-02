import { Room, Client } from "@colyseus/core";
import { Area, MyRoomState, Player } from "./schema/MyRoomState";
import { coordToIndex, indexToCoord } from "../utils";

const TileSize = 32

export class MyRoom extends Room<MyRoomState> {
  maxClients = 4;
  state = new MyRoomState(100, 80);

  onCreate(options: any) {
    this.onMessage("place_tile", (client, message) => {
      this.state.buildings[message.index] = 5
    });

    this.onMessage("pos", (client, message) => {
      this.state.players.get(client.sessionId).assign(message)
    })
  }

  onJoin(client: Client, options: any) {
    let index = Math.random()
    while (this.state.map[index] != 2) {
      index = Math.round(Math.random() * this.state.width * this.state.height)
    }
    const initPos = indexToCoord(index, this.state.width)
    const player = new Player().assign({
      username: options.username,
      x: initPos.x * TileSize,
      y: initPos.y * TileSize,
    })

    const cells = [
      coordToIndex(initPos.x, initPos.y, this.state.width),
      coordToIndex(initPos.x + 1, initPos.y, this.state.width),
      coordToIndex(initPos.x, initPos.y + 1, this.state.width),
      coordToIndex(initPos.x + 1, initPos.y + 1, this.state.width),
    ]
    player.areas.push(
      new Area().assign({ cells })
    )

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
