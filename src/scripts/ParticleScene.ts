import * as PIXI from 'pixi.js';
import { BaseScene } from './BaseScene';

interface FireParticle extends PIXI.Sprite {
    velocity: { x: number; y: number };
    scaleSpeed: number;
    alphaSpeed: number;
}

export class ParticleScene extends BaseScene {
    private particles: FireParticle[] = [];
    private activeParticles: FireParticle[] = [];
    private readonly MAX_PARTICLES = 10;
    private fireContainer: PIXI.Container;
    private fireTexture: PIXI.Texture;
    private emitterPosition: { x: number; y: number } = { x: 0, y: 0 };
    private isPortrait: boolean = false;

    constructor(app: PIXI.Application) {
        super(app);

        this.fireContainer = new PIXI.Container();
        this.container.addChild(this.fireContainer);

        this.fireTexture = this.createFireTexture();

        this.updateEmitterPosition();

        this.initializeParticles();

        this.app.ticker.add(this.update.bind(this));

        window.addEventListener('resize', this.onResize.bind(this));
    }

    private onResize() {
        this.isPortrait = window.innerHeight > window.innerWidth;
       // this.updateLayout();
    }

    private updateEmitterPosition() {
        this.emitterPosition = { 
            x: this.app.screen.width * 0.5, 
            y: this.app.screen.height * (this.isPortrait ? 0.7 : 0.5)
        };
    }

    private updateLayout() {
        this.emitterPosition = { 
            x: this.app.screen.width * 0.5, 
            y: this.app.screen.height * (this.isPortrait ? 0.7 : 0.5)
        };

        this.fireContainer.position.set(
            this.app.screen.width * 0.5,
            this.app.screen.height * (this.isPortrait ? 0.7 : 0.5)
        );

        this.activeParticles.forEach(particle => {
            particle.visible = false;
        });
        this.activeParticles = [];
        
        for (let i = 0; i < this.MAX_PARTICLES; i++) {
            this.spawnParticle();
        }
    }
    
    private initializeParticles(): void {
        for (let i = 0; i < this.MAX_PARTICLES; i++) {
            const particle = new PIXI.Sprite(this.fireTexture) as FireParticle;
            particle.anchor.set(0.5);
            particle.visible = false;
            particle.velocity = { x: 0, y: 0 };
            particle.scaleSpeed = 0;
            particle.alphaSpeed = 0;
            
            this.fireContainer.addChild(particle);
            this.particles.push(particle);
        }
    }

    private createFireTexture(): PIXI.Texture {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 200, 0, 0.8)');
        gradient.addColorStop(0.4, 'rgba(255, 100, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(64, 64, 128, 0, Math.PI * 2);
        ctx.fill();
        
        return PIXI.Texture.from(canvas);
    }

    private spawnParticle(): void {
        if (this.activeParticles.length >= this.MAX_PARTICLES) return;

        const particle = this.particles.find(p => !this.activeParticles.includes(p));
        if (!particle) return;

        particle.x = this.emitterPosition.x + (Math.random() - 0.5) * 50;
        particle.y = this.emitterPosition.y;
        particle.scale.set(Math.random() * 0.5 + 0.5);
        particle.alpha = Math.random() * 0.5 + 0.5;
        particle.tint = this.getRandomFireColor();
        particle.rotation = Math.random() * Math.PI * 2;
        
        particle.velocity = {
            x: (Math.random() - 0.5) * 2,
            y: -3 - Math.random() * 2
        };
        
        particle.scaleSpeed = 0.01;
        particle.alphaSpeed = 0.03;
        
        particle.visible = true;
        this.activeParticles.push(particle);
    }

    private getRandomFireColor(): number {
        const r = 255;
        const g = Math.floor(Math.random() * 100 + 100);
        const b = Math.floor(Math.random() * 50);
        return (r << 16) + (g << 8) + b;
    }

    private update(delta: number): void {
        if (Math.random() > 0.2) {
            this.spawnParticle();
        }

        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const particle = this.activeParticles[i];
            
            particle.x += particle.velocity.x * delta;
            particle.y += particle.velocity.y * delta;
            
            particle.scale.x = Math.max(0.1, particle.scale.x - particle.scaleSpeed * delta);
            particle.scale.y = particle.scale.x;
            particle.alpha -= particle.alphaSpeed * delta;
            
            if (Math.random() > 0.8) {
                particle.alpha += (Math.random() - 0.5) * 0.1;
                particle.alpha = Math.min(1, Math.max(0.1, particle.alpha));
            }
            
            if (particle.alpha <= 0.05 || particle.scale.x <= 0.1) {
                particle.visible = false;
                this.activeParticles.splice(i, 1);
            }
        }
    }

    public destroy() {
        this.app.ticker.remove(this.update.bind(this));
        this.fireContainer.destroy({ children: true });
        this.particles = [];
        this.activeParticles = [];
        super.destroy();
    }
}
