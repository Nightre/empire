// A simple Node class for the A* algorithm
class PathNode {
    public x: number;
    public y: number;
    public g: number; // Cost from start to current node
    public h: number; // Heuristic cost from current node to end
    public f: number; // Total cost (g + h)
    public parent: PathNode | null;

    constructor(x: number, y: number, parent: PathNode | null = null) {
        this.x = x;
        this.y = y;
        this.parent = parent;
        this.g = 0;
        this.h = 0;
        this.f = 0;
    }

    equals(other: PathNode): boolean {
        return this.x === other.x && this.y === other.y;
    }
}

export class Pathfinding {
    private width: number;
    private height: number;
    private obstacles: Set<string>;

    constructor(width: number, height: number, obstacles: Set<string>) {
        this.width = width;
        this.height = height;
        this.obstacles = obstacles;
    }

    // Manhattan distance heuristic
    private heuristic(a: PathNode, b: PathNode): number {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    // The A* search algorithm
    public findPath(startX: number, startY: number, endX: number, endY: number): { x: number, y: number }[] | null {
        const startNode = new PathNode(Math.round(startX), Math.round(startY));
        const endNode = new PathNode(Math.round(endX), Math.round(endY));

        const openList: PathNode[] = [];
        const closedList: Set<string> = new Set();
        openList.push(startNode);

        while (openList.length > 0) {
            // Find the node with the lowest f cost in the open list
            let currentNode = openList[0];
            let currentIndex = 0;
            for (let i = 1; i < openList.length; i++) {
                if (openList[i].f < currentNode.f) {
                    currentNode = openList[i];
                    currentIndex = i;
                }
            }

            // Move current node from open to closed list
            openList.splice(currentIndex, 1);
            closedList.add(`${currentNode.x}_${currentNode.y}`);

            // If we reached the end, reconstruct the path
            if (currentNode.equals(endNode)) {
                const path: { x: number, y: number }[] = [];
                let current: PathNode | null = currentNode;
                while (current !== null) {
                    path.push({ x: current.x, y: current.y });
                    current = current.parent;
                }
                return path.reverse(); // Return reversed path
            }

            // Generate neighbors
            const neighbors: PathNode[] = [];
            const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]]; // 4-directional
            // const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]; // 8-directional

            for (const dir of directions) {
                const nodePosition = { x: currentNode.x + dir[0], y: currentNode.y + dir[1] };

                // Check bounds
                if (nodePosition.x < 0 || nodePosition.x >= this.width || nodePosition.y < 0 || nodePosition.y >= this.height) {
                    continue;
                }

                // Check if it's an obstacle (unless it's the end node itself)
                const nodeKey = `${nodePosition.x}_${nodePosition.y}`;
                if (this.obstacles.has(nodeKey) && !endNode.equals(new PathNode(nodePosition.x, nodePosition.y))) {
                    continue;
                }

                neighbors.push(new PathNode(nodePosition.x, nodePosition.y, currentNode));
            }

            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x}_${neighbor.y}`;
                if (closedList.has(neighborKey)) {
                    continue;
                }

                neighbor.g = currentNode.g + 1;
                neighbor.h = this.heuristic(neighbor, endNode);
                neighbor.f = neighbor.g + neighbor.h;

                // Check if neighbor is in the open list and if the new path is better
                let inOpenList = false;
                for (const openNode of openList) {
                    if (neighbor.equals(openNode) && neighbor.g >= openNode.g) {
                        inOpenList = true;
                        break;
                    }
                }

                if (!inOpenList) {
                    openList.push(neighbor);
                }
            }
        }

        return null; // No path found
    }
}