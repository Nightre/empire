import { Scene, Tilemaps } from 'phaser';
import { client } from '../../main';
import { coordToIndex, indexToCoord, to2DArray } from '../utils';
import { Cell, Player } from '../../../../server/src/rooms/schema/MyRoomState';

interface IPlayer {
    container: Phaser.GameObjects.Container & {
        body: Phaser.Physics.Arcade.Body;
    };
    sprite: Phaser.GameObjects.Sprite;
}

export class Game extends Scene {
    camera!: Phaser.Cameras.Scene2D.Camera;
    playerContainer!: Phaser.GameObjects.Container & { body: Phaser.Physics.Arcade.Body };
    playerSprite!: Phaser.GameObjects.Sprite;
    cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    wasd!: {
        up: Phaser.Input.Keyboard.Key,
        down: Phaser.Input.Keyboard.Key,
        left: Phaser.Input.Keyboard.Key,
        right: Phaser.Input.Keyboard.Key
    };
    map: Tilemaps.Tilemap
    players: Map<string, IPlayer> = new Map;
    cursor: Phaser.GameObjects.Sprite
    ground: Tilemaps.TilemapLayer
    constructor() {
        super('Game');
    }

    createPlayer(isSelf: boolean, sessionId: string, player: Player): IPlayer {
        const self = client.getPlayerState(sessionId)!;

        const sprite = this.add.sprite(0, 0, 'player', 0).setOrigin(0.5);

        const nameText = this.add.text(0, -30, self.username, {
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            backgroundColor: '#00000035'
        }).setOrigin(0.5, 0);

        const container = this.add.container(
            self.x,
            self.y,
            [sprite, nameText]
        ) as Phaser.GameObjects.Container & { body: Phaser.Physics.Arcade.Body };

        this.physics.add.existing(container);
        container.body.setCollideWorldBounds(true);
        container.body.setSize(sprite.width, sprite.height);
        container.body.setCircle(10, -10, -10);

        const result = { container, sprite };

        if (!isSelf) {
            client.$(player).listen("x", (x) => { container.x = x; });
            client.$(player).listen("y", (y) => { container.y = y; });
        }
        this.players.set(sessionId, result);

        client.$(player).areas.onAdd((area) => {
            client.$(area).cells.onAdd((item, _) => {
                const coords = indexToCoord(item, this.map.width)
                this.ground.setTint(player.color, coords.x, coords.y, 1, 1)
            })
            client.$(area).cells.onRemove((item, _) => {
                const coords = indexToCoord(item, this.map.width)
                this.ground.setTint(0xffffff, coords.x, coords.y, 1, 1)
            })
        })

        return result;
    }

    create() {
        const state = client.room!.state;

        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x000000);

        const map = this.make.tilemap({
            tileWidth: 32,
            tileHeight: 32,
            width: state.width,
            height: state.height
        });
        this.map = map
        const tiles = map.addTilesetImage('tilemap')!;

        const ground = map.createBlankLayer('ground', tiles, 0, 0)!;
        this.ground = ground
        const buildings = map.createBlankLayer('buildings', tiles, 0, 0)!;

