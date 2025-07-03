import * as fabric from 'fabric';
import type { StageData } from '../core/StageLoader.js';
import type { Camera, Particle, Player, TrailPoint } from '../types/GameTypes.js';
import type { IRenderSystem, Position } from './IRenderSystem.js';
import { StageRenderer } from './renderers/StageRenderer.js';

// Landing prediction interface for render system
export interface LandingPrediction {
    x: number;
    y: number;
    confidence: number; // 0-1, how certain we are about this prediction
    jumpNumber: number; // Which jump this represents (1, 2, 3...)
}

export class FabricRenderSystem implements IRenderSystem {
    protected canvas: fabric.Canvas;
    private stageRenderer: StageRenderer;
    private playerShape: fabric.Circle | null = null;
    private trailShapes: fabric.Circle[] = [];
    private landingPredictions: LandingPrediction[] = [];
    private animatedPredictions: {
        x: number;
        y: number;
        targetX: number;
        targetY: number;
        confidence: number;
        jumpNumber: number;
    }[] = [];
    private landingHistory: { x: number; y: number; timestamp: number }[] = [];
    private readonly LERP_SPEED = 0.1;
    private deathMarkPath: fabric.Path | null = null;
    private readonly HISTORY_FADE_TIME = 3000;

    constructor(canvasElement: HTMLCanvasElement) {
        this.canvas = new fabric.Canvas(canvasElement, {
            width: canvasElement.width,
            height: canvasElement.height,
            backgroundColor: 'black',
            selection: false, // ゲームモードでは選択無効
            renderOnAddRemove: false, // パフォーマンス向上
            allowTouchScrolling: false, // タッチスクロール無効
            interactive: false, // インタラクション無効（ゲームモード）
            enableRetinaScaling: false, // パフォーマンス向上
            stopContextMenu: true // 右クリックメニュー無効
        });

        // upper-canvasの背景を透明に設定
        const upperCanvas = this.canvas.upperCanvasEl;
        if (upperCanvas) {
            upperCanvas.style.backgroundColor = 'transparent';
        }

        // Initialize StageRenderer
        this.stageRenderer = new StageRenderer(this.canvas);

        // 初期描画を実行
        this.canvas.renderAll();
    }

    clearCanvas(): void {
        if (!this.canvas) {
            return; // Canvas already disposed or not initialized
        }
        this.canvas.backgroundColor = 'black';
        this.canvas.clear();
        this.canvas.renderAll();
    }

    setDrawingStyle(): void {
        // Fabric.jsでは個別オブジェクトで設定
    }

    applyCameraTransform(camera: Camera): void {
        if (!this.canvas) return;

        // Fabric.jsのviewport変換
        this.canvas.setViewportTransform([1, 0, 0, 1, -camera.x, -camera.y]);
    }

    restoreCameraTransform(): void {
        // Keep camera transform for consistency (UI elements handle their own transforms)
    }

    renderPlayer(player: Player): void {
        if (this.playerShape) {
            // 既存のプレイヤーシェイプを更新
            this.playerShape.set({
                left: player.x - player.radius,
                top: player.y - player.radius
            });
        } else {
            // 新しいプレイヤーシェイプを作成
            this.playerShape = new fabric.Circle({
                left: player.x - player.radius,
                top: player.y - player.radius,
                radius: player.radius,
                fill: 'white',
                selectable: false,
                evented: false
            });
            this.canvas.add(this.playerShape);
        }
    }

    renderTrail(trail: TrailPoint[], playerRadius: number): void {
        // オブジェクト作成を最小限に
        for (const shape of this.trailShapes) {
            this.canvas.remove(shape);
        }
        this.trailShapes = [];

        // トレイルポイント数を制限（元の設定に戻す）
        const maxTrailPoints = Math.min(trail.length, 50);

        for (let i = 0; i < maxTrailPoints; i++) {
            const point = trail[trail.length - 1 - i]; // 最新から
            const alpha = (maxTrailPoints - i) / maxTrailPoints;
            const radius = playerRadius * alpha * 0.8;

            const trailShape = new fabric.Circle({
                left: point.x - radius,
                top: point.y - radius,
                radius: radius,
                fill: `rgba(255, 255, 255, ${alpha * 0.6})`,
                selectable: false,
                evented: false
            });

            this.trailShapes.push(trailShape);
            this.canvas.add(trailShape);
        }
    }

