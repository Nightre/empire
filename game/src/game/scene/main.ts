import { useGameStore } from "@/stores/game";
import { Camera } from "../Camera";
import type { Game } from "../game";
import { GameObject } from "../GameObject";
import { toCoords } from "../utils";
import { Vec2 } from "../Vec2";
import GameClient from "@/client";
import type { Cell } from "../../../../server/src/rooms/schema/MyRoomState";
import { tiles } from "../datas";

export interface ILinkData {
    tileId: string,
    output: string
}

class Grid extends GameObject {
    gridSize: number;
    cell: Record<string, RemoteTile> = {}

    constructor(game: Game, gridSize: number = 64) {
        super(game);
        this.gridSize = gridSize;
        this.zIndex = -100; // 确保网格永远在最底层
    }

    addBlock(block: RemoteTile, cell: Vec2) {
        this.cell[block.id] = block
        block.gotoCell(cell, this)
        this.addChild(block)
    }

    render(ctx: CanvasRenderingContext2D): void {
        const camera = this.game.mainCamera;
        const scaler = this.game.scaler;
        if (!camera || !scaler) return;

        if (camera.zoom > 0.3) {
            const topLeft = camera.screenToWorld(new Vec2(0, 0));
            const bottomRight = camera.screenToWorld(new Vec2(scaler.viewportWidth, scaler.viewportHeight));

            const startX = Math.floor(topLeft.x / this.gridSize) * this.gridSize;
            const startY = Math.floor(topLeft.y / this.gridSize) * this.gridSize;
            const endX = Math.ceil(bottomRight.x / this.gridSize) * this.gridSize;
            const endY = Math.ceil(bottomRight.y / this.gridSize) * this.gridSize;

            ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
            ctx.lineWidth = 2;

            ctx.beginPath();

            for (let x = startX; x <= endX; x += this.gridSize) {
                const p1 = camera.worldToScreen(new Vec2(x, startY));
                const p2 = camera.worldToScreen(new Vec2(x, endY));
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
            }

            for (let y = startY; y <= endY; y += this.gridSize) {
                const p1 = camera.worldToScreen(new Vec2(startX, y));
                const p2 = camera.worldToScreen(new Vec2(endX, y));
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
            }

            ctx.stroke();
        }

        const stage = this.game.stage as MainScene;
        const state = stage.client.state;
        const gridSize = this.gridSize;

        const topLeftScreen = camera.worldToScreen(new Vec2(0, 0));
        const bottomRightScreen = camera.worldToScreen(new Vec2(state.width * gridSize, state.height * gridSize));

        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.strokeRect(
            topLeftScreen.x,
            topLeftScreen.y,
            bottomRightScreen.x - topLeftScreen.x,
            bottomRightScreen.y - topLeftScreen.y
        );
    }

    localToMap(localPos: Vec2): Vec2 {
        const gridX = Math.floor(localPos.x / this.gridSize);
        const gridY = Math.floor(localPos.y / this.gridSize);
        return new Vec2(gridX, gridY);
    }

    mapToLocal(mapPos: Vec2): Vec2 {
        const localX = mapPos.x * this.gridSize;
        const localY = mapPos.y * this.gridSize;
        return new Vec2(localX, localY);
    }

    getMouseGridPos(event: MouseEvent): Vec2 {
        const game = this.game;
        const screenPos = toCoords(event, game);
        const worldPos = game.mainCamera.screenToWorld(screenPos);
        const localPos = this.globalToLocal(worldPos);

        return this.localToMap(localPos);
    }

    // click(mouseCell: Vec2) {
    //     const block = this.cell.get(mouseCell)
    //     if (this.game.stage) {

    //     } else {
    //         if (block) {
    //             this.clickBlock(block)
    //         }
    //     }
    // }

    // clickBlock(block: Block) {

    // }

    // clickBuild() {
    //     const mainScene = this.game.stage as MainScene
    //     mainScene.build()
    // }

    getBlockByPos(vec: Vec2) {
        return Object.values(this.cell).filter(c => c.cell.equals(vec))?.[0]
    }
    getBlockById(id: string) {
        return this.cell[id]
    }
}

export interface ISelectedTile {
    prototypeId: string,
    tileId: string,
    x: number,
    y: number,

    worldx: number,
    worldy: number,
}

