import * as fabric from 'fabric';
import type { Goal, Spike, StageData } from '../core/StageLoader.js';
import type { Camera, DeathMark, Particle, Player, TrailPoint } from '../types/GameTypes.js';

// Landing prediction interface for render system
export interface LandingPrediction {
    x: number;
    y: number;
    confidence: number; // 0-1, how certain we are about this prediction
    jumpNumber: number; // Which jump this represents (1, 2, 3...)
}

export class FabricRenderSystem {
    protected canvas: fabric.Canvas;
    private playerShape: fabric.Circle | null = null;
    private platformShapes: fabric.Line[] = [];
    private spikeShapes: fabric.Polygon[] = [];
    private goalShape: fabric.Rect | null = null;
    private trailShapes: fabric.Circle[] = [];
    private landingPredictions: LandingPrediction[] = [];
    private animatedPredictions: { x: number; y: number; targetX: number; targetY: number; confidence: number; jumpNumber: number }[] = [];
    private landingHistory: { x: number; y: number; timestamp: number }[] = [];
    private readonly LERP_SPEED = 0.1;
    private readonly HISTORY_FADE_TIME = 3000;

    constructor(canvasElement: HTMLCanvasElement) {
        this.canvas = new fabric.Canvas(canvasElement, {
            width: canvasElement.width,
            height: canvasElement.height,
            backgroundColor: 'black',
            selection: false, // ゲームモードでは選択無効
            renderOnAddRemove: false, // パフォーマンス向上
            allowTouchScrolling: false, // タッチスクロール無効
            interactive: false // インタラクション無効（ゲームモード）
        });
        
        // upper-canvasの背景を透明に設定
        const upperCanvas = this.canvas.upperCanvasEl;
        if (upperCanvas) {
            upperCanvas.style.backgroundColor = 'transparent';
        }
        
        // 初期描画を実行
        this.canvas.renderAll();
    }

    clearCanvas(): void {
        this.canvas.backgroundColor = 'black';
        this.canvas.clear();
        this.canvas.renderAll();
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
        this.trailShapes.forEach(shape => this.canvas.remove(shape));
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
        this.renderPlatforms(stage.platforms);
        this.renderSpikes(stage.spikes);
        this.renderGoal(stage.goal);
        this.renderStageTexts(stage);
    }