    renderStage(stage: StageData): void {
        this.stageRenderer.renderStage(stage);
    }

    renderDeathMarks(deathMarks: Array<{ x: number; y: number }>): void {
        // 以前のパスが存在すれば、まずcanvasから削除する
        if (this.deathMarkPath) {
            this.canvas.remove(this.deathMarkPath);
            this.deathMarkPath = null;
        }

        if (deathMarks.length === 0) {
            return;
        }

        // すべての×マークのパスデータを1つの文字列に結合する
        const pathData = deathMarks
            .map((mark) => {
                const size = 8;
                const line1 = `M ${mark.x - size} ${mark.y - size} L ${mark.x + size} ${mark.y + size}`;
                const line2 = `M ${mark.x + size} ${mark.y - size} L ${mark.x - size} ${mark.y + size}`;
                return `${line1} ${line2}`;
            })
            .join(' ');

        // 1つのPathオブジェクトを生成する
        this.deathMarkPath = new fabric.Path(pathData, {
            stroke: 'rgba(255, 0, 0, 0.8)',
            strokeWidth: 3,
            selectable: false,
            evented: false,
            objectCaching: false
        });

        this.canvas.add(this.deathMarkPath);
    }

    renderLandingPredictions(): void {
        // Clean up old history first
        this.cleanupLandingHistory();

        // Render landing history (where player actually landed)
        this.renderLandingHistory();

        // Update animation positions for real-time crosshair
        for (const animPred of this.animatedPredictions) {
            // Smooth interpolation towards target position
            animPred.x += (animPred.targetX - animPred.x) * this.LERP_SPEED;
            animPred.y += (animPred.targetY - animPred.y) * this.LERP_SPEED;
        }

        // Render real-time animated predictions (main crosshair)
        for (const animPred of this.animatedPredictions) {
            this.drawCrosshair({ x: animPred.x, y: animPred.y });
        }
    }

    updateLandingPredictionAnimations(): void {
        // Update or create animated predictions
        for (let i = 0; i < this.landingPredictions.length; i++) {
            const prediction = this.landingPredictions[i];
            // Show trajectory marker closer to ground level
            const trajectoryOffsetX = -30; // Further ahead for trajectory visualization
            const trajectoryOffsetY = -20; // Show closer to ground level
            const targetX = prediction.x + trajectoryOffsetX;
            const targetY = prediction.y + trajectoryOffsetY;

            if (i < this.animatedPredictions.length) {
                // Update existing animated prediction
                this.animatedPredictions[i].targetX = targetX;
                this.animatedPredictions[i].targetY = targetY;
                this.animatedPredictions[i].confidence = prediction.confidence;
                this.animatedPredictions[i].jumpNumber = prediction.jumpNumber;
            } else {
                // Create new animated prediction (start at target for immediate appearance)
                this.animatedPredictions.push({
                    x: targetX,
                    y: targetY,
                    targetX: targetX,
                    targetY: targetY,
                    confidence: prediction.confidence,
                    jumpNumber: prediction.jumpNumber
                });
            }
        }

        // Remove excess animated predictions
        if (this.animatedPredictions.length > this.landingPredictions.length) {
            this.animatedPredictions.splice(this.landingPredictions.length);
        }
    }

    renderLandingHistory(): void {
        const currentTime = Date.now();
        const HISTORY_FADE_TIME = 3000;

        this.landingHistory = this.landingHistory.filter(
            (history) => currentTime - history.timestamp < HISTORY_FADE_TIME
        );

        for (const history of this.landingHistory) {
            const age = currentTime - history.timestamp;
            const fadeProgress = age / HISTORY_FADE_TIME;
            const alpha = Math.max(0.1, 0.6 * (1 - fadeProgress));
            const lineHeight = 8;

            // 元のデザインに合わせて白い縦線として描画
            const historyLine = new fabric.Line(
                [history.x, history.y, history.x, history.y - lineHeight],
                {
                    stroke: `rgba(255, 255, 255, ${alpha})`,
                    strokeWidth: 1,
                    selectable: false,
                    evented: false
                }
            );
            this.canvas.add(historyLine);
        }
    }

