import * as PIXI from 'pixi.js';
import { PixiBackground } from './PixiBackground';

export class Game {
    private pixiApp !: PIXI.Application;
    private pixiBackground !: PixiBackground;
    private lastTime: number = 0;
    private resizeTimeout: number | null = null;
    private fpsText!: PIXI.Text;
    private frameCount: number = 0;
    private fpsLastTime: number = 0;


    constructor() {
        const pixiCanvas = document.getElementById('pixi-canvas') as HTMLCanvasElement;
        if (!pixiCanvas) {
            console.error("PIXI canvas not found!");
            return;
        }
        
        console.log("Creating PIXI Application");
        this.pixiApp = new PIXI.Application({
            view: pixiCanvas,
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x000000,
            antialias: true,
            resolution: window.devicePixelRatio || 1
        });


        this.fpsText = new PIXI.Text('FPS: 0', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xffffff,
            align: 'right',
        });
        this.fpsText.x = this.pixiApp.screen.width - 100;
        this.fpsText.y = 20;
        this.pixiApp.stage.addChild(this.fpsText);

        this.fpsLastTime = performance.now();
        
        this.pixiApp.ticker.add(() => {
            this.frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - this.fpsLastTime >= 500) { 
                const fps = Math.round((this.frameCount * 1000) / (currentTime - this.fpsLastTime));
                this.fpsText.text = `FPS: ${fps}`;
                this.frameCount = 0;
                this.fpsLastTime = currentTime;
            }
        });


        

        // Defer PixiBackground creation to next animation frame
        requestAnimationFrame(() => {
            this.pixiBackground = new PixiBackground(this.pixiApp);
            this.resize();
        });
    }

    async start() {
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));

        // Debounced resize handler
        window.addEventListener('resize', () => {
            if (this.resizeTimeout) {
                window.cancelAnimationFrame(this.resizeTimeout);
            }
            this.resizeTimeout = requestAnimationFrame(() => this.resize());
        });

        // Initial resize to ensure correct dimensions
        this.resize();
    }

    private gameLoop(currentTime: number) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Update PIXI renderer
        this.pixiApp.renderer.resize(width, height);
        
        // Update background
        if (this.pixiBackground) {
            this.pixiBackground.resize();
        }
    }
}

