import * as fabric from 'fabric';
import type { StageData } from '../core/StageLoader.js';
import type { Camera, Particle, Player, TrailPoint } from '../types/GameTypes.js';
import type { IRenderSystem, Position } from './IRenderSystem.js';
import { AnimationRenderer } from './renderers/AnimationRenderer.js';
import { StageRenderer } from './renderers/StageRenderer.js';
import { UIRenderer } from './renderers/UIRenderer.js';

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
    private uiRenderer: UIRenderer;
    private animationRenderer: AnimationRenderer;
    private playerShape: fabric.Circle | null = null;
    private trailShapes: fabric.Circle[] = [];
    private deathMarkPath: fabric.Path | null = null;

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

        // Initialize UIRenderer
        this.uiRenderer = new UIRenderer(this.canvas);

        // Initialize AnimationRenderer
        this.animationRenderer = new AnimationRenderer(this.canvas);

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
        this.animationRenderer.renderLandingPredictions();
    }

    updateLandingPredictionAnimations(): void {
        this.animationRenderer.updateLandingPredictionAnimations();
    }

    renderDeathAnimation(particles: Particle[]): void {
        this.animationRenderer.renderDeathAnimation(particles);
    }

    renderClearAnimation(
        particles: Particle[],
        progress: number,
        playerX: number,
        playerY: number
    ): void {
        this.animationRenderer.renderClearAnimation(particles, progress, playerX, playerY);
    }

    renderGameOverMenu(options: string[], selectedIndex: number, finalScore: number): void {
        this.uiRenderer.renderGameOverMenu(options, selectedIndex, finalScore);
    }

    renderStartInstruction(): void {
        this.uiRenderer.renderStartInstruction();
    }

    renderGameOver(): void {
        this.uiRenderer.renderGameOver();
    }

    renderCredits(): void {
        this.uiRenderer.renderCredits();
    }

    async cleanup(): Promise<void> {
        // Dispose fabric canvas to prevent memory leaks and reinitialization errors
        if (this.canvas) {
            try {
                const canvasElement = this.canvas.getElement();

                // Clean up stage renderer shapes
                this.stageRenderer.cleanup();

                // Clean up UI renderer shapes
                this.uiRenderer.cleanup();

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
        this.animationRenderer.setLandingPredictions(predictions);
    }

    addLandingHistory(position: Position): void {
        this.animationRenderer.addLandingHistory(position);
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
