import { ArraySchema, MapSchema, Schema, SetSchema, type } from "@colyseus/schema";
import alea from "alea";
import { createNoise2D } from 'simplex-noise';
import { randomBrightColor } from "../../utils";

export class Cell extends Schema {
    @type('string') type: string
    @type("number") x: number;
    @type("number") y: number;
}

export class Player extends Schema {
    @type("string") username: string;
    @type("number") color: number = randomBrightColor();
}

export class MyRoomState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();
    @type([Cell]) map = new ArraySchema<Cell>();

    @type("number") width: number = 0;
    @type("number") height: number = 0;

    constructor(width: number, height: number) {
        super();
        this.width = width;
        this.height = height;

        this.map = new ArraySchema<Cell>();
        const occupiedPositions = new Set<string>(); // 用 "x_y" 保存占用格子

        let count = 0;
        const maxCells = 50;

        while (count < maxCells) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            const key = `${x}_${y}`;

            if (occupiedPositions.has(key)) continue; // 已经被占用，跳过

            const cell = new Cell().assign({
                x,
                y,
                type: "resource",
            });

            this.map.push(cell);
            occupiedPositions.add(key);
            count++;
        }
    }
}