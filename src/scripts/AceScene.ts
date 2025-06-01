import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { BaseScene } from './BaseScene';

export class AceScene extends BaseScene {
    private cards: PIXI.Sprite[] = [];
    private background!: PIXI.Graphics;

    private stacks: PIXI.Sprite[][] = [[], [], []];
    private cardWidth = 100;
    private cardHeight = 150;
    private cardOffset = 20;
    private animationInProgress = false;
    private transferInterval: NodeJS.Timeout | null = null;

    constructor(app: PIXI.Application) {
        super(app);
        (this.container as any).sortableChildren = true;
        // this.createBackground();
        this.createCards();
        this.setupStacks();

        setTimeout(() => {
            this.startCardTransferLoop();

        }, 1000);
    }

    private createBackground() {
        // this.background = new PIXI.Graphics();
        // this.background.beginFill(0x87CEEB); 
        // this.background.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        // this.background.endFill();
        // this.app.stage.addChild(this.background);
    }

    private createCards() {
        for (let i = 144; i >= 0; i--) {
            const card = new PIXI.Sprite(PIXI.Texture.from('assets/gameplay/ad.png'));
            card.width = this.cardWidth;
            card.height = this.cardHeight;
            card.scale.set(0.2);

            card.interactive = true;
            card.buttonMode = true;
            card.on('pointerdown', () => this.handleCardClick(card));
            
            this.cards.push(card);
        }
    }

    private setupStacks() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const card = this.cards[i];
            this.stacks[0].push(card);
            card.scale.set(0.1);
            this.positionCardInStack(card, 0, i);
            this.app.stage.addChild(card);
        }
    }

    private positionCardInStack(card: PIXI.Sprite, stackIndex: number, positionInStack: number) {
        const stackX = this.app.screen.width * (0.25 + stackIndex * 0.25);
        const baseY = this.app.screen.height * 0.9 - this.cardHeight / 2;
        
        card.x = stackX;
        card.y = baseY - (positionInStack * this.cardOffset);
        card.scale.set(0.1);

        (card.parent as any)?.sortChildren();
    }

    private handleCardClick(card: PIXI.Sprite) {
        console.log('Card clicked:', this.cards.indexOf(card) + 1);
    }

    private startCardTransferLoop() {
        let targetStackIndex = 1;

        this.transferInterval = setInterval(() => {
            if (this.animationInProgress) return;
            
            const sourceStackIndex = 0;
            const sourceStack = this.stacks[sourceStackIndex];

            if (sourceStack.length === 0) return;

            const card = sourceStack.pop();
            if (!card) return;
        
        this.animationInProgress = true;
            this.stacks[targetStackIndex].push(card);
            const positionInTarget = this.stacks[targetStackIndex].length - 1;

            this.animateCardToStackWithGSAP(card, targetStackIndex, positionInTarget).then(() => {
                this.animationInProgress = false;
            });
        }, 100);
    }

    private animateCardToStackWithGSAP(card: PIXI.Sprite, stackIndex: number, positionInStack: number): Promise<void> {
        return new Promise((resolve) => {
            const targetX = this.app.screen.width * 0.7;
            const baseY = this.app.screen.height * 0.05;
            const extraOffset = Math.max(0, (positionInStack - 11) * this.cardOffset); 
            const targetY = baseY + (positionInStack * this.cardOffset) - extraOffset;

            gsap.to(card, {
                duration: 2,
                x: targetX,
                y: targetY,
                ease: 'power2.inOut',
                onUpdate: () => {
                    if (this.stacks[0].length > 0) {
                        const baseY = this.app.screen.height * 0.9 - this.cardHeight / 2;
                        
                        [...this.stacks[0]].reverse().forEach((stackCard, index) => {
                            const newY = baseY - (index * this.cardOffset);
                            gsap.to(stackCard, {
                                duration: 0.5,
                                y: newY,
                                ease: 'power2.out'
                            });
                        });
                    }
                },
                onComplete: () => {
                    card.x = targetX;
                    card.y = targetY;
                    this.container.addChild(card);

                    if (this.stacks[stackIndex].length >= 12) {
                        const offset = this.cardOffset;
                        
                        this.stacks[stackIndex].forEach((stackCard) => {
                            gsap.to(stackCard, {
                                duration: 0.5,
                                y: stackCard.y - offset,
                                ease: 'power2.out'
                            });
                        });
                    }
                    resolve();
                }
            });
        });
    }

    resize() {
        for (let stackIndex = 0; stackIndex < this.stacks.length; stackIndex++) {
            this.stacks[stackIndex].forEach((card, positionInStack) => {
                this.positionCardInStack(card, stackIndex, positionInStack);
            });
        }
    }

    public destroy() {
        if (this.transferInterval) {
            clearInterval(this.transferInterval);
            this.transferInterval = null;
        }

        gsap.killTweensOf(this.cards);

        this.cards.forEach(card => {
            if (card.parent) {
                card.parent.removeChild(card);
            }
            card.destroy({ children: true });
        });
        this.cards = [];

        this.stacks = [[], [], []];

        super.destroy();
    }
} 
