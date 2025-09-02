import GameClient from './client';
import StartGame from './game/main';
import "./assets/main.scss"
import { Scene } from 'phaser';

export const client = new GameClient()
document.addEventListener('DOMContentLoaded', async () => {
    StartGame('game-container');
});

