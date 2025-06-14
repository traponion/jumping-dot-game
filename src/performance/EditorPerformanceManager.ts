// エディター専用パフォーマンスマネージャー
import * as fabric from 'fabric';
import {
    FabricObjectPool,
    PointPool,
    BoundingBoxPool,
    poolManager
} from './ObjectPool.js';
import { EDITOR_CONFIG } from '../types/EditorTypes.js';
import { DebugHelper } from '../utils/EditorUtils.js';

/**
 * エディター専用のパフォーマンス最適化マネージャー
 * - Fabric.jsオブジェクトのプール管理
 * - レンダリングパフォーマンスの最適化
 * - メモリ使用量の監視と最適化
 */
export class EditorPerformanceManager {
    // Fabric.jsオブジェクトプール
    private linePool!: FabricObjectPool<fabric.Line>;
    private polygonPool!: FabricObjectPool<fabric.Polygon>;
    private rectPool!: FabricObjectPool<fabric.Rect>;
    private textPool!: FabricObjectPool<fabric.Text>;
    
    // 基本データ構造プール
    private pointPool!: PointPool;
    private boundingBoxPool!: BoundingBoxPool;
    
    // レンダリング最適化
    private renderBatch: fabric.Object[] = [];
    private batchRenderTimer?: NodeJS.Timeout | number | undefined;
    private frameDropCount = 0;
    private targetFPS = 60;
    
    // パフォーマンス統計
    private stats = {
        objectsCreated: 0,
        objectsReused: 0,
        renderCalls: 0,
        batchedRenders: 0,
        averageRenderTime: 0,
        memoryUsage: 0
    };

    constructor(private canvas: fabric.Canvas) {
        this.initializePools();
        this.registerPools();
        this.setupPerformanceMonitoring();
        
        DebugHelper.log('EditorPerformanceManager initialized', {
            poolsRegistered: 6,
            targetFPS: this.targetFPS
        });
    }

    /**
     * オブジェクトプールを初期化
     */
    private initializePools(): void {
        // Fabric.jsオブジェクトプール
        this.linePool = new FabricObjectPool(
            () => new fabric.Line([0, 0, 0, 0], {
                stroke: EDITOR_CONFIG.COLORS.PLATFORM,
                strokeWidth: EDITOR_CONFIG.STROKE_WIDTH.PLATFORM
            }),
            10, 50, 'LinePool'
        );

        this.polygonPool = new FabricObjectPool(
            () => new fabric.Polygon([
                { x: 0, y: 15 },
                { x: 7.5, y: 0 },
                { x: 15, y: 15 }
            ], {
                fill: EDITOR_CONFIG.COLORS.SPIKE
            }),
            5, 30, 'PolygonPool'
        );

        this.rectPool = new FabricObjectPool(
            () => new fabric.Rect({
                width: 40,
                height: 50,
                fill: 'transparent',
                stroke: EDITOR_CONFIG.COLORS.GOAL,
                strokeWidth: EDITOR_CONFIG.STROKE_WIDTH.GOAL
            }),
            3, 15, 'RectPool'
        );

        this.textPool = new FabricObjectPool(
            () => new fabric.Text('', {
                fontFamily: 'monospace',
                fontSize: 16,
                fill: EDITOR_CONFIG.COLORS.TEXT
            }),
            5, 25, 'TextPool'
        );

        // 基本データ構造プール
        this.pointPool = new PointPool(50, 200);
        this.boundingBoxPool = new BoundingBoxPool(20, 100);
    }

    /**
     * プールをマネージャーに登録
     */
    private registerPools(): void {
        poolManager.registerPool('line', this.linePool);
        poolManager.registerPool('polygon', this.polygonPool);
        poolManager.registerPool('rect', this.rectPool);
        poolManager.registerPool('text', this.textPool);
        poolManager.registerPool('point', this.pointPool);
        poolManager.registerPool('boundingBox', this.boundingBoxPool);
    }

    // === 最適化されたオブジェクト作成メソッド ===

    /**
     * 最適化されたプラットフォーム作成
     */
    public createOptimizedPlatform(
        startPoint: { x: number; y: number },
        endPoint: { x: number; y: number }
    ): fabric.Line {
        const line = this.linePool.get();
        
        line.set({
            x1: startPoint.x,
            y1: startPoint.y,
            x2: endPoint.x,
            y2: endPoint.y,
            stroke: EDITOR_CONFIG.COLORS.PLATFORM,
            strokeWidth: EDITOR_CONFIG.STROKE_WIDTH.PLATFORM,
            selectable: true
        });
        
        (line as any).data = { type: 'platform' };
        this.stats.objectsReused++;
        
        DebugHelper.log('Optimized platform created', {
            reuseRate: this.getObjectReuseRate()
        });
        
        return line;
    }

