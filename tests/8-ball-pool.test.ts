import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PoolGame } from '../src/8-ball-pool/game';

describe('8-Ball Pool Game Infrastructure', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
        container.id = 'game-container';
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('should initialize a Phaser game instance', async () => {
        const game = new PoolGame('game-container');
        expect(game.instance).toBeDefined();
        expect(game.instance.config.width).toBe(1024);
        expect(game.instance.config.height).toBe(576);
        game.destroy();
    });

    it('should start with BootScene and transition to MenuScene', async () => {
        const game = new PoolGame('game-container');
        // Wait for scenes to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        
        expect(game.instance.scene.isActive('BootScene')).toBeFalsy();
        expect(game.instance.scene.isActive('MenuScene')).toBeTruthy();
        game.destroy();
    });

    it('should have a GameScene that can be started', async () => {
        const game = new PoolGame('game-container');
        await new Promise(resolve => setTimeout(resolve, 100));
        
        game.instance.scene.start('GameScene');
        await new Promise(resolve => setTimeout(resolve, 100));
        
        expect(game.instance.scene.isActive('GameScene')).toBeTruthy();
        game.destroy();
    });
});
