import * as fabric from 'fabric';
import { RENDERING_CONSTANTS } from '../constants/GameConstants';
import type { StageData } from '../core/StageLoader.js';
import type { Camera, Particle, Player, TrailPoint } from '../types/GameTypes.js';
import type { IRenderSystem, Position } from './IRenderSystem.js';
import { AnimationRenderer } from './renderers/AnimationRenderer.js';
import { ResourceManager } from './renderers/ResourceManager.js';
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
    private resourceManager: ResourceManager;
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

        // Initialize ResourceManager
        this.resourceManager = new ResourceManager(this.canvas);

        // 初期描画を実行
        this.canvas.renderAll();
    }

    clearCanvas(): void {
        this.resourceManager.clearCanvas();
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
        const maxTrailPoints = Math.min(trail.length, RENDERING_CONSTANTS.MAX_TRAIL_POINTS);

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

    renderCredits(): void {
        this.uiRenderer.renderCredits();
    }

    async cleanup(): Promise<void> {
        // Clean up all renderer shapes first
        this.stageRenderer.cleanup();
        this.uiRenderer.cleanup();
        this.animationRenderer.cleanup();

        // Clean up local shapes
        if (this.deathMarkPath) {
            this.canvas.remove(this.deathMarkPath);
            this.deathMarkPath = null;
        }

        // Clean up player and trail shapes
        if (this.playerShape) {
            this.canvas.remove(this.playerShape);
            this.playerShape = null;
        }

        for (const shape of this.trailShapes) {
            this.canvas.remove(shape);
        }
        this.trailShapes = [];

        // Delegate canvas resource cleanup to ResourceManager
        await this.resourceManager.cleanup();
        this.canvas = null as unknown as fabric.Canvas;
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
        this.resourceManager.renderAll();
    }

    // Editor methods removed - Editor functionality deprecated

    // クリーンアップ
    dispose(): void {
        this.resourceManager.dispose();
    }
}
