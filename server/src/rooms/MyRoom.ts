// MyRoom.ts
import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player, Cell, Connect, Item, Entity, TargetType } from "./schema/MyRoomState";
import { Pathfinding } from "../Pathfinding";
import { CombatSystem } from "./CombatSystem"; // <-- 导入 CombatSystem

type Targetable = Cell | Connect | Entity;

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

    private readonly TARGET_DENSITY_WEIGHT = 20;
    private readonly PERTURBATION_INTERVAL = 2;

    onCreate(options: any) {
        this.onMessage("connect", (client, message: IConnectMessage) => {
            this.handleConnection(message);
        });

        this.onMessage("disconnect", (client, message: IDisconnectMessage) => {
            this.handleDisconnection(message);
        });

        this.onMessage("build", (client, message: IBuildMessage) => {
            const cell = new Cell().assign({ ...message });
            cell.team.push(client.sessionId)
            cell.team.push("player")

            this.state.map.set(cell.id, cell);

            if (message.prototypeId == 'home') {
                this.state.players.get(client.sessionId).hasHome = true
            }
        });

        // 游戏主循环：物品移动
        this.clock.setInterval(() => {
            const dt = 100 / 1000;
            const itemIds = Array.from(this.state.items.keys());
            for (const id of itemIds) {
                const item = this.state.items.get(id);
                if (!item) continue;
                const connect = this.state.connects.get(item.connectId);
                if (!connect) {
                    this.state.items.delete(id);
                    continue;
                }
                item.move(dt);
                if (item.process >= connect.length) {
                    this.state.items.delete(id);
                }
            }

            this.broadcast('bullet', {
                startX: 0,
                startY: 0,
                endX: 5,
                endY: 5,

                speed: 5,
            })
        }, 100);

        // 游戏主循环：资源生成
        this.clock.setInterval(() => {
            this.state.map.forEach((cell) => {
                if (cell.prototypeId === 'resource') { // Example: only resource cells generate items
                    cell.output.forEach((connectId) => {
                        this.addItem(connectId, "资源", "💎");
                    });
                }
            });
        }, 2000);

        // 主更新循环
        this.clock.setInterval(() => this.updateGame(), 50); // ~20 FPS server tick

        // 添加一些实体用于测试

        this.addEntity(1, 5, ["monster"], ["player"]);
        this.addEntity(1, 6, ["monster"], ["player"]);
        this.addEntity(1, 7, ["monster"], ["player"]);

        this.addEntity(3, 9, ["player"], ["monster"]);

    }

    updateGame() {
        const dt = this.clock.deltaTime / 1000;
        this.updateEntities(dt);
    }

    updateEntities(dt: number) {
        // 1. 准备工作
        const obstacles = new Set<string>();
        this.state.map.forEach(cell => {
            obstacles.add(`${Math.round(cell.x)}_${Math.round(cell.y)}`);
        });
        const pathfinder = new Pathfinding(this.state.width, this.state.height, obstacles);

        const targetCounts = new Map<string, number>();
        this.state.entities.forEach(entity => {
            if (entity.targetId) {
                targetCounts.set(entity.targetId, (targetCounts.get(entity.targetId) || 0) + 1);
            }
        });

        // 2. 遍历并更新每个实体
        this.state.entities.forEach(entity => {
            // 更新冷却
            if (entity.attackCooldown > 0) {
                entity.attackCooldown -= dt;
            }

            // 检查目标有效性
            let targetIsValid = CombatSystem.isTargetValid(entity.targetId, entity.targetType, this.state);

            // 如果目标无效，寻找新目标
            if (!targetIsValid) {
                const newTarget = CombatSystem.findBestTarget(entity, this.state, targetCounts, this.TARGET_DENSITY_WEIGHT);
                if (newTarget) {
                    entity.targetId = newTarget.targetId;
                    entity.targetType = newTarget.targetType;
                    entity.path = []; // 清空旧路径
                } else {
                    this.clearEntityTarget(entity);
                }
            }

            if (entity.targetId !== null && entity.targetType !== null) {
                const targetObject = this.getTargetObject(entity.targetId, entity.targetType);
                if (!targetObject) {
                    this.clearEntityTarget(entity);
                    return;
                }

                const targetPos = CombatSystem.getTargetPosition(targetObject, entity.targetType, this.state);
                if (targetPos) {
                    const path = pathfinder.findPath(entity.x, entity.y, targetPos.x, targetPos.y);
                    if (path && path.length > 1) {
                        path.shift();
                        entity.path = path;
                    }
                }

                const inRange = CombatSystem.isTargetInRange(entity, targetObject, entity.targetType, this.state);
                if (inRange) {
                    entity.path = [];
                    this.performAttack(entity, targetObject, entity.targetType);
                } else {
                    if (entity.path && entity.path.length > 0) {
                        this.moveEntity(entity, dt);
                    }
                }
            }
        });
    }

    private performAttack(attacker: Entity, target: Targetable, targetType: TargetType) {
        if (attacker.attackCooldown <= 0) {
            target.hp -= attacker.damage;

            attacker.attackCooldown = attacker.attackSpeed;

            if (target.hp <= 0) {
                this.destroyTarget(target, targetType);
                this.clearEntityTarget(attacker);
            }
        }
    }

    private destroyTarget(target: Targetable, targetType: TargetType) {
        switch (targetType) {
            case TargetType.CELL:
                this.destroyCell((target as Cell).id);
                break;
            case TargetType.CONNECT:
                this._breakConnection((target as Connect).id);
                break;
            case TargetType.ENTITY:
                this.destroyEntity((target as Entity).id);
                break;
        }
    }

    private getTargetObject(targetId: string, targetType: TargetType): Targetable | null {
        switch (targetType) {
            case TargetType.CELL:
                return this.state.map.get(targetId) || null;
            case TargetType.CONNECT:
                return this.state.connects.get(targetId) || null;
            case TargetType.ENTITY:
                return this.state.entities.get(targetId) || null;
            default:
                return null;
        }
    }

    private moveEntity(entity: Entity, dt: number) {
        entity.perturbationTimer -= dt;
        if (entity.perturbationTimer <= 0) {
            entity.movementPerturbation = {
                x: (Math.random() - 0.5) * 1,
                y: (Math.random() - 0.5) * 1,
            };
            entity.perturbationTimer = this.PERTURBATION_INTERVAL * (0.8 + Math.random() * 0.4);
        }

        const nextWaypoint = entity.path[0];
        const dx = nextWaypoint.x - entity.x;
        const dy = nextWaypoint.y - entity.y;
        const finalDx = dx + entity.movementPerturbation.x;
        const finalDy = dy + entity.movementPerturbation.y;
        const waypointDist = Math.hypot(finalDx, finalDy);

        if (waypointDist > 0.1) {
            const moveSpeed = entity.speed * dt;
            entity.x += (finalDx / waypointDist) * moveSpeed;
            entity.y += (finalDy / waypointDist) * moveSpeed;
        } else {

            entity.path.shift();
            entity.perturbationTimer = 0;
        }
    }

    private clearEntityTarget(entity: Entity) {
        entity.targetId = null;
        entity.targetType = null;
        entity.path = [];
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

    addItem(connectId: string, name: string, emoji: string) {
        if (!this.state.connects.has(connectId)) return;

        const item = new Item().assign({
            name,
            connectId,
            emoji,
            process: 0
        });
        this.state.items.set(item.id, item);
    }

    addEntity(x: number, y: number, team: string[], enemyTeam: string[] = ["player"]) {
        const entity = new Entity().assign({ x, y });
        team.forEach(t => entity.team.push(t));
        enemyTeam.forEach(t => entity.enemyTeam.push(t));
        this.state.entities.set(entity.id, entity);
    }

    private destroyCell(cellId: string) {
        const cell = this.state.map.get(cellId);
        if (!cell) return;

        const inputKeys = Array.from(cell.input.keys());
        inputKeys.forEach(key => this._breakConnectionAtSlot(cell, key, 'input'));

        const outputKeys = Array.from(cell.output.keys());
        outputKeys.forEach(key => this._breakConnectionAtSlot(cell, key, 'output'));

        this.state.map.delete(cellId);
    }

    private destroyEntity(entityId: string) {
        if (this.state.entities.has(entityId)) {
            this.state.entities.delete(entityId);
        }
    }

    private handleConnection({ sourceCellId, sourceSlotKey, targetCellId, targetSlotKey }: IConnectMessage) {
        if (sourceCellId === targetCellId) return;

        const sourceCell = this.state.map.get(sourceCellId);
        const targetCell = this.state.map.get(targetCellId);
        if (!sourceCell || !targetCell) return;

        this._breakConnectionAtSlot(sourceCell, sourceSlotKey, 'output');
        this._breakConnectionAtSlot(targetCell, targetSlotKey, 'input');

        const newConnection = new Connect().assign({
            sourceCellId,
            sourceSlotKey,
            targetCellId,
            targetSlotKey,
        });
        newConnection.calcLength(this.state);

        this.state.connects.set(newConnection.id, newConnection);

        sourceCell.output.set(sourceSlotKey, newConnection.id);
        targetCell.input.set(targetSlotKey, newConnection.id);
    }

    private handleDisconnection({ cellId, slotKey, type }: IDisconnectMessage) {
        const cell = this.state.map.get(cellId);
        if (!cell) {
            return;
        }
        this._breakConnectionAtSlot(cell, slotKey, type);
    }

    private _breakConnectionAtSlot(cell: Cell, slotKey: string, type: 'input' | 'output') {
        const connectMap = (type === 'input') ? cell.input : cell.output;
        const connectId = connectMap.get(slotKey);

        if (connectId) {
            this._breakConnection(connectId);
        }
    }

    private _breakConnection(connectId: string) {
        const connection = this.state.connects.get(connectId);
        if (!connection) return;

        const sourceCell = this.state.map.get(connection.sourceCellId);
        const targetCell = this.state.map.get(connection.targetCellId);

        if (sourceCell) {
            sourceCell.output.delete(connection.sourceSlotKey);
        }

        if (targetCell) {
            targetCell.input.delete(connection.targetSlotKey);
        }

        this.state.connects.delete(connectId);
    }
}