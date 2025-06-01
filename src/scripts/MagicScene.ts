import * as PIXI from 'pixi.js';
import { BaseScene } from './BaseScene';


interface DialogueEntry {
    name: string;
    text: string;
}

interface Emoji {
    name: string;
    url: string;
}

interface Avatar {
    name: string;
    url: string;
    position: 'left' | 'right';
}

export class MagicScene extends BaseScene {
    private style: PIXI.TextStyle;
    private yOffset: number = 10;
    private dialogueContainer: PIXI.Container;
    private speechBubble: PIXI.Sprite;
    private isPortrait: boolean = false;
    private readonly SPACING_FACTOR: number = 0.1;
    private sprites: PIXI.Sprite[] = [];

    constructor(app: PIXI.Application) {
        super(app);

        // Create main dialogue container
        this.dialogueContainer = new PIXI.Container();
        this.dialogueContainer.position.set(
            this.app.screen.width / 2,
            this.app.screen.height / 2
        );
        this.container.addChild(this.dialogueContainer);

        this.speechBubble = new PIXI.Sprite(PIXI.Texture.from('assets/gameplay/BigSpeechbubble.png'));
        this.speechBubble.anchor.set(0.5);
        this.speechBubble.position.set(0, 0);
        this.speechBubble.scale.set(1);
        this.dialogueContainer.addChild(this.speechBubble);

        this.style = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 18,
            fill: 0x000000,
            wordWrap: true,
            wordWrapWidth: 400
        });

        window.addEventListener('resize', this.onResize.bind(this));
        this.updateLayout();
        this.loadDialogue();
    }

    private onResize() {
        this.isPortrait = window.innerHeight > window.innerWidth;
      // this.updateLayout();
    }

    private calculateScale(width: number, height: number): number {
        const maxWidth = this.isPortrait ? this.app.screen.width * 0.9 : this.app.screen.width * 0.8;
        const maxHeight = this.isPortrait ? this.app.screen.height * 0.6 : this.app.screen.height * 0.8;
        
        const scaleX = maxWidth / width;
        const scaleY = maxHeight / height;
        
        return Math.min(scaleX, scaleY, 1); 
    }

    private updateLayout() {
        this.isPortrait = window.innerHeight > window.innerWidth;
        
        if(this.dialogueContainer) {
        this.dialogueContainer.position.set(
            this.app.screen.width / 2,
            this.isPortrait ? this.app.screen.height * 0.4 : this.app.screen.height / 2
        );
        }

        const bubbleScale = this.isPortrait ? 0.6 : 1;
        this.speechBubble.scale.set(bubbleScale);

        this.style.fontSize = this.isPortrait ? 11 : 18;

        this.style.wordWrapWidth = this.isPortrait ? 
            this.app.screen.width * 0.6 : 
            400;

        this.dialogueContainer.children.forEach(child => {
            if (child instanceof PIXI.Container) {
                this.yOffset = 10;
                
                child.children.forEach(element => {
                    if (element instanceof PIXI.Text) {
                        element.style = this.style;
                    } else if (element instanceof PIXI.Sprite) {
                        if (element.width === 64 && element.height === 64) { 
                            const avatarOffset = this.isPortrait ? 100 : 200;
                            element.x = element.x > 0 ? 
                                avatarOffset : 
                                -avatarOffset - 64;
                        }
                    }
                });

                const bubbleContainer = child.children.find(c => c instanceof PIXI.Container);
                if (bubbleContainer) {
                    const totalWidth = bubbleContainer.width;
                    const bubbleOffset = this.isPortrait ? 50 : 20;
                    
                    const avatar = child.children.find(c => c instanceof PIXI.Sprite && c.width === 64);
                    if (avatar) {
                        bubbleContainer.x = avatar.x > 0 ? 
                            -totalWidth * 0.5 - bubbleOffset : 
                            totalWidth * 0.5 + bubbleOffset;
                    }
                }
            }
        });
    }

    private renderDialogueLine(entry: DialogueEntry, avatar: Avatar, emojiMap: Map<string, string>) {
        const container = new PIXI.Container();
        container.position.set(0, this.yOffset);

        const avatarSprite = PIXI.Sprite.from(avatar.url);
        avatarSprite.width = 64;
        avatarSprite.height = 64;
        avatarSprite.y = 0;
        
        const avatarOffset = this.isPortrait ? 100 : 200;
        avatarSprite.x = avatar.position === 'right' ? 
            avatarOffset : 
            -avatarOffset - 64; 

        container.addChild(avatarSprite);

        const bubble = new PIXI.Container();
        let xCursor = 0;
        let totalWidth = 0;
        let maxHeight = 0;

        const parts = entry.text.split(/({[^}]+})/g).filter(Boolean);
        parts.forEach(part => {
            if (part.startsWith('{') && part.endsWith('}')) {
                const emojiName = part.slice(1, -1);
                const emojiUrl = emojiMap.get(emojiName);
                if (emojiUrl) {
                    const emoji = PIXI.Sprite.from(emojiUrl);
                    emoji.width = 24;
                    emoji.height = 24;
                    emoji.x = xCursor;
                    emoji.y = 0;
                    xCursor += 28;
                    totalWidth += 28;
                    maxHeight = Math.max(maxHeight, emoji.height);
                    bubble.addChild(emoji);
                }
            } else {
                const text = new PIXI.Text(part, this.style);
                text.x = xCursor;
                text.y = 0;
                xCursor += text.width;
                totalWidth += text.width;
                maxHeight = Math.max(maxHeight, text.height);
                bubble.addChild(text);
            }
        });

        bubble.children.forEach(child => {
            child.x -= totalWidth * .5;
            child.y -= maxHeight * .7;
        });

        // const bubbleOffset = this.isPortrait ? 50 : 20;
        // if (avatar.position === 'right') {
        //     bubble.x = -totalWidth * .5 - bubbleOffset;
        // } else {
        //     bubble.x = totalWidth * .5 + bubbleOffset;
        // }

        container.addChild(bubble);

        this.yOffset += 80;
        this.dialogueContainer.addChild(container);
    }

    private loadDialogue() {
        fetch('https://private-624120-softgamesassignment.apiary-mock.com/v2/magicwords')
            .then(res => res.json())
            .then(data => {
                const dialogue: DialogueEntry[] = data.dialogue;
                const emojies: Emoji[] = data.emojies;
                const avatars: Avatar[] = data.avatars;

                const emojiMap = new Map<string, string>();
                emojies.forEach(e => emojiMap.set(e.name, e.url));

                const avatarMap = new Map<string, Avatar>();
                avatars.forEach(a => avatarMap.set(a.name, a));

                const oneEntry = dialogue[1];
                const avatar = avatarMap.get(oneEntry.name);
                if (avatar) {
                    this.renderDialogueLine(oneEntry, avatar, emojiMap);
                }
            });
    }

    public destroy() {
        this.dialogueContainer.destroy({ children: true });
        super.destroy();
    }
}