        ground.setCollision([0, 3]);
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels, true);

        // 玩家
        const playerObj = this.createPlayer(true, client.room!.sessionId, client.getPlayerState()!);
        this.playerContainer = playerObj.container;
        this.playerSprite = playerObj.sprite;
        this.physics.add.collider(this.playerContainer, ground);

        // 动画
        this.anims.create({ key: 'down', frames: this.anims.generateFrameNumbers('player', { start: 0, end: 0 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'left', frames: this.anims.generateFrameNumbers('player', { start: 1, end: 1 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'right', frames: this.anims.generateFrameNumbers('player', { start: 2, end: 2 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'up', frames: this.anims.generateFrameNumbers('player', { start: 3, end: 3 }), frameRate: 10, repeat: -1 });

        // 输入
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasd = {
            up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        };

        // 相机跟随
        this.cameras.main.startFollow(this.playerContainer, true, 0.1, 0.1);

        // 滚轮缩放
        this.input.on('wheel', (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
            const zoom = this.cameras.main.zoom - deltaY * 0.001;
            this.cameras.main.setZoom(Phaser.Math.Clamp(zoom, 0.4, 2));
        });

        // 点击放置 tile
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const worldPoint = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
            const x = map.worldToTileX(worldPoint.x)!;
            const y = map.worldToTileY(worldPoint.y)!;
            const index = coordToIndex(x, y, state.width);
            client.room?.send("place_tile", { index });
        });

        const mapData = state.map.toJSON()
        const buildingData = state.buildings.toJSON()

        ground.putTilesAt(to2DArray(mapData, state.width), 0, 0);
        buildings.putTilesAt(to2DArray(buildingData, state.width), 0, 0);

        client.$(state).map.onChange((item, index) => {
            const coords = indexToCoord(index, state.width)
            ground.putTileAt(item, coords.x, coords.y);
        });
        
        client.$(state).buildings.onChange((item, index) => {
            const coords = indexToCoord(index, state.width)
            buildings.putTileAt(item, coords.x, coords.y);
        });

        client.$(state).players.onAdd((player, key) => {
            if (key != client.room!.sessionId && !this.players.has(key)) {
                this.createPlayer(false, key, player);
            }
        });

        client.$(state).players.onRemove((_, key) => {
            const player = this.players.get(key)!;
            player.container.destroy();
        });

        // 启动 HUD
        this.scene.launch("HudScene", { gameScene: this });

        this.cursor = this.add.sprite(0, 0, "cursor").setOrigin(0, 0)
    }

    update() {
        const speed = 150;
        const dir = new Phaser.Math.Vector2(0, 0);

        if (this.cursors.left?.isDown || this.wasd.left.isDown) dir.x = -1;
        else if (this.cursors.right?.isDown || this.wasd.right.isDown) dir.x = 1;

        if (this.cursors.up?.isDown || this.wasd.up.isDown) dir.y = -1;
        else if (this.cursors.down?.isDown || this.wasd.down.isDown) dir.y = 1;

        dir.normalize().scale(speed);
        this.playerContainer.body.setVelocity(dir.x, dir.y);

        if (dir.x < 0) this.playerSprite.anims.play('left', true);
        else if (dir.x > 0) this.playerSprite.anims.play('right', true);
        else if (dir.y < 0) this.playerSprite.anims.play('up', true);
        else if (dir.y > 0) this.playerSprite.anims.play('down', true);
        else this.playerSprite.anims.stop();

        if (dir.length() > 0) {
            client.room?.send("pos", {
                x: this.playerContainer.x,
                y: this.playerContainer.y,
            });
        }

        this.playerContainer.x = Math.round(this.playerContainer.x);
        this.playerContainer.y = Math.round(this.playerContainer.y);

        const pointer = this.input.activePointer;
        const worldPoint = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;

        const map = this.map
        // 转成 tile 对齐坐标
        const tileX = map.worldToTileX(worldPoint.x)!;
        const tileY = map.worldToTileY(worldPoint.y)!;
        const x = map.tileToWorldX(tileX)!;
        const y = map.tileToWorldY(tileY)!;

        this.cursor.setPosition(x, y);
    }
}

export class HudScene extends Phaser.Scene {
    minimapRT!: Phaser.GameObjects.RenderTexture;
    playerMarkers: Map<string, Phaser.GameObjects.Graphics> = new Map();
    gameScene!: Game;

    constructor() {
        super('HudScene');
    }

    create(data: { gameScene: Game }) {
        this.gameScene = data.gameScene;

        // 构建 minimap
        const state = client.room!.state;
        const width = state.width;
        const height = state.height;

        const colors: Record<number, number> = {
            0: 0x30567d,
            1: 0x3e6c9a,
            2: 0xffffff,
            3: 0xb2aaaa,
            4: 0xb2aaaa,
            5: 0x4acf43
        };

        this.minimapRT = this.add.renderTexture(0, 0, width, height)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(1000)
            .setScale(3);

        this.positionMinimap();

        // 初始绘制
        const mapArray = state.map.toJSON() as number[];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = x + y * width;
                const tile = mapArray[index];
                this.minimapRT.fill(colors[tile] ?? 0xffffff, 1, x, y, 1, 1);
            }
        }

        // 初始玩家 marker
        state.players.forEach((_p, key) => {
            this.addPlayerMarker(key);
        });

        // 监听玩家加入
        client.$(state).players.onAdd((_player, key) => {
            this.addPlayerMarker(key);
        });

        // 监听玩家离开
        client.$(state).players.onRemove((_player, key) => {
            const marker = this.playerMarkers.get(key);
            if (marker) marker.destroy();
            this.playerMarkers.delete(key);
        });

        // tile 更新
        client.$(state).map.onChange((item, index) => {
            const x = index % width;
            const y = Math.floor(index / width);
            this.minimapRT.fill(colors[item] ?? 0xffffff, 1, x, y, 1, 1);
        });
    }

    update() {
        if (!this.gameScene) return;

        const state = client.room!.state;

        // 更新所有玩家位置
        state.players.forEach((player, key) => {
            const marker = this.playerMarkers.get(key);
            if (!marker) return;

            const px = player.x / 32;
            const py = player.y / 32;

            marker.x = this.minimapRT.x + px * this.minimapRT.scaleX;
            marker.y = this.minimapRT.y + py * this.minimapRT.scaleY;
        });
    }

    positionMinimap() {
        // 右上角缩小
        this.minimapRT.setScale(3);
        this.minimapRT.x = this.scale.width - this.minimapRT.width * this.minimapRT.scaleX - 10;
        this.minimapRT.y = 10;
    }

    private addPlayerMarker(sessionId: string) {
        const isSelf = sessionId === client.room?.sessionId;
        const color = isSelf ? 0xff0000 : 0x0000ff;

        const g = this.add.graphics().setDepth(1001);
        g.lineStyle(1, 0x000000, 1); // 黑色边框
        g.fillStyle(color, 1);       // 填充颜色
        g.fillCircle(0, 0, 3);
        g.strokeCircle(0, 0, 3);

        this.playerMarkers.set(sessionId, g);
    }
}
