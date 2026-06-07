import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        this.scene.start('MenuScene');
    }
}

export class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const { width, height } = this.scale;
        this.add.text(width / 2, height / 2, '8-Ball Pool', { fontSize: '32px' }).setOrigin(0.5);
        this.add.text(width / 2, height / 2 + 50, 'Click to Start', { fontSize: '24px' }).setOrigin(0.5);
        
        this.input.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
}

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        const { width, height } = this.scale;
        
        // Basic table (rectangle)
        this.add.rectangle(width / 2, height / 2, 800, 400, 0x006400);
        
        // Basic cue ball (circle)
        this.add.circle(width / 4, height / 2, 10, 0xffffff);
    }
}

export class PoolGame {
    private game: Phaser.Game;

    constructor(container: HTMLElement) {
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: container,
            width: 1024,
            height: 576,
            physics: {
                default: 'matter',
                matter: {
                    gravity: { x: 0, y: 0 },
                    debug: false
                }
            },
            scene: [BootScene, MenuScene, GameScene],
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            }
        };

        this.game = new Phaser.Game(config);
    }

    get instance(): Phaser.Game {
        return this.game;
    }

    destroy() {
        if (this.game) {
            this.game.destroy(true);
        }
    }
}
