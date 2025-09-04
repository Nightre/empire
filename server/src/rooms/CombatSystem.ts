// systems/CombatSystem.ts

import { MyRoomState, Entity, Cell, Connect, TargetType } from "./schema/MyRoomState";

// 定义通用的攻击者和目标接口，方便未来扩展（如炮台）
export interface IAttacker {
    id: string;
    x: number;
    y: number;
    attackRange: number;
    damage: number;
    team: string[];
    enemyTeam: string[];
}

export interface ITarget {
    id: string;
    hp: number;
    maxHp: number;
    // team: string[]; // Cell and Entity have this
}

export type Targetable = Cell | Connect | Entity;

export class CombatSystem {
    // 寻找最佳目标
    public static findBestTarget(attacker: IAttacker, state: MyRoomState, targetCounts: Map<string, number>, densityWeight: number): { targetId: string, targetType: TargetType } | null {
        let bestTarget: Targetable | null = null;
        let lowestScore = Infinity;
        let targetType: TargetType | null = null;

        const calculateScore = (target: Targetable, dist: number): number => {
            const attackerCount = targetCounts.get(target.id) || 0;
            const hpPercent = Math.max(0.01, target.hp / target.maxHp);
            const densityPenalty = attackerCount * densityWeight;
            const effectiveDistance = dist + densityPenalty;
            return effectiveDistance / hpPercent; // 血越少，距离越近，攻击者越少，分数越低
        };

        const isEnemy = (targetTeams: string[]): boolean => {
            return targetTeams.some(t => attacker.enemyTeam.includes(t));
        }

        // 查找 Cell
        state.map.forEach((cell) => {
            if (isEnemy(Array.from(cell.team))) {
                const dist = Math.hypot(attacker.x - cell.x, attacker.y - cell.y);
                const score = calculateScore(cell, dist);
                if (score < lowestScore) {
                    lowestScore = score;
                    bestTarget = cell;
                    targetType = TargetType.CELL;
                }
            }
        });

        // 查找 Connect
        state.connects.forEach((connect) => {
            const sourceCell = state.map.get(connect.sourceCellId);
            if (sourceCell && isEnemy(Array.from(sourceCell.team))) {
                const targetCell = state.map.get(connect.targetCellId);
                if (targetCell) {
                    const midX = (sourceCell.x + targetCell.x) / 2;
                    const midY = (sourceCell.y + targetCell.y) / 2;
                    const dist = Math.hypot(attacker.x - midX, attacker.y - midY);
                    const score = calculateScore(connect, dist);
                    if (score < lowestScore) {
                        lowestScore = score;
                        bestTarget = connect;
                        targetType = TargetType.CONNECT;
                    }
                }
            }
        });

        // 查找 Entity
        state.entities.forEach((entity) => {
            if (entity.id !== attacker.id && isEnemy(Array.from(entity.team))) {
                 const dist = Math.hypot(attacker.x - entity.x, attacker.y - entity.y);
                const score = calculateScore(entity, dist);
                if (score < lowestScore) {
                    lowestScore = score;
                    bestTarget = entity;
                    targetType = TargetType.ENTITY;
                }
            }
        });

        if (bestTarget && targetType !== null) {
            return { targetId: bestTarget.id, targetType: targetType };
        }
        return null;
    }

    // 判断目标是否有效
    public static isTargetValid(targetId: string, targetType: TargetType, state: MyRoomState): boolean {
        if (!targetId) return false;
        switch (targetType) {
            case TargetType.CELL:
                return state.map.has(targetId);
            case TargetType.CONNECT:
                return state.connects.has(targetId);
            case TargetType.ENTITY:
                return state.entities.has(targetId);
            default:
                return false;
        }
    }

    // 判断是否在攻击范围内
    public static isTargetInRange(attacker: IAttacker, target: Targetable, targetType: TargetType, state: MyRoomState): boolean {
        switch (targetType) {
            case TargetType.CELL:
            case TargetType.ENTITY: {
                const simpleTarget = target as Cell | Entity;
                const distance = Math.hypot(attacker.x - simpleTarget.x, attacker.y - simpleTarget.y);
                return distance <= attacker.attackRange;
            }
            case TargetType.CONNECT: {
                const connect = target as Connect;
                const source = state.map.get(connect.sourceCellId);
                const targetCell = state.map.get(connect.targetCellId);
                if (!source || !targetCell) return false;

                // 计算点到线段的最短距离
                const px = attacker.x;
                const py = attacker.y;
                const x1 = source.x;
                const y1 = source.y;
                const x2 = targetCell.x;
                const y2 = targetCell.y;

                const dx = x2 - x1;
                const dy = y2 - y1;
                const lineLengthSq = dx * dx + dy * dy;

                if (lineLengthSq === 0) { // 线段是一个点
                    const dist = Math.hypot(px - x1, py - y1);
                    return dist <= attacker.attackRange;
                }
                
                // 投射点在线段上的比例 t
                let t = ((px - x1) * dx + (py - y1) * dy) / lineLengthSq;
                t = Math.max(0, Math.min(1, t)); // 将 t 限制在 [0, 1] 范围内

                // 找到线段上离攻击者最近的点
                const closestX = x1 + t * dx;
                const closestY = y1 + t * dy;

                const distanceToLine = Math.hypot(px - closestX, py - closestY);
                return distanceToLine <= attacker.attackRange;
            }
            default:
                return false;
        }
    }

    // 获取目标的寻路位置
    public static getTargetPosition(target: Targetable, targetType: TargetType, state: MyRoomState): { x: number, y: number } | null {
        switch (targetType) {
            case TargetType.CELL:
            case TargetType.ENTITY:
                const simpleTarget = target as Cell | Entity;
                return { x: simpleTarget.x, y: simpleTarget.y };
            case TargetType.CONNECT:
                const connect = target as Connect;
                const source = state.map.get(connect.sourceCellId);
                const targetCell = state.map.get(connect.targetCellId);
                if (source && targetCell) {
                    return { x: (source.x + targetCell.x) / 2, y: (source.y + targetCell.y) / 2 };
                }
                return null;
            default:
                return null;
        }
    }
}