    /**
     * 最適化されたスパイク作成
     */
    public createOptimizedSpike(position: { x: number; y: number }, size = 15): fabric.Polygon {
        const triangle = this.polygonPool.get();
        
        // スパイクの形状を更新
        triangle.set({
            left: position.x - size / 2,
            top: position.y - size,
            points: [
                { x: 0, y: size },
                { x: size / 2, y: 0 },
                { x: size, y: size }
            ] as fabric.Point[],
            fill: EDITOR_CONFIG.COLORS.SPIKE
        });
        
        (triangle as any).data = { type: 'spike' };
        this.stats.objectsReused++;
        
        return triangle;
    }

    /**
     * 最適化されたゴール作成
     */
    public createOptimizedGoal(
        position: { x: number; y: number },
        size = EDITOR_CONFIG.OBJECT_SIZES.GOAL
    ): fabric.Rect {
        const goal = this.rectPool.get();
        
        goal.set({
            left: position.x - size.width / 2,
            top: position.y - size.height,
            width: size.width,
            height: size.height,
            fill: 'transparent',
            stroke: EDITOR_CONFIG.COLORS.GOAL,
            strokeWidth: EDITOR_CONFIG.STROKE_WIDTH.GOAL
        });
        
        (goal as any).data = { type: 'goal' };
        this.stats.objectsReused++;
        
        return goal;
    }

    /**
     * 最適化されたテキスト作成
     */
    public createOptimizedText(
        position: { x: number; y: number },
        text = 'TEXT'
    ): fabric.Text {
        const textObj = this.textPool.get();
        
        textObj.set({
            left: position.x,
            top: position.y,
            text: text,
            fontFamily: 'monospace',
            fontSize: 16,
            fill: EDITOR_CONFIG.COLORS.TEXT
        });
        
        (textObj as any).data = { type: 'text' };
        this.stats.objectsReused++;
        
        return textObj;
    }

    /**
     * 最適化されたグリッドライン作成
     */
    public createOptimizedGridLine(
        start: { x: number; y: number },
        end: { x: number; y: number }
    ): fabric.Line {
        const line = this.linePool.get();
        
        line.set({
            x1: start.x,
            y1: start.y,
            x2: end.x,
            y2: end.y,
            stroke: EDITOR_CONFIG.COLORS.GRID,
            strokeWidth: EDITOR_CONFIG.STROKE_WIDTH.GRID,
            selectable: false,
            evented: false
        });
        
        (line as any).data = { type: 'grid' };
        this.stats.objectsReused++;
        
        return line;
    }

    // === オブジェクト解放メソッド ===

    /**
     * オブジェクトを適切なプールに返却
     */
    public releaseObject(obj: fabric.Object): void {
        const objectType = (obj as any).data?.type;
        
        try {
            // キャンバスから削除
            this.canvas.remove(obj);
            
            // 適切なプールに返却
            switch (objectType) {
                case 'platform':
                case 'grid':
                    if (obj instanceof fabric.Line) {
                        this.linePool.release(obj);
                    }
                    break;
                case 'spike':
                    if (obj instanceof fabric.Polygon) {
                        this.polygonPool.release(obj);
                    }
                    break;
                case 'goal':
                    if (obj instanceof fabric.Rect) {
                        this.rectPool.release(obj);
                    }
                    break;
                case 'text':
                    if (obj instanceof fabric.Text) {
                        this.textPool.release(obj);
                    }
                    break;
                default:
                    DebugHelper.log('Unknown object type for pooling', { objectType });
            }
            
            DebugHelper.log('Object released to pool', { objectType });
        } catch (error) {
            DebugHelper.log('Error releasing object to pool', { error, objectType });
        }
    }

    /**
     * 複数オブジェクトの一括解放
     */
    public releaseObjects(objects: fabric.Object[]): void {
        objects.forEach(obj => this.releaseObject(obj));
        DebugHelper.log('Batch object release completed', { count: objects.length });
    }

    // === レンダリング最適化 ===

    /**
     * バッチレンダリングでオブジェクト追加
     */
    public addToBatch(obj: fabric.Object): void {
        this.renderBatch.push(obj);
        
        // バッチサイズまたはタイマーで自動フラッシュ
        if (this.renderBatch.length >= 10) {
            this.flushRenderBatch();
        } else {
            this.scheduleRenderBatch();
        }
    }

    /**
     * バッチレンダリングをスケジュール
     */
    private scheduleRenderBatch(): void {
        if (this.batchRenderTimer) return;
        
        this.batchRenderTimer = setTimeout(() => {
            this.flushRenderBatch();
        }, 16); // 約60FPS
    }

    /**
     * バッチレンダリングを実行
     */
    public flushRenderBatch(): void {
        if (this.batchRenderTimer) {
            clearTimeout(this.batchRenderTimer as NodeJS.Timeout);
            this.batchRenderTimer = undefined;
        }
        
        if (this.renderBatch.length === 0) return;
        
        const startTime = performance.now();
        
        // オブジェクトを一括追加
        this.renderBatch.forEach(obj => {
            this.canvas.add(obj);
        });
        
        // 一度だけレンダリング
        this.canvas.renderAll();
        
        const renderTime = performance.now() - startTime;
        this.updateRenderStats(renderTime);
        
        DebugHelper.log('Batch render completed', {
            objectCount: this.renderBatch.length,
            renderTime: renderTime.toFixed(2) + 'ms',
            fps: this.getEstimatedFPS()
        });
        
        this.renderBatch = [];
        this.stats.batchedRenders++;
    }

