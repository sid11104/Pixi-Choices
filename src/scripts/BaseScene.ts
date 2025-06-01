import * as PIXI from 'pixi.js';

export abstract class BaseScene {
    protected app: PIXI.Application;
    protected backButton!: PIXI.Sprite;
    protected container: PIXI.Container;

    constructor(app: PIXI.Application) {
        this.app = app;
        this.container = new PIXI.Container();
        this.app.stage.addChild(this.container);
        this.createBackButton();
    }

    private createBackButton() {
        const button = new PIXI.Graphics();
        button.beginFill(0xFFFFFF, 0.8);
        button.drawRoundedRect(0, 0, 60, 30, 8);
        button.endFill();

        const text = new PIXI.Text('Back', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0x000000
        });
        text.x = 20;
        text.y = 8;

        this.backButton = new PIXI.Sprite(this.app.renderer.generateTexture(button));
        this.backButton.x = 20;
        this.backButton.y = 20;
        this.backButton.interactive = true;
        this.backButton.buttonMode = true;
        this.backButton.cursor = 'pointer';
        this.backButton.addChild(text);

        this.backButton.on('pointerdown', () => {
            const event = new CustomEvent('sceneChange', { detail: { type: 'back' } });
            window.dispatchEvent(event);
        });

        this.container.addChild(this.backButton);
    }

    public destroy() {
        this.container.destroy({ children: true });
    }
} 