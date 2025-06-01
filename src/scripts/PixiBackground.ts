import * as PIXI from 'pixi.js';
import { ParticleScene } from './ParticleScene';
import { MagicScene } from './MagicScene';
import { AceScene } from './AceScene';

export class PixiBackground {
    private app: PIXI.Application;
    private background!: PIXI.Graphics;
    private sprites: PIXI.Sprite[] = [];
    private currentScene: ParticleScene | MagicScene | AceScene | null = null;
    private readonly IMAGE_PATHS = [
        'assets/UI-icons/pf.jpeg',
        'assets/UI-icons/magic.jpeg',
        'assets/UI-icons/ace.jpg'
    ];
    private readonly SCALE_FACTOR = 0.2;
    private readonly SPACING_FACTOR = 0.25;
    private initialLoadComplete = false;
    private container: PIXI.Container;

    constructor(app: PIXI.Application) {
        this.app = app;
        console.log('PIXI Version:', PIXI.VERSION);
        this.waitForValidScreenSize();
        this.container = new PIXI.Container();
        
        window.addEventListener('sceneChange', ((event: CustomEvent) => {
            if (event.detail.type === 'back') {
                this.handleBackButton();
            }
        }) as EventListener);
    }

    private waitForValidScreenSize(attempts = 0) {
        const width = this.app.screen.width;
        const height = this.app.screen.height;
    
        if (width === 0 || height === 0) {
            if (attempts > 10) {
                console.warn('Screen size is still invalid after multiple attempts');
                return;
            }
            requestAnimationFrame(() => this.waitForValidScreenSize(attempts + 1));
            return;
        }
    
        this.createBackground();
        this.loadImages();
       
    }
    
    

    private createBackground() {
        this.background = new PIXI.Graphics();
        this.background.beginFill(0x87CEEB); 
        this.background.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        this.background.endFill();
        this.app.stage.addChild(this.background);
    }

    private async loadImages() {
        try {
            // Load all images
            const textures = await Promise.all(
                this.IMAGE_PATHS.map(path => PIXI.Texture.from(path))
            );

            await Promise.all(textures.map(texture => {
                return new Promise<void>((resolve) => {
                    if (texture.baseTexture.source) {
                        resolve();
                    } else {
                        texture.baseTexture.once('update', () => resolve());
                    }
                });
            }));

            await new Promise(resolve => setTimeout(resolve, 0));

            this.sprites = textures.map((texture, index) => {
                const sprite = new PIXI.Sprite(texture);
                sprite.interactive = true;
                sprite.buttonMode = true;
                sprite.cursor = 'pointer';
                sprite.on('pointerdown', () => this.handleImageClick(index));
                this.app.stage.addChild(sprite);
                return sprite;
            });

            this.initialLoadComplete = true;
            this.resize();
        } catch (error) {
            console.error('Error loading images:', error);
        }
    }

    private get isPortrait(): boolean {
        return this.app.screen.height > this.app.screen.width;
    }

    private calculateScale(spriteWidth: number, spriteHeight: number): number {
        const screenWidth = this.app.screen.width;
        const screenHeight = this.app.screen.height;
        
        const effectiveScaleFactor = this.SCALE_FACTOR;
        
        const widthScale = (screenWidth * effectiveScaleFactor) / spriteWidth;
        const heightScale = (screenHeight * effectiveScaleFactor) / spriteHeight;
        
        return Math.min(widthScale, heightScale);
    }

    private updateLayout() {
        if (!this.initialLoadComplete || this.sprites.length === 0) return;

        console.log('Updating layout');

        const isPortrait = this.isPortrait;
        const startX = isPortrait ? this.app.screen.width * 0.05 : this.app.screen.width * 0.1;
        let currentX = startX;

        this.sprites.forEach(sprite => {
            const scale = this.calculateScale(sprite.texture.width, sprite.texture.height);
            sprite.scale.set(scale);
            
            sprite.x = currentX;
            sprite.y = (this.app.screen.height - (sprite.texture.height * scale)) / 2;
            
            const spacing = isPortrait ? 
                this.app.screen.width * (this.SPACING_FACTOR * 0.7) : 
                this.app.screen.width * this.SPACING_FACTOR;
            currentX += (sprite.texture.width * scale) + spacing;
        });
    }

    private handleImageClick(index: number) {
        if (this.currentScene) {
            this.currentScene.destroy();
            this.currentScene = null;
        }

        switch (index) {
            case 0:
                this.currentScene = new ParticleScene(this.app);
                break;
            case 1:
                this.currentScene = new MagicScene(this.app);
                break;
            case 2:
                this.currentScene = new AceScene(this.app);
                break;
        }

        this.background.visible = false;
        this.sprites.forEach(sprite => sprite.visible = false);
    }

    private handleBackButton() {
        if (this.currentScene) {
            this.currentScene.destroy();
            this.currentScene = null;
        }

        this.background.visible = true;
        this.sprites.forEach(sprite => sprite.visible = true);
    }

    resize() {
        if (this.background) {
            this.background.clear();
            this.background.beginFill(0x87CEEB);
            this.background.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
            this.background.endFill();
        }

        this.updateLayout();
    }
}