    private renderPlatforms(platforms: any[]): void {
        // 既存のプラットフォームを削除
        this.platformShapes.forEach(shape => this.canvas.remove(shape));
        this.platformShapes = [];

        platforms.forEach(platform => {
            // レガシーレンダラーに合わせてラインとして描画
            const platformLine = new fabric.Line([
                platform.x1, platform.y1,
                platform.x2, platform.y2
            ], {
                stroke: 'white',
                strokeWidth: 2,
                selectable: false,
                evented: false
            });
            
            this.platformShapes.push(platformLine);
            this.canvas.add(platformLine);
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
                fill: 'white',
                stroke: 'white',
                strokeWidth: 1,
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

        // ゴールの枠を描画（元のデザインに合わせて白い枠）
        this.goalShape = new fabric.Rect({
            left: goal.x,
            top: goal.y,
            width: goal.width,
            height: goal.height,
            fill: 'transparent',
            stroke: 'white',
            strokeWidth: 2,
            selectable: false,
            evented: false
        });
        
        this.canvas.add(this.goalShape);
        
        // フラッグパターンを追加（×印）
        const line1 = new fabric.Line([
            goal.x, goal.y,
            goal.x + goal.width, goal.y + goal.height
        ], {
            stroke: 'white',
            strokeWidth: 2,
            selectable: false,
            evented: false
        });
        
        const line2 = new fabric.Line([
            goal.x + goal.width, goal.y,
            goal.x, goal.y + goal.height
        ], {
            stroke: 'white',
            strokeWidth: 2,
            selectable: false,
            evented: false
        });
        
        this.canvas.add(line1);
        this.canvas.add(line2);
    }

    private renderStageTexts(stage: StageData): void {
        // startTextを描画
        const startText = new fabric.Text(stage.startText.text, {
            left: stage.startText.x,
            top: stage.startText.y,
            fontSize: 16,
            fill: 'white',
            fontFamily: 'monospace',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false
        });
        this.canvas.add(startText);
        
        // goalTextを描画
        const goalText = new fabric.Text(stage.goalText.text, {
            left: stage.goalText.x,
            top: stage.goalText.y,
            fontSize: 16,
            fill: 'white',
            fontFamily: 'monospace',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false
        });
        this.canvas.add(goalText);
        
        // leftEdgeMessageを描画（逆走の皮肉文章）
        if (stage.leftEdgeMessage) {
            const edgeMessage = new fabric.Text(stage.leftEdgeMessage.text, {
                left: stage.leftEdgeMessage.x,
                top: stage.leftEdgeMessage.y,
                fontSize: 14,
                fill: 'white',
                fontFamily: 'monospace',
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false
            });
            this.canvas.add(edgeMessage);
        }
        
        // leftEdgeSubMessageを描画
        if (stage.leftEdgeSubMessage) {
            const edgeSubMessage = new fabric.Text(stage.leftEdgeSubMessage.text, {
                left: stage.leftEdgeSubMessage.x,
                top: stage.leftEdgeSubMessage.y,
                fontSize: 12,
                fill: 'white',
                fontFamily: 'monospace',
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false
            });
            this.canvas.add(edgeSubMessage);
        }
    }

    renderDeathMarks(deathMarks: DeathMark[]): void {
        deathMarks.forEach(mark => {
            const size = 8;
            
            // ×マークを作成（ライン）
            const line1 = new fabric.Line([
                mark.x - size, mark.y - size,
                mark.x + size, mark.y + size
            ], {
                stroke: 'rgba(255, 0, 0, 0.8)',
                strokeWidth: 3,
                selectable: false,
                evented: false
            });
            
            const line2 = new fabric.Line([
                mark.x + size, mark.y - size,
                mark.x - size, mark.y + size
            ], {
                stroke: 'rgba(255, 0, 0, 0.8)',
                strokeWidth: 3,
                selectable: false,
                evented: false
            });
            
            this.canvas.add(line1);
            this.canvas.add(line2);
        });
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
        for (let i = 0; i < this.animatedPredictions.length; i++) {
            const animPred = this.animatedPredictions[i];
            
            // More visible white that fades with distance and confidence
            const baseAlpha = animPred.confidence * 0.8;
            const alpha = Math.max(0.4, baseAlpha - (i * 0.2)); // Fade with distance
            
            this.drawCrosshair(animPred.x, animPred.y, 8, alpha);
        }
    }

    private updateLandingPredictionAnimations(): void {
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

    private renderLandingHistory(): void {
        const currentTime = Date.now();
        const HISTORY_FADE_TIME = 3000;
        
        this.landingHistory = this.landingHistory.filter(
            history => currentTime - history.timestamp < HISTORY_FADE_TIME
        );

        this.landingHistory.forEach(history => {
            const age = currentTime - history.timestamp;
            const fadeProgress = age / HISTORY_FADE_TIME;
            const alpha = Math.max(0.1, 0.6 * (1 - fadeProgress));
            const lineHeight = 8;
            
            // 元のデザインに合わせて白い縦線として描画
            const historyLine = new fabric.Line([
                history.x, history.y,
                history.x, history.y - lineHeight
            ], {
                stroke: `rgba(255, 255, 255, ${alpha})`,
                strokeWidth: 1,
                selectable: false,
                evented: false
            });
            this.canvas.add(historyLine);
        });
    }

    renderDeathAnimation(particles: Particle[]): void {
        particles.forEach(particle => {
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
        });
    }

    renderClearAnimation(particles: Particle[], progress: number, playerX: number, playerY: number): void {
        // パーティクルを描画（レガシーレンダラーに合わせて固定サイズ2）
        particles.forEach(particle => {
            const particleShape = new fabric.Circle({
                left: particle.x - 2,
                top: particle.y - 2,
                radius: 2,
                fill: `rgba(255, 255, 255, ${particle.life})`,
                selectable: false,
                evented: false
            });
            this.canvas.add(particleShape);
        });
        
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
        const transform = this.canvas.viewportTransform!;
        const cameraX = -transform[4];
        const cameraY = -transform[5];
        
        const canvasWidth = this.canvas.getWidth();
        const canvasHeight = this.canvas.getHeight();
        
        // Calculate screen center in world coordinates
        const screenCenterX = cameraX + canvasWidth / 2;
        const screenCenterY = cameraY + canvasHeight / 2;

        // Semi-transparent overlay covering visible screen area
        const overlay = new fabric.Rect({
            left: cameraX,
            top: cameraY,
            width: canvasWidth,
            height: canvasHeight,
            fill: 'rgba(0, 0, 0, 0.8)',
            selectable: false,
            evented: false
        });
        this.canvas.add(overlay);

        // Game Over title
        const gameOverText = new fabric.Text('GAME OVER', {
            left: screenCenterX,
            top: screenCenterY - 80,
            fontSize: 32,
            fill: 'white',
            fontFamily: 'monospace',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false
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
                evented: false
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
                evented: false
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
            evented: false
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
            const canvasElement = this.canvas.getElement();
            
            // In fabric.js v6, dispose is async and must be awaited
            await this.canvas.dispose();
            
            // Clear canvas element to prevent reinitialization errors
            if (canvasElement) {
                const context = canvasElement.getContext('2d');
                if (context) {
                    context.clearRect(0, 0, canvasElement.width, canvasElement.height);
                }
                // Remove fabric-specific properties
                delete (canvasElement as any).__fabric;
                delete (canvasElement as any)._fabric;
            }
        }
    }

    // ランディング予測システム
    setLandingPredictions(predictions: LandingPrediction[]): void {
        this.landingPredictions = predictions;
        this.updateLandingPredictionAnimations();
    }

    addLandingHistory(x: number, y: number): void {
        this.landingHistory.push({
            x,
            y,
            timestamp: Date.now()
        });
    }

    private cleanupLandingHistory(): void {
        const now = Date.now();
        this.landingHistory = this.landingHistory.filter(
            landing => now - landing.timestamp < this.HISTORY_FADE_TIME
        );
    }

    private drawCrosshair(x: number, y: number, size: number, alpha: number): void {
        // Vertical line
        const verticalLine = new fabric.Line([
            x, y - size,
            x, y + size
        ], {
            stroke: `rgba(255, 255, 255, ${alpha})`,
            strokeWidth: 2,
            selectable: false,
            evented: false
        });
        this.canvas.add(verticalLine);
        
        // Horizontal line
        const horizontalLine = new fabric.Line([
            x - size, y,
            x + size, y
        ], {
            stroke: `rgba(255, 255, 255, ${alpha})`,
            strokeWidth: 2,
            selectable: false,
            evented: false
        });
        this.canvas.add(horizontalLine);
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