import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema";
import alea from "alea";
import { createNoise2D } from 'simplex-noise';

export class Cell extends Schema {
  @type("number") value: number = 0;
}

export class Player extends Schema {
  @type("string") username: string;
  @type("number") x: number;
  @type("number") y: number;
}

export class MyRoomState extends Schema {
  @type(['number']) map = new ArraySchema<number>();
  @type({ map: Player }) players = new MapSchema<Player>();

  @type("number") width: number = 0;
  @type("number") height: number = 0;

  constructor(width: number, height: number) {
    super()
    this.width = width;
    this.height = height;

    this.map = new ArraySchema<number>();

    const prng = alea('seed');
    const noise2D = createNoise2D(prng);

    const scale = 0.05;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const noiseValue = noise2D(x * scale, y * scale);
        if (noiseValue > 0.8) {
          this.map.push(4);
        } else if (noiseValue > 0.5) {
          this.map.push(3);
        } else if (noiseValue > 0.0) {
          // 平原
          if (Math.random() > 0.2) {
            this.map.push(2);
          } else {
            this.map.push(5);
          }

        } else if (noiseValue > -0.3) {
          this.map.push(1);
        } else {
          this.map.push(0);
        }
      }
    }
  }
}