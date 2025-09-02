import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { HudScene, Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Game, Scale } from 'phaser';
import { Preloader } from './scenes/Preloader';

//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#028af8',
    pixelArt: true,
    scale: {
        mode: Scale.EXPAND,
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        MainGame,
        GameOver,
        HudScene
    ],
    physics: {
        default: 'arcade',
    },
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
}

export default StartGame;
