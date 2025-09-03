import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player, Cell, Connect, Item } from "./schema/MyRoomState";
import { v4 as uuidv4 } from "uuid";

// 接口定义保持不变
export interface IConnectMessage {
    sourceCellId: string;
    sourceSlotKey: string;
    targetCellId: string;
    targetSlotKey: string;
}

export interface IDisconnectMessage {
    cellId: string;
    slotKey: string;
    type: 'input' | 'output';
}

export interface IBuildMessage {
    prototypeId: string,
    x: number,
    y: number
}

export class MyRoom extends Room<MyRoomState> {
    maxClients = 4;
    state = new MyRoomState(100, 80);

    onCreate(options: any) {
        this.onMessage("connect", (client, message: IConnectMessage) => {
            this.handleConnection(message);
        });

        this.onMessage("disconnect", (client, message: IDisconnectMessage) => {
            this.handleDisconnection(message);
        });

        this.onMessage("build", (client, message: IBuildMessage) => {
            // 为 cell 添加一个唯一的 ID，这很重要
            const cellId = uuidv4();
            const cell = new Cell().assign({ ...message });
            this.state.map.set(cellId, cell);
        });

        // 游戏主循环：物品移动
        this.clock.setInterval(() => {
            const dt = 100 / 1000; // 0.1 seconds

            // 使用 for...of 循环遍历 keys 集合，这样可以在循环内部安全地删除项
            const itemIds = Array.from(this.state.items.keys());
            for (const id of itemIds) {
                const item = this.state.items.get(id);
                if (!item) continue;

                const connect = this.state.connects.get(item.connectId);

                // 健壮性检查：如果连接不存在（可能已被删除），则删除该物品
                if (!connect) {
                    this.state.items.delete(id);
                    continue;
                }

                item.move(dt);

                // 物品到达终点
                if (item.process >= connect.length) {
                    // 在这里可以添加物品到达目标单元格的逻辑
                    // ...
                    this.state.items.delete(id);
                }
            }
        }, 100);

        // 游戏主循环：资源生成
        this.clock.setInterval(() => {
            this.state.map.forEach((cell) => {
                cell.output.forEach((connectId) => {
                    // 从 cell 的 output map 中得到 connectId
                    this.addItem(connectId, "茶");
                });
            });
        }, 2000); // 降低频率以方便观察
    }

    onJoin(client: Client, options: any) {
        console.log(client.sessionId, "joined!");

        const player = new Player().assign({
            username: options.username || "Anonymous",
        });

        this.state.players.set(client.sessionId, player);
        client.send("joined");
    }

    onLeave(client: Client, consented: boolean) {
        console.log(client.sessionId, "left!");
        this.state.players.delete(client.sessionId);
    }

    onDispose() {
        console.log("room", this.roomId, "disposing...");
    }


    // REWRITTEN: addItem 现在接受 connectId
    addItem(connectId: string, name: string) {
        if (!this.state.connects.has(connectId)) return; // 安全检查

        const item = new Item().assign({
            name,
            connectId: connectId,
            process: 0 // 确保从 0 开始
        });
        this.state.items.set(uuidv4(), item);
    }

    // REWRITTEN: 完全重写以适应新结构
    private handleConnection({ sourceCellId, sourceSlotKey, targetCellId, targetSlotKey }: IConnectMessage) {
        if (sourceCellId === targetCellId) return;

        const sourceCell = this.state.map.get(sourceCellId);
        const targetCell = this.state.map.get(targetCellId);
        if (!sourceCell || !targetCell) return;

        // 断开即将被占用的插槽上的任何旧连接
        this._breakConnectionAtSlot(sourceCell, sourceSlotKey, 'output');
        this._breakConnectionAtSlot(targetCell, targetSlotKey, 'input');

        // 创建一个代表整条线的 Connect 对象
        const newConnection = new Connect().assign({
            sourceCellId,
            sourceSlotKey,
            targetCellId,
            targetSlotKey,
        });
        newConnection.calcLength(this.state);

        // 1. 将新连接添加到全局 connects map
        this.state.connects.set(newConnection.id, newConnection);

        // 2. 在源和目标单元格中存储新连接的 ID
        sourceCell.output.set(sourceSlotKey, newConnection.id);
        targetCell.input.set(targetSlotKey, newConnection.id);

        console.log(`Successfully connected ${sourceCellId}:${sourceSlotKey} -> ${targetCellId}:${targetSlotKey} with ID ${newConnection.id}`);
    }

    // REWRITTEN: 逻辑更简单，因为它现在可以复用 _breakConnectionAtSlot
    private handleDisconnection({ cellId, slotKey, type }: IDisconnectMessage) {
        const cell = this.state.map.get(cellId);
        if (!cell) {
            console.warn(`Disconnection failed: Cell with ID ${cellId} not found.`);
            return;
        }
        this._breakConnectionAtSlot(cell, slotKey, type);
    }

    // HELPER: 这是一个通用的辅助函数，用于断开指定插槽上的连接
    private _breakConnectionAtSlot(cell: Cell, slotKey: string, type: 'input' | 'output') {
        const connectMap = (type === 'input') ? cell.input : cell.output;
        const connectId = connectMap.get(slotKey);

        if (connectId) {
            this._breakConnection(connectId);
        }
    }

    // CORE HELPER: 这是断开连接的核心逻辑，现在是唯一的
    private _breakConnection(connectId: string) {
        const connection = this.state.connects.get(connectId);
        if (!connection) return; // 连接已不存在

        const sourceCell = this.state.map.get(connection.sourceCellId);
        const targetCell = this.state.map.get(connection.targetCellId);

        // 从源单元格移除引用
        if (sourceCell) {
            sourceCell.output.delete(connection.sourceSlotKey);
        }

        // 从目标单元格移除引用
        if (targetCell) {
            targetCell.input.delete(connection.targetSlotKey);
        }

        // 从全局 map 中删除连接对象本身
        this.state.connects.delete(connectId);

        console.log(`Connection ${connectId} has been broken.`);
    }
}