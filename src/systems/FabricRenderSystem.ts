import * as fabric from 'fabric';
import type { Goal, Spike, StageData } from '../core/StageLoader.js';
import type { Camera, DeathMark, Particle, Player, TrailPoint } from '../types/GameTypes.js';
import type { LandingPrediction } from './LandingPredictionSystem.js';

export class FabricRenderSystem {
    private canvas: fabric.Canvas;
    private playerShape: fabric.Circle | null = null;
    private platformShapes: fabric.Rect[] = [];
    private spikeShapes: fabric.Polygon[] = [];
    private goalShape: fabric.Rect | null = null;
    private trailShapes: fabric.Circle[] = [];
    private landingPredictions: LandingPrediction[] = [];
    private landingHistory: { x: number; y: number; timestamp: number }[] = [];
    private readonly HISTORY_FADE_TIME = 3000;

    constructor(canvasElement: HTMLCanvasElement) {
        this.canvas = new fabric.Canvas(canvasElement, {
            width: canvasElement.width,
            height: canvasElement.height,
            backgroundColor: 'black',
            selection: false, // ゲームモードでは選択無効
            renderOnAddRemove: false // パフォーマンス向上
        });
    }

    clearCanvas(): void {
        this.canvas.backgroundColor = 'black';
        // Fabric.jsでは自動的にクリアされる
    }

    setDrawingStyle(): void {
        // Fabric.jsでは個別オブジェクトで設定
    }

    applyCameraTransform(camera: Camera): void {
        // Fabric.jsのviewport変換
        this.canvas.setViewportTransform([
            1, 0, 0, 1, -camera.x, -camera.y
        ]);
    }

    restoreCameraTransform(): void {
        // Fabric.jsでは変換が保持される
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
        // 既存のトレイルを削除
        this.trailShapes.forEach(shape => this.canvas.remove(shape));
        this.trailShapes = [];

        // 新しいトレイルを追加
        trail.forEach((point, index) => {
            const alpha = (index + 1) / trail.length;
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
        });
    }

    renderStage(stage: StageData): void {
        this.renderPlatforms(stage.platforms);
        this.renderSpikes(stage.spikes);
        this.renderGoal(stage.goal);
    }

    private renderPlatforms(platforms: any[]): void {
        // 既存のプラットフォームを削除
        this.platformShapes.forEach(shape => this.canvas.remove(shape));
        this.platformShapes = [];

        platforms.forEach(platform => {
            const platformShape = new fabric.Rect({
                left: platform.x1,
                top: platform.y1,
                width: platform.x2 - platform.x1,
                height: platform.y2 - platform.y1,
                fill: 'brown',
                stroke: 'white',
                strokeWidth: 2,
                selectable: false,
                evented: false
            });
            
            this.platformShapes.push(platformShape);
            this.canvas.add(platformShape);
        });
    }

    private renderSpikes(spikes: Spike[]): void {
        // 既存のスパイクを削除
        this.spikeShapes.forEach(shape => this.canvas.remove(shape));
        this.spikeShapes = [];

        spikes.forEach(spike => {
            // 三角形のスパイクを作成
            const points = [
                { x: spike.x, y: spike.y + spike.height },
                { x: spike.x + spike.width / 2, y: spike.y },
                { x: spike.x + spike.width, y: spike.y + spike.height }
            ];
            
            const spikeShape = new fabric.Polygon(points, {
                fill: 'red',
                stroke: 'darkred',
                strokeWidth: 2,
                selectable: false,
                evented: false
            });
            
            this.spikeShapes.push(spikeShape);
            this.canvas.add(spikeShape);
        });
    }

    private renderGoal(goal: Goal): void {
        if (this.goalShape) {
            this.canvas.remove(this.goalShape);
        }

        this.goalShape = new fabric.Rect({
            left: goal.x,
            top: goal.y,
            width: goal.width,
            height: goal.height,
            fill: 'gold',
            stroke: 'orange',
            strokeWidth: 3,
            selectable: false,
            evented: false
        });
        
        this.canvas.add(this.goalShape);
    }

    renderDeathMarks(deathMarks: DeathMark[]): void {
        // 既存の実装と同様の描画
        deathMarks.forEach(mark => {
            const deathMark = new fabric.Text('💀', {
                left: mark.x - 10,
                top: mark.y - 10,
                fontSize: 20,
                selectable: false,
                evented: false
            });
            this.canvas.add(deathMark);
        });
    }