    /**
     * レンダリング統計を更新
     */
    private updateRenderStats(renderTime: number): void {
        this.stats.renderCalls++;
        this.stats.averageRenderTime = 
            (this.stats.averageRenderTime * (this.stats.renderCalls - 1) + renderTime) / this.stats.renderCalls;
        
        // フレームドロップ検出
        if (renderTime > 1000 / this.targetFPS) {
            this.frameDropCount++;
        }
    }

    // === パフォーマンス監視 ===

    /**
     * パフォーマンス監視を設定
     */
    private setupPerformanceMonitoring(): void {
        // 定期的なメモリ使用量チェック
        setInterval(() => {
            this.checkMemoryUsage();
            this.optimizePoolSizes();
        }, 30000); // 30秒間隔
        
        // フレームレート監視
        this.monitorFrameRate();
    }

    /**
     * メモリ使用量をチェック
     */
    private checkMemoryUsage(): void {
        if ((performance as any).memory) {
            const memInfo = (performance as any).memory;
            this.stats.memoryUsage = memInfo.usedJSHeapSize;
            
            DebugHelper.log('Memory usage check', {
                used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024) + 'MB',
                total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024) + 'MB',
                poolStats: poolManager.getAllStats()
            });
        }
    }

    /**
     * プールサイズを動的最適化
     */
    private optimizePoolSizes(): void {
        const allStats = poolManager.getAllStats();
        
        Object.entries(allStats).forEach(([poolName, stats]: [string, any]): void => {
            const pool = poolManager.getPool(poolName);
            if (!pool) return;
            
            // 使用率に基づいてサイズ調整
            const utilizationRate = stats.inUse / (stats.poolSize + stats.inUse);
            
            if (utilizationRate > 0.8) {
                // 使用率が高い場合、プールサイズを増加
                const newSize = Math.min(stats.poolSize * 1.5, 100);
                pool.resize(Math.round(newSize));
                DebugHelper.log(`Pool ${poolName} expanded`, {
                    utilizationRate: (utilizationRate * 100).toFixed(1) + '%',
                    newSize
                });
            } else if (utilizationRate < 0.3 && stats.poolSize > 10) {
                // 使用率が低い場合、プールサイズを削減
                const newSize = Math.max(stats.poolSize * 0.8, 10);
                pool.resize(Math.round(newSize));
                DebugHelper.log(`Pool ${poolName} reduced`, {
                    utilizationRate: (utilizationRate * 100).toFixed(1) + '%',
                    newSize
                });
            }
        });
    }

    /**
     * フレームレートを監視
     */
    private monitorFrameRate(): void {
        let lastFrameTime = performance.now();
        let frameCount = 0;
        
        const checkFrame = (): void => {
            const now = performance.now();
            const deltaTime = now - lastFrameTime;
            
            if (deltaTime >= 1000) { // 1秒ごとに計算
                const fps = frameCount / (deltaTime / 1000);
                
                if (fps < this.targetFPS * 0.8) { // 80%以下の場合
                    DebugHelper.log('Performance warning', {
                        currentFPS: fps.toFixed(1),
                        targetFPS: this.targetFPS,
                        frameDrops: this.frameDropCount
                    });
                }
                
                frameCount = 0;
                lastFrameTime = now;
            }
            
            frameCount++;
            requestAnimationFrame(checkFrame);
        };
        
        requestAnimationFrame(checkFrame);
    }

    // === 統計情報 ===

    /**
     * パフォーマンス統計を取得
     */
    public getPerformanceStats(): {
        objectStats: {
            objectsCreated: number;
            objectsReused: number;
            renderCalls: number;
            batchedRenders: number;
            averageRenderTime: number;
            memoryUsage: number;
        };
        poolStats: Record<string, any>;
        renderingStats: {
            estimatedFPS: number;
            frameDrops: number;
            averageRenderTime: number;
        };
    } {
        return {
            objectStats: { ...this.stats },
            poolStats: poolManager.getAllStats(),
            renderingStats: {
                estimatedFPS: this.getEstimatedFPS(),
                frameDrops: this.frameDropCount,
                averageRenderTime: this.stats.averageRenderTime
            }
        };
    }

    /**
     * オブジェクト再利用率を取得
     */
    private getObjectReuseRate(): number {
        const total = this.stats.objectsCreated + this.stats.objectsReused;
        return total > 0 ? (this.stats.objectsReused / total) * 100 : 0;
    }

    /**
     * 推定FPSを取得
     */
    private getEstimatedFPS(): number {
        return this.stats.averageRenderTime > 0 ? 1000 / this.stats.averageRenderTime : 0;
    }

    /**
     * リソースを解放
     */
    public dispose(): void {
        // バッチレンダリングを完了
        this.flushRenderBatch();
        
        // 全プールをクリア
        poolManager.clearAllPools();
        
        DebugHelper.log('EditorPerformanceManager disposed', {
            finalStats: this.getPerformanceStats()
        });
    }
}