    renderDeathAnimation(particles: Particle[]): void {
        for (const particle of particles) {
            // レガシーレンダラーに合わせてサイズ計算を修正
            const radius = particle.size || 2;
            const particleShape = new fabric.Circle({
                left: particle.x - radius,
                top: particle.y - radius,
                radius: radius,
                fill: `rgba(255, 0, 0, ${particle.life})`,
                selectable: false,
                evented: false
            });
            this.canvas.add(particleShape);
        }
    }

    renderClearAnimation(
        particles: Particle[],
        progress: number,
        playerX: number,
        playerY: number
    ): void {
        // パーティクルを描画（レガシーレンダラーに合わせて固定サイズ2）
        for (const particle of particles) {
            const particleShape = new fabric.Circle({
                left: particle.x - 2,
                top: particle.y - 2,
                radius: 2,
                fill: `rgba(255, 255, 255, ${particle.life})`,
                selectable: false,
                evented: false
            });
            this.canvas.add(particleShape);
        }

        // "CLEAR!"テキストを描画
        if (progress < 0.8) {
            const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 1;
            const alpha = Math.max(0, 1 - progress / 0.8);

            const clearText = new fabric.Text('CLEAR!', {
                left: playerX,
                top: playerY - 50,
                fontSize: Math.floor(32 * pulse),
                fill: `rgba(255, 255, 255, ${alpha})`,
                fontFamily: 'monospace',
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false
            });
            this.canvas.add(clearText);
        }
    }

    renderGameOverMenu(options: string[], selectedIndex: number, finalScore: number): void {
        // Get current camera position from transform
        const transform = this.canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
        const cameraX = -transform[4];
        const cameraY = -transform[5];

        const canvasWidth = this.canvas.getWidth();
        const canvasHeight = this.canvas.getHeight();

        // Calculate screen center in world coordinates
        const screenCenterX = cameraX + canvasWidth / 2;
        const screenCenterY = cameraY + canvasHeight / 2;

        // Game Over title with shadow for visibility
        const gameOverText = new fabric.Text('GAME OVER', {
            left: screenCenterX,
            top: screenCenterY - 80,
            fontSize: 32,
            fill: 'white',
            fontFamily: 'monospace',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            shadow: new fabric.Shadow({
                color: 'rgba(0,0,0,0.8)',
                offsetX: 2,
                offsetY: 2,
                blur: 4
            })
        });
        this.canvas.add(gameOverText);

        // Score display
        if (finalScore > 0) {
            const scoreText = new fabric.Text(`Score: ${finalScore}`, {
                left: screenCenterX,
                top: screenCenterY - 40,
                fontSize: 20,
                fill: 'white',
                fontFamily: 'monospace',
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false,
                shadow: new fabric.Shadow({
                    color: 'rgba(0,0,0,0.8)',
                    offsetX: 1,
                    offsetY: 1,
                    blur: 2
                })
            });
            this.canvas.add(scoreText);
        }

        // Menu options
        const startY = screenCenterY;
        const itemHeight = 50;

        options.forEach((option, index) => {
            const y = startY + index * itemHeight;
            const isSelected = index === selectedIndex;

            // Selection indicator
            if (isSelected) {
                const selectionRect = new fabric.Rect({
                    left: screenCenterX - 150,
                    top: y - 25,
                    width: 300,
                    height: 40,
                    fill: 'white',
                    selectable: false,
                    evented: false
                });
                this.canvas.add(selectionRect);
            }

            // Option text
            const optionText = new fabric.Text(option, {
                left: screenCenterX,
                top: y,
                fontSize: 24,
                fill: isSelected ? 'black' : 'white',
                fontFamily: 'monospace',
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false,
                shadow: isSelected
                    ? null
                    : new fabric.Shadow({
                          color: 'rgba(0,0,0,0.8)',
                          offsetX: 1,
                          offsetY: 1,
                          blur: 2
                      })
            });
            this.canvas.add(optionText);
        });

        // Instructions
        const instructionText = new fabric.Text('↑↓ Navigate  ENTER/R/SPACE Select', {
            left: screenCenterX,
            top: cameraY + canvasHeight - 50,
            fontSize: 16,
            fill: '#aaa',
            fontFamily: 'monospace',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            shadow: new fabric.Shadow({
                color: 'rgba(0,0,0,0.8)',
                offsetX: 1,
                offsetY: 1,
                blur: 2
            })
        });
        this.canvas.add(instructionText);
    }

