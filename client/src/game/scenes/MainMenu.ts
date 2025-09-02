import { Scene, GameObjects } from 'phaser';
import { client } from '../../main';

export class MainMenu extends Scene {
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;

    constructor() {
        super('MainMenu');
    }

    async create() {
        this.background = this.add.image(512, 384, 'background');

        this.logo = this.add.image(512, 300, 'logo');

        this.title = this.add.text(512, 460, '连接服务器中...', {
            fontFamily: 'Arial Black', fontSize: 18, color: '#00000',
            align: 'center'
        }).setOrigin(0.5);

        try {
            await client.join()
            this.scene.start('Game');
        } catch (error) {
            console.log("失败")
            this.title.text = "连接失败"
        }
    }
}
