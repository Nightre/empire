import { ArraySchema, MapSchema, Schema, SetSchema, type } from "@colyseus/schema";
import alea from "alea";
import { createNoise2D } from 'simplex-noise';
import { randomBrightColor } from "../../utils";
import { v4 as uuidv4 } from 'uuid';

// export class LineItem {
//     name: string
//     process: number = 0
//     connect: Connect
//     start: Cell
//     id: string = uuidv4()
//     state: MyRoomState

//     constructor(state: MyRoomState, start: Cell, name: string, connect: Connect) {
//         this.name = name
//         this.start = start
//         this.connect = connect
//         this.state = state
//     }

//     move(dt: number) {
//         this.process += 1 * dt
//     }
// }

export class Connect extends Schema {
    id: string = uuidv4();

    @type('string') sourceCellId: string;
    @type('string') sourceSlotKey: string;

    @type('string') targetCellId: string;
    @type('string') targetSlotKey: string;

    @type('number') length: number;

    calcLength(state: MyRoomState) {
        const source = state.map.get(this.sourceCellId);
        const target = state.map.get(this.targetCellId);

        // 添加安全检查
        if (!source || !target) {
            this.length = 0;
            return;
        }

        const dx = source.x - target.x;
        const dy = source.y - target.y;
        this.length = Math.sqrt(dx * dx + dy * dy);
    }
}

export class Item extends Schema {
    @type('string') name: string;
    @type('string') emoji: string;

    @type("number") process: number;
    @type('string') connectId: string;

    move(dt: number) {
        this.process += 1 * dt
    }
}

export class Cell extends Schema {
    @type('string') prototypeId: string;
    @type("number") x: number;
    @type("number") y: number;

    @type({ map: 'string' }) input = new MapSchema<string>()
    @type({ map: 'string' }) output = new MapSchema<string>()
}

export class Player extends Schema {
    @type("string") username: string;
    @type("number") color: number = randomBrightColor();
}

export class Entity extends Schema {
    @type("string") prototypeId: string;
    @type("number") x = 0;
    @type("number") y = 0;
    @type("number") hp = 100;
}

export class MyRoomState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();
    @type({ map: Cell }) map = new MapSchema<Cell>();

    @type({ map: Item }) items = new MapSchema<Item>();
    @type({ map: Connect }) connects = new MapSchema<Connect>()
    @type({ map: Entity }) entities = new MapSchema<Entity>()

    @type("number") width: number = 0;
    @type("number") height: number = 0;

    constructor(width: number, height: number) {
        super();
        this.width = width;
        this.height = height;

        this.map = new MapSchema<Cell>();
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
                prototypeId: "resource",
            });

            this.map.set(uuidv4(), cell);
            occupiedPositions.add(key);
            count++;
        }
    }
}