    renderLandingPredictions(): void {
        this.updateLandingPredictionAnimations();
        this.renderLandingHistory();
        
        // 予測点の描画
        this.landingPredictions.forEach(prediction => {
            const predictionShape = new fabric.Circle({
                left: prediction.x - 3,
                top: prediction.y - 3,
                radius: 3,
                fill: `rgba(0, 255, 0, ${prediction.confidence})`,
                selectable: false,
                evented: false
            });
            this.canvas.add(predictionShape);
        });
    }

    private updateLandingPredictionAnimations(): void {
        // アニメーション更新ロジック
    }

    private renderLandingHistory(): void {
        const currentTime = Date.now();
        this.landingHistory = this.landingHistory.filter(
            history => currentTime - history.timestamp < this.HISTORY_FADE_TIME
        );

        this.landingHistory.forEach(history => {
            const age = currentTime - history.timestamp;
            const alpha = 1 - (age / this.HISTORY_FADE_TIME);
            
            const historyShape = new fabric.Circle({
                left: history.x - 2,
                top: history.y - 2,
                radius: 2,
                fill: `rgba(255, 255, 0, ${alpha})`,
                selectable: false,
                evented: false
            });
            this.canvas.add(historyShape);
        });
    }

    renderDeathAnimation(particles: Particle[]): void {
        particles.forEach(particle => {
            const particleShape = new fabric.Circle({
                left: particle.x - (particle.size || 2) / 2,
                top: particle.y - (particle.size || 2) / 2,
                radius: (particle.size || 2) / 2,
                fill: `rgba(255, 0, 0, ${particle.life})`,
                selectable: false,
                evented: false
            });
            this.canvas.add(particleShape);
        });
    }

    renderClearAnimation(particles: Particle[], progress: number, playerX: number, playerY: number): void {
        particles.forEach(particle => {
            const particleShape = new fabric.Circle({
                left: particle.x - (particle.size || 2) / 2,
                top: particle.y - (particle.size || 2) / 2,
                radius: (particle.size || 2) / 2,
                fill: `rgba(255, 255, 255, ${particle.life})`,
                selectable: false,
                evented: false
            });
            this.canvas.add(particleShape);
        });

        // "CLEAR"テキストの描画
        if (progress < 0.8) {
            const clearText = new fabric.Text('CLEAR', {
                left: playerX - 50,
                top: playerY - 30,
                fontSize: 30,
                fill: 'white',
                selectable: false,
                evented: false
            });
            this.canvas.add(clearText);
        }
    }

    renderStartInstruction(): void {
        const instruction = new fabric.Text('Press SPACE to start', {
            left: this.canvas.width! / 2 - 100,
            top: this.canvas.height! / 2,
            fontSize: 24,
            fill: 'white',
            selectable: false,
            evented: false
        });
        this.canvas.add(instruction);
    }

    renderGameOver(): void {
        const gameOverText = new fabric.Text('GAME OVER', {
            left: this.canvas.width! / 2 - 80,
            top: this.canvas.height! / 2,
            fontSize: 32,
            fill: 'red',
            selectable: false,
            evented: false
        });
        this.canvas.add(gameOverText);
    }

    renderCredits(): void {
        const credits = new fabric.Text('Made with ♥ by ねつき', {
            left: 10,
            top: this.canvas.height! - 30,
            fontSize: 12,
            fill: 'gray',
            selectable: false,
            evented: false
        });
        this.canvas.add(credits);
    }

    // ランディング予測システム
    setLandingPredictions(predictions: LandingPrediction[]): void {
        this.landingPredictions = predictions;
    }

    addLandingHistory(x: number, y: number): void {
        this.landingHistory.push({
            x,
            y,
            timestamp: Date.now()
        });
    }

    // Canvas更新
    renderAll(): void {
        this.canvas.renderAll();
    }

    // エディタモード用メソッド
    enableEditorMode(): void {
        this.canvas.selection = true;
        this.canvas.forEachObject((obj: fabric.Object) => {
            obj.selectable = true;
            obj.evented = true;
        });
    }

    disableEditorMode(): void {
        this.canvas.selection = false;
        this.canvas.forEachObject((obj: fabric.Object) => {
            obj.selectable = false;
            obj.evented = false;
        });
    }

    // JSON保存・読み込み（エディタ用）
    toJSON(): string {
        return JSON.stringify(this.canvas.toJSON());
    }

    fromJSON(jsonData: string): void {
        this.canvas.loadFromJSON(jsonData, () => {
            this.canvas.renderAll();
        });
    }

    // クリーンアップ
    dispose(): void {
        this.canvas.dispose();
    }
}