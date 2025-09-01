import GameClient from './client';
import StartGame from './game/main';

document.addEventListener('DOMContentLoaded', async () => {
    const client = new GameClient()
    await client.join()
    StartGame('game-container');
});