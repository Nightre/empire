import { Scene } from 'phaser';

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

    constructor() {
        super('Game');
    }

    createPlayer(x: number, y: number, name: string) {
        const sprite = this.add.sprite(0, 0, 'player', 0).setOrigin(0);

        const nameText = this.add.text(16, -20, name, {
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            backgroundColor: '#00000035'
        }).setOrigin(0.5, 0)

        const container = this.add.container(x, y, [sprite, nameText]) as Phaser.GameObjects.Container & { body: Phaser.Physics.Arcade.Body };

        this.physics.add.existing(container);
        container.body.setCollideWorldBounds(true);
        container.body.setSize(sprite.width, sprite.height);
        container.body.setCircle(12, 4, 4);

        return { container, sprite, nameText };
    }

    create() {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x000000);

        const map = this.make.tilemap({
            tileWidth: 32,
            tileHeight: 32,
            width: 300,
            height: 300
        });
        const tiles = map.addTilesetImage('tilemap')!;

        const ground = map.createBlankLayer('ground', tiles, 0, 0)!;
        ground.randomize(0, 0, map.width, map.height, [0, 1, 2, 3]);

        const buildings = map.createBlankLayer('buildings', tiles, 0, 0)!;
        buildings.randomize(0, 0, map.width, map.height, [-1, -1, -1, -1, -1, 4]);

        ground.setCollision(1);
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // ✅ 创建玩家
        const playerObj = this.createPlayer(100, 100, "Player 137");
        this.playerContainer = playerObj.container;
        this.playerSprite = playerObj.sprite;

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

        // 相机跟随 container
        this.cameras.main.startFollow(this.playerContainer);

        // 鼠标滚轮缩放
        this.input.on('wheel', (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
            const zoom = this.cameras.main.zoom - deltaY * 0.001;
            this.cameras.main.setZoom(Phaser.Math.Clamp(zoom, 0.1, 2));
        });

        // 点击地图
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const worldPoint = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
            const tileX = map.worldToTileX(worldPoint.x);
            const tileY = map.worldToTileY(worldPoint.y);
            console.log(`Clicked tile: (${tileX}, ${tileY})`);
        });
    }

    update() {
        const speed = 150;
        const dir = new Phaser.Math.Vector2(0, 0);

        if (this.cursors.left?.isDown || this.wasd.left.isDown) dir.x = -1;
        else if (this.cursors.right?.isDown || this.wasd.right.isDown) dir.x = 1;

        if (this.cursors.up?.isDown || this.wasd.up.isDown) dir.y = -1;
        else if (this.cursors.down?.isDown || this.wasd.down.isDown) dir.y = 1;

        dir.normalize().scale(speed);

        // ✅ 移动 container，而不是 sprite
        this.playerContainer.body.setVelocity(dir.x, dir.y);

        // ✅ 播放动画（只操作 sprite）
        if (dir.x < 0) this.playerSprite.anims.play('left', true);
        else if (dir.x > 0) this.playerSprite.anims.play('right', true);
        else if (dir.y < 0) this.playerSprite.anims.play('up', true);
        else if (dir.y > 0) this.playerSprite.anims.play('down', true);
        else this.playerSprite.anims.stop();
    }
}