    renderStartInstruction(): void {
        // HTML要素で表示するため、Canvas描画は不要
        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (startScreen) startScreen.classList.remove('hidden');
        if (gameOverScreen) gameOverScreen.classList.add('hidden');
    }

    renderGameOver(): void {
        // HTML要素で表示するため、Canvas描画は不要
        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (startScreen) startScreen.classList.add('hidden');
        if (gameOverScreen) gameOverScreen.classList.remove('hidden');
    }

    renderCredits(): void {
        // クレジットはCanvas外に表示するため、ここでは何もしない
    }

    async cleanup(): Promise<void> {
        // Dispose fabric canvas to prevent memory leaks and reinitialization errors
        if (this.canvas) {
            try {
                const canvasElement = this.canvas.getElement();

                // Clean up stage renderer shapes
                this.stageRenderer.cleanup();

                // deathMarkPathのクリーンアップを追加
                if (this.deathMarkPath) {
                    this.canvas.remove(this.deathMarkPath);
                    this.deathMarkPath = null;
                }

                // In fabric.js v6, dispose is async and must be awaited
                await this.canvas.dispose();

                // Clear canvas element to prevent reinitialization errors
                if (canvasElement) {
                    const context = canvasElement.getContext('2d');
                    if (context) {
                        context.clearRect(0, 0, canvasElement.width, canvasElement.height);
                    }
                    // Remove fabric-specific properties
                    (
                        canvasElement as HTMLCanvasElement & {
                            __fabric?: unknown;
                            _fabric?: unknown;
                        }
                    ).__fabric = undefined;
                    (
                        canvasElement as HTMLCanvasElement & {
                            __fabric?: unknown;
                            _fabric?: unknown;
                        }
                    )._fabric = undefined;
                }
            } catch (error) {
                console.log('⚠️ Canvas cleanup error (already disposed?):', error);
            }
            this.canvas = null as unknown as fabric.Canvas;
        }
    }

    // ランディング予測システム
    setLandingPredictions(predictions: LandingPrediction[]): void {
        this.landingPredictions = predictions;
        this.updateLandingPredictionAnimations();
    }

    addLandingHistory(position: Position): void {
        this.landingHistory.push({
            x: position.x,
            y: position.y,
            timestamp: Date.now()
        });
    }

    cleanupLandingHistory(): void {
        const now = Date.now();
        this.landingHistory = this.landingHistory.filter(
            (landing) => now - landing.timestamp < this.HISTORY_FADE_TIME
        );
    }

    drawCrosshair(position: Position): void {
        const x = position.x;
        const y = position.y;
        const size = 8;
        const alpha = 0.8;
        // Vertical line
        const verticalLine = new fabric.Line([x, y - size, x, y + size], {
            stroke: `rgba(255, 255, 255, ${alpha})`,
            strokeWidth: 2,
            selectable: false,
            evented: false
        });
        this.canvas.add(verticalLine);

        // Horizontal line
        const horizontalLine = new fabric.Line([x - size, y, x + size, y], {
            stroke: `rgba(255, 255, 255, ${alpha})`,
            strokeWidth: 2,
            selectable: false,
            evented: false
        });
        this.canvas.add(horizontalLine);
    }

    // Canvas更新
    renderAll(): void {
        if (!this.canvas) return;
        this.canvas.renderAll();
    }

    // Editor methods removed - Editor functionality deprecated

    // クリーンアップ
    dispose(): void {
        this.canvas.dispose();
    }
}
