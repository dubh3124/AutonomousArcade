import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PoolGame } from '../src/8-ball-pool/game';

describe('8-Ball Pool Game', () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        container.id = 'game-container';
        document.body.appendChild(container);
    });

    it('should initialize Phaser game instance', async () => {
        const game = new PoolGame(container);
        expect(game.instance).toBeDefined();
        expect(game.instance.config.width).toBe(1024);
        expect(game.instance.config.height).toBe(576);
    });

    it('should start in BootScene and transition to MenuScene', async () => {
        const game = new PoolGame(container);
        // We'll need to wait for scene transitions or check the scene manager
        await new Promise(resolve => setTimeout(resolve, 100));
        const currentScene = game.instance.scene.getScenes(true)[0];
        expect(currentScene.scene.key).toBe('MenuScene');
    });
});
