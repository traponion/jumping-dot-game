import type { Application, Text, TextStyle } from 'pixi.js';
import { Text as PIXIText, TextStyle as PIXITextStyle } from 'pixi.js';
import type { StageData, TextElement } from '../core/StageLoader';

/**
 * Manages text rendering using PixiJS Text objects
 
 */
export class TextRenderingManager {
    private app: Application;
    private textObjects: Map<string, Text> = new Map();
    private defaultStyle: TextStyle;

    constructor(app: Application) {
        this.app = app;
        this.defaultStyle = new PIXITextStyle({
            fontFamily: 'monospace',
            fill: 0xffffff,
            fontSize: 16
        });
    }

    /**
     * Renders all stage text elements (start, goal, edge messages, tutorials)
     */
    renderStageTexts(stage: StageData): void {
        // Clear existing stage texts
        this.clearStageTexts();

        // Render start text
        if (stage.startText?.text) {
            const startText = this.createText('startText', stage.startText.text, {
                ...this.defaultStyle,
                fontSize: 16
            });
            startText.x = stage.startText.x;
            startText.y = stage.startText.y;
            startText.anchor.set(0.5, 0.5);
            startText.visible = true;
            this.app.stage.addChild(startText);
        }

        // Render goal text
        if (stage.goalText?.text) {
            const goalText = this.createText('goalText', stage.goalText.text, {
                ...this.defaultStyle,
                fontSize: 16
            });
            goalText.x = stage.goalText.x;
            goalText.y = stage.goalText.y;
            goalText.anchor.set(0.5, 0.5);
            goalText.visible = true;
            this.app.stage.addChild(goalText);
        }

        // Render left edge message
        if (stage.leftEdgeMessage?.text) {
            const edgeText = this.createText('leftEdgeMessage', stage.leftEdgeMessage.text, {
                ...this.defaultStyle,
                fontSize: 14
            });
            edgeText.x = stage.leftEdgeMessage.x;
            edgeText.y = stage.leftEdgeMessage.y;
            edgeText.anchor.set(0.5, 0.5);
            edgeText.visible = true;
            this.app.stage.addChild(edgeText);
        }

        // Render left edge sub message
        if (stage.leftEdgeSubMessage?.text) {
            const edgeSubText = this.createText(
                'leftEdgeSubMessage',
                stage.leftEdgeSubMessage.text,
                {
                    ...this.defaultStyle,
                    fontSize: 12
                }
            );
            edgeSubText.x = stage.leftEdgeSubMessage.x;
            edgeSubText.y = stage.leftEdgeSubMessage.y;
            edgeSubText.anchor.set(0.5, 0.5);
            edgeSubText.visible = true;
            this.app.stage.addChild(edgeSubText);
        }

        // Render tutorial messages
        if (stage.tutorialMessages && stage.tutorialMessages.length > 0) {
            stage.tutorialMessages.forEach((message: TextElement, index: number) => {
                if (message?.text) {
                    const tutorialText = this.createText(`tutorialMessage_${index}`, message.text, {
                        ...this.defaultStyle,
                        fontSize: 12
                    });
                    tutorialText.x = message.x;
                    tutorialText.y = message.y;
                    tutorialText.anchor.set(0.5, 0.5);
                    tutorialText.visible = true;
                    this.app.stage.addChild(tutorialText);
                }
            });
        }
    }

    /**
     * Renders clear animation text with pulsing effect
     */
    renderClearAnimation(
        _particles: unknown[],
        progress: number,
        playerX: number,
        playerY: number
    ): void {
        if (progress < 0.8) {
            const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 1;
            const alpha = Math.max(0, 1 - progress / 0.8);

            const clearText = this.createText('clearAnimation', 'CLEAR!', {
                fontFamily: 'monospace',
                fill: 0xffffff,
                fontSize: Math.floor(32 * pulse)
            });
            clearText.alpha = alpha;
            clearText.x = playerX;
            clearText.y = playerY - 50;
            clearText.anchor.set(0.5, 0.5);
            clearText.visible = true;
            this.app.stage.addChild(clearText);
        } else {
            this.setTextVisibility('clearAnimation', false);
        }
    }

    /**
     * Updates or creates text with specified content
     */
    updateText(textId: string, content: string): void {
        let textObj = this.textObjects.get(textId);
        if (!textObj) {
            textObj = this.createText(textId, content, this.defaultStyle);
            this.app.stage.addChild(textObj);
        } else {
            textObj.text = content;
        }
    }

    /**
     * Sets visibility of a text object
     */
    setTextVisibility(textId: string, visible: boolean): void {
        const textObj = this.textObjects.get(textId);
        if (textObj) {
            textObj.visible = visible;
        }
    }

    /**
     * Creates a new text object with specified style
     */
    private createText(id: string, content: string, style: Partial<TextStyle>): Text {
        let textObj = this.textObjects.get(id);
        if (textObj) {
            textObj.text = content;
            if (style) {
                textObj.style = new PIXITextStyle(style);
            }
            return textObj;
        }

        const textStyle = new PIXITextStyle(style);
        textObj = new PIXIText(content, textStyle);
        this.textObjects.set(id, textObj);
        return textObj;
    }

    /**
     * Clears all stage-related text objects
     */
    private clearStageTexts(): void {
        const stageTextIds = ['startText', 'goalText', 'leftEdgeMessage', 'leftEdgeSubMessage'];

        // Clear tutorial messages
        for (const [id] of this.textObjects) {
            if (id.startsWith('tutorialMessage_')) {
                stageTextIds.push(id);
            }
        }

        // Remove from stage and text objects map
        for (const id of stageTextIds) {
            const textObj = this.textObjects.get(id);
            if (textObj) {
                if (textObj.parent) {
                    this.app.stage.removeChild(textObj);
                }
                this.textObjects.delete(id);
            }
        }
    }

    /**
     * Destroys all text objects and cleans up resources
     */
    destroy(): void {
        for (const [_id, textObj] of this.textObjects) {
            if (textObj.parent) {
                this.app.stage.removeChild(textObj);
            }
            textObj.destroy();
        }
        this.textObjects.clear();
    }
}
