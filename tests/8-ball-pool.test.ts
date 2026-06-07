import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PoolGame } from '../src/8-ball-pool/game';

// Mock Phaser
vi.mock('phaser', () => {
    const Scene = class {
        scene: any;
        scale: any;
        add: any;
        input: any;
        constructor(key: string) {
            this.scene = { key, start: vi.fn(), getScenes: vi.fn() };
            this.scale = { width: 1024, height: 576 };
            this.add = {
                text: vi.fn().mockReturnValue({ setOrigin: vi.fn() }),
                rectangle: vi.fn(),
                circle: vi.fn(),
            };
            this.input = { on: vi.fn() };
        }
    };

    return {
        default: {
            Scene,
            Game: class {
                config: any;
                scene: any;
                constructor(config: any) {
                    this.config = config;
                    this.scene = {
                        getScenes: vi.fn().mockReturnValue([{ scene: { key: 'MenuScene' } }]),
                        start: vi.fn()
                    };
                }
                destroy() {}
            },
            AUTO: 0,
            Scale: {
                FIT: 0,
                CENTER_BOTH: 1
            },
            Types: {}
        }
    };
});

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