export class Tile extends GameObject {
    image!: HTMLCanvasElement
    cell: Vec2 = new Vec2
    id: string = ''
    prototypeId!: string

    constructor(game: Game, id: string, prototypeId?: string) {
        super(game);
        this.id = id
        if (prototypeId) {
            this.setPrototypeId(prototypeId)
        } else {
            this.image = this.asset("resource") as HTMLCanvasElement
        }
    }

    setPrototypeId(prototypeId: string) {
        this.prototypeId = prototypeId
        this.image = this.asset(tiles[prototypeId].image) as HTMLCanvasElement
    }

    render(ctx: CanvasRenderingContext2D): void {
        if (this.getCamera().zoom < 0.3) {
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, 64, 64);
        } else {
            const image = this.image
            ctx.drawImage(image, (64 - image.width) / 2, (64 - image.height) / 2)
        }
    }

    gotoCell(c: Vec2, gird: Grid) {
        this.cell = c.clone()
        this.position.copyFrom(c.clone().multiplyScalar(gird.gridSize))
        this.setDirty()
    }

    toJson(): ISelectedTile {
        const game = this.game
        const worldPos = game.mainCamera.worldToScreen(
            this.position.clone().add(new Vec2(32, 0)),
        );

        return {
            prototypeId: this.prototypeId,
            tileId: this.id,

            x: this.cell.x,
            y: this.cell.y,
            worldx: worldPos.x / this.game.scaler.dpr,
            worldy: worldPos.y / this.game.scaler.dpr,
        }
    }
}

class RemoteTile extends Tile {
    cellData: Cell
    constructor(game: Game, cell: Cell, id: string) {
        super(game, id, cell.prototypeId)
        this.cellData = cell
    }
}

class BuildCusor extends Tile {
    canBuild: boolean = true

    constructor(game: Game) {
        super(game, 'build')
    }

    setCanBuild(newCanBuild: boolean) {
        this.canBuild = newCanBuild
    }
    render(ctx: CanvasRenderingContext2D): void {
        const image = this.image
        ctx.fillStyle = this.canBuild ? "#5555553b" : "#ff35353b";
        ctx.beginPath();
        ctx.arc(32, 32, 45, 0, Math.PI * 2)
        ctx.fill();

        ctx.globalAlpha = 0.8;
        ctx.drawImage(image, (64 - image.width) / 2, (64 - image.height) / 2)
    }
}

class SelectedCusor extends Tile {
    constructor(game: Game) {
        super(game, 'select')
    }

    render(ctx: CanvasRenderingContext2D): void {
        ctx.beginPath()
        ctx.arc(32, 32, 45, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(155, 255, 144, 0.49)'
        ctx.fill()
    }
}

class Lines extends GameObject {
    gird: Grid
    constructor(game: Game, gird: Grid) {
        super(game)
        this.gird = gird
    }
    render(ctx: CanvasRenderingContext2D): void {
        const state = mainStage.client.state
        Object.values(this.gird.cell).forEach(tile => {
            tile.cellData.output.forEach((connectId, slot) => {
                const connect = state.connects.get(connectId)!
                const s = tile.getGlobalPosition()
                const t = this.gird.getBlockById(connect.targetCellId).getGlobalPosition()
                const dir = t.clone().subtract(s).normalize()

                t.add(dir.clone().multiplyScalar(-32))
                s.add(dir.clone().multiplyScalar(32))

                ctx.beginPath()
                ctx.lineWidth = 15
                ctx.strokeStyle = "#3f3f3fff"
                ctx.moveTo(s.x + 32, s.y + 32)
                ctx.lineTo(t.x + 32, t.y + 32)
                ctx.stroke()

                ctx.beginPath()
                ctx.lineWidth = 10
                ctx.strokeStyle = "#989898ff"
                ctx.moveTo(s.x + 32, s.y + 32)
                ctx.lineTo(t.x + 32, t.y + 32)
                ctx.stroke()
            })
        })

        const offset = new Vec2(32, 32)
        mainStage.items.forEach((item, id) => {
            const connect = state.connects.get(item.connectId)!
            if (connect) {
                const s = this.gird.getBlockById(connect.sourceCellId).getGlobalPosition()
                const t = this.gird.getBlockById(connect.targetCellId).getGlobalPosition()

                const dir = t.clone().subtract(s).normalize()
                item.position = s.clone().add(dir.multiplyScalar(item.process * 64)).add(offset)
                item.setDirty()                
            }
        })
    }
}

class Item extends GameObject {
    process: number = 0
    id: string
    name: string
    connectId: string

