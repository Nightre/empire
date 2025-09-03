import type { Game } from "./game";
import { Vec2 } from "./Vec2";

export const toCoords = (event: MouseEvent, game: Game) => {
    return  new Vec2(event.clientX * game.scaler.dpr, event.clientY * game.scaler.dpr);
}