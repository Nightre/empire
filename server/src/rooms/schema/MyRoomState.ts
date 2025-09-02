import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema";
import alea from "alea";
import { createNoise2D } from 'simplex-noise';
import { randomBrightColor } from "../../utils";

export class Cell extends Schema {
  @type("number") value: number = 0;
}

export class Area extends Schema {
  @type(['number']) cells: ArraySchema<number> = new ArraySchema()
}

export class Entity extends Schema {
  @type(['number']) index: number
  @type(['number']) type: number

  @type(['string']) kin: string
}

export class Player extends Schema {
  @type("string") username: string;
  @type("number") x: number;
  @type("number") y: number;
  @type("number") color: number = randomBrightColor();
  @type([Area]) areas: ArraySchema<Area> = new ArraySchema();
}

export class MyRoomState extends Schema {
  @type(['number']) map = new ArraySchema<number>();
  @type(['number']) buildings = new ArraySchema<number>();

  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: Entity }) entitys = new MapSchema<Entity>();

  @type("number") width: number = 0;
  @type("number") height: number = 0;

  constructor(width: number, height: number) {
    super()
    this.width = width;
    this.height = height;

    this.map = new ArraySchema<number>();
    this.buildings = new ArraySchema<number>(...new Array(width * height).fill(-1))

    const prng = alea('seed');
    const noise2D = createNoise2D(prng);

    const scale = 0.05;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const noiseValue = noise2D(x * scale, y * scale);

        let cellValue = 0
        if (noiseValue > 0.8) {
          cellValue = 3
        } else if (noiseValue > -0.3) {
          // 平原
          if (Math.random() > 0.2) {
            cellValue = 2
          } else {
            cellValue = 4
          }
        } else if (noiseValue > -0.5) {
          cellValue = 1
        } else {
          cellValue = 0
        }

        this.map.push(cellValue)
      }
    }
  }
}