    constructor(name: string, id: string, connectId: string, game: Game) {
        super(game)
        this.id = id
        this.name = name
        this.connectId = connectId
    }
    render(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = "#000000ff"
        ctx.fillRect(-5, -5, 10, 10)
        ctx.fillStyle = "#ffffffff"
        ctx.fillRect(-4, -4, 8, 8)
    }
    onChange(process: number) {
        this.process = process
    }
}

export class MainScene extends GameObject {
    private grid!: Grid;
    private buildCusor!: BuildCusor;
    private selectCusor!: SelectedCusor
    private canvas!: HTMLCanvasElement;

    private isDragging = false;
    private lastMousePosition = new Vec2();
    private mouseCell = new Vec2(0, 0);

    client: GameClient

    selectedItem: string | null = null
    selectedTile: Tile | null = null
    selectedTargetTile: Tile | null = null

    linkData: ILinkData | null = null
    items: Map<string, Item> = new Map

    constructor(game: Game) {
        super(game);
        this.client = new GameClient()
        this.client.join().then(() => {
            this.start()
        })
    }

    setOutputLink(tileId: string, output: string) {
        this.linkData = {
            tileId,
            output
        }
        this.game.store.setSelectingLink(this.linkData)
    }
    setInputLink(tileId: string, input: string) {
        this.selectTile(null)
        this.connect(
            this.linkData!.tileId,
            this.linkData!.output,

            tileId,
            input,
        )
        this.linkData = null
        this.game.store.setSelectingLink(this.linkData)
    }

    connect(sourceCellId: string, sourceSlotKey: string, targetCellId: string, targetSlotKey: string) {
        this.client.room.send("connect", { sourceCellId, sourceSlotKey, targetCellId, targetSlotKey })
    }

    start() {
        const game = this.game
        const camera = new Camera(game);
        this.buildCusor = new BuildCusor(game);
        this.selectCusor = new SelectedCusor(game);

        this.grid = new Grid(game, 64);

        this.addChild(camera);
        this.addChild(new Lines(game, this.grid))
        this.grid.camera = camera;

        this.grid.addChild(this.buildCusor);
        this.grid.addChild(this.selectCusor);

        this.addChild(this.grid);

        this.createInitialBlocks();

        const canvas = game.scaler.canvas as HTMLCanvasElement;
        if (!canvas) {
            console.error("Canvas element not found on game instance!");
            return;
        }
        this.canvas = canvas;
        this.addEventListeners();

        this.selectItem(null)
        this.selectTile(null)
    }

    private createInitialBlocks() {
        const stage = this.client.state
        const clinet = this.client

        clinet.$(stage).map.onAdd((item, id) => {
            const block = new RemoteTile(this.game, item, id);
            this.grid.addBlock(block, new Vec2(item.x, item.y))
        })

        clinet.$(stage).map.onRemove((_, id) => {
            this.grid.getBlockById(id).destory()
        })

        clinet.$(stage).items.onAdd((item, id) => {
            const itemObj = new Item(item.name, id, item.connectId, this.game)
            this.addChild(itemObj)
            this.items.set(id, itemObj)

            clinet.$(item).listen("process", (process) => {
                this.items.get(id)?.onChange(process)
            })
        })

        clinet.$(stage).items.onRemove((item, id) => {
            this.items.get(id)?.destory()
            this.items.delete(id)
        })
    }

    private addEventListeners() {
        this.canvas.addEventListener('mousedown', this.onMouseDown);
        this.canvas.addEventListener('mousemove', this.onMouseMove);
        this.canvas.addEventListener('mouseup', this.onMouseUpOrLeave);
        this.canvas.addEventListener('mouseleave', this.onMouseUpOrLeave);
        this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
    }

    public destroy() {
        this.canvas.removeEventListener('mousedown', this.onMouseDown);
        this.canvas.removeEventListener('mousemove', this.onMouseMove);
        this.canvas.removeEventListener('mouseup', this.onMouseUpOrLeave);
        this.canvas.removeEventListener('mouseleave', this.onMouseUpOrLeave);
        this.canvas.removeEventListener('wheel', this.onWheel);
    }

    selectItem(item: string | null) {
        this.clickTile(null)
        this.selectedItem = item

        if (this.selectedItem) {
            const prototype = tiles[this.selectedItem]
            this.buildCusor.visible = true
            this.buildCusor.image = this.buildCusor.asset(prototype.image) as HTMLCanvasElement
        } else {
            this.buildCusor.visible = false
        }
        this.game.store.selectItem(this.selectedItem)
    }

    selectTile(tile: Tile | null) {
        let targetTile = this.linkData ? this.selectedTargetTile : this.selectedTile
        if (tile && targetTile != tile) {
            targetTile = tile
            this.selectCusor.gotoCell(tile.cell, this.grid)
            this.selectCusor.visible = true
        } else {
            targetTile = null
            this.selectCusor.visible = false
        }
        if (this.linkData) {
            this.selectedTargetTile = targetTile
        } else {
            this.selectedTile = targetTile
        }
        this.updateSelectedTile()
    }

    canBuild(vec: Vec2) {
        const state = this.client.state
        if (vec.x < 0 || vec.y < 0 || vec.x > state.width || vec.y > state.height) {
            return false
        }
        if (this.grid.getBlockByPos(vec)) {
            return false
        }
        return true
    }

    clickBuild() {
        this.client.room.send("build", {
            prototypeId: this.selectedItem,
            x: this.mouseCell.x,
            y: this.mouseCell.y
        })
        this.selectItem(null)
    }

    clickTile(block: Tile | null) {
        this.selectTile(block)
    }

    onGirdClick() {
        const block = this.grid.getBlockByPos(this.mouseCell)
        if (block && this.selectedItem == null) {
            this.clickTile(block)
        } else if (this.selectedItem && this.canBuild(this.mouseCell)) {
            this.clickBuild()
        }
    }

    private onMouseDown = (event: MouseEvent) => {
        if (event.button === 0) {
            this.clickTile(null)
            this.isDragging = true;
            this.lastMousePosition.copyFrom(toCoords(event, this.game));
            this.onGirdClick()
        } else if (event.button === 2) {
            this.selectItem(null)
        }
    };

    private onMouseMove = (event: MouseEvent) => {
        this.mouseCell = this.grid.getMouseGridPos(event);
        this.buildCusor.gotoCell(this.mouseCell, this.grid)
        if (this.selectedItem) {
            this.buildCusor.setCanBuild(this.canBuild(this.mouseCell))
        }
        this.updateSelectedTile()

        if (!this.isDragging) return;
        this.clickTile(null)

        const currentMousePos = toCoords(event, this.game);
        const delta = Vec2.subtract(currentMousePos, this.lastMousePosition);

        // 使用 this.game 访问 game 实例
        this.game.mainCamera.position.x -= delta.x / this.game.mainCamera.zoom;
        this.game.mainCamera.position.y -= delta.y / this.game.mainCamera.zoom;
        this.game.mainCamera.setDirty();

        this.lastMousePosition.copyFrom(currentMousePos);

    };

    private onMouseUpOrLeave = (event: MouseEvent) => {
        this.isDragging = false;
    };

    private onWheel = (event: WheelEvent) => {
        event.preventDefault();

        const zoomFactor = 1 - (event.deltaY * 0.001);
        const screenPos = toCoords(event, this.game);

        const worldPosBefore = this.game.mainCamera.screenToWorld(screenPos)

        this.game.mainCamera.zoom = Math.max(0.1, Math.min(this.game.mainCamera.zoom * zoomFactor, 10));

        const worldPosAfterScreen = this.game.mainCamera.worldToScreen(worldPosBefore)

        const dx = screenPos.x - worldPosAfterScreen.x;
        const dy = screenPos.y - worldPosAfterScreen.y;

        this.game.mainCamera.x -= dx / this.game.mainCamera.zoom;
        this.game.mainCamera.y -= dy / this.game.mainCamera.zoom;

        this.updateSelectedTile()
    };

    updateSelectedTile() {
        this.game.store.selectTile(this.selectedTile?.toJson() ?? null)
        if (this.linkData) {
            this.game.store.selectTargetTile(this.selectedTargetTile?.toJson() ?? null)
        }
    }
}

export let mainStage: MainScene
export const start = (game: Game) => {
    game.stage = new MainScene(game);
    mainStage = game.stage as MainScene
};