// オブジェクトプールによるパフォーマンス最適化
import * as fabric from 'fabric';
import { DebugHelper } from '../utils/EditorUtils.js';

/**
 * 汎用オブジェクトプール
 * - メモリアロケーションの削減
 * - ガベージコレクションの負荷軽減  
 * - オブジェクト作成/破棄のオーバーヘッド削減
 */
export class ObjectPool<T> {
    private pool: T[] = [];
    private inUse = new Set<T>();
    private createdCount = 0;
    private reuseCount = 0;
    
    constructor(
        private factory: () => T,
        private reset?: (obj: T) => void,
        private destroy?: (obj: T) => void,
        initialSize = 10,
        private maxSize = 100,
        protected name = 'ObjectPool'
    ) {
        this.preallocate(initialSize);
        DebugHelper.log(`${this.name} initialized`, {
            initialSize,
            maxSize
        });
    }

    /**
     * オブジェクトを取得
     */
    public get(): T {
        let obj: T;
        
        if (this.pool.length > 0) {
            obj = this.pool.pop()!;
            this.reuseCount++;
            DebugHelper.log(`${this.name}: Object reused`, {
                poolSize: this.pool.length,
                inUse: this.inUse.size,
                reuseRate: this.getReuseRate()
            });
        } else {
            obj = this.factory();
            this.createdCount++;
            DebugHelper.log(`${this.name}: New object created`, {
                createdCount: this.createdCount,
                poolSize: this.pool.length
            });
        }
        
        this.inUse.add(obj);
        return obj;
    }

    /**
     * オブジェクトを返却
     */
    public release(obj: T): void {
        if (!this.inUse.has(obj)) {
            DebugHelper.log(`${this.name}: Attempted to release object not in use`, obj);
            return;
        }
        
        this.inUse.delete(obj);
        
        // プールサイズ制限チェック
        if (this.pool.length >= this.maxSize) {
            if (this.destroy) {
                this.destroy(obj);
            }
            DebugHelper.log(`${this.name}: Object destroyed (pool full)`, {
                poolSize: this.pool.length,
                maxSize: this.maxSize
            });
            return;
        }
        
        // オブジェクトをリセット
        if (this.reset) {
            this.reset(obj);
        }
        
        this.pool.push(obj);
        DebugHelper.log(`${this.name}: Object released`, {
            poolSize: this.pool.length,
            inUse: this.inUse.size
        });
    }

    /**
     * プールを事前にアロケート
     */
    private preallocate(size: number): void {
        for (let i = 0; i < size; i++) {
            const obj = this.factory();
            this.pool.push(obj);
            this.createdCount++;
        }
    }

    /**
     * 統計情報を取得
     */
    public getStats(): {
        poolSize: number;
        inUse: number;
        createdCount: number;
        reuseCount: number;
        reuseRate: number;
        memoryEfficiency: number;
    } {
        return {
            poolSize: this.pool.length,
            inUse: this.inUse.size,
            createdCount: this.createdCount,
            reuseCount: this.reuseCount,
            reuseRate: this.getReuseRate(),
            memoryEfficiency: this.getMemoryEfficiency()
        };
    }

    /**
     * 再利用率を計算
     */
    private getReuseRate(): number {
        const totalOperations = this.createdCount + this.reuseCount;
        return totalOperations > 0 ? (this.reuseCount / totalOperations) * 100 : 0;
    }

    /**
     * メモリ効率を計算
     */
    private getMemoryEfficiency(): number {
        const totalObjectsNeeded = this.createdCount + this.reuseCount;
        return totalObjectsNeeded > 0 ? (this.createdCount / totalObjectsNeeded) * 100 : 100;
    }

    /**
     * プールをクリア
     */
    public clear(): void {
        // 使用中オブジェクトの警告
        if (this.inUse.size > 0) {
            DebugHelper.log(`${this.name}: Warning - clearing pool with objects in use`, {
                inUseCount: this.inUse.size
            });
        }
        
        // プール内オブジェクトを破棄
        if (this.destroy) {
            this.pool.forEach(obj => this.destroy!(obj));
        }
        
        this.pool = [];
        this.inUse.clear();
        this.createdCount = 0;
        this.reuseCount = 0;
        
        DebugHelper.log(`${this.name}: Pool cleared`);
    }

    /**
     * プールサイズを動的調整
     */
    public resize(newMaxSize: number): void {
        const oldMaxSize = this.maxSize;
        this.maxSize = newMaxSize;
        
        // サイズが小さくなった場合、余分なオブジェクトを削除
        if (newMaxSize < this.pool.length) {
            const toRemove = this.pool.splice(newMaxSize);
            if (this.destroy) {
                toRemove.forEach(obj => this.destroy!(obj));
            }
        }
        
        DebugHelper.log(`${this.name}: Pool resized`, {
            oldMaxSize,
            newMaxSize,
            currentPoolSize: this.pool.length
        });
    }
}

/**
 * Fabric.jsオブジェクト専用プール
 */
export class FabricObjectPool<T extends fabric.Object> extends ObjectPool<T> {
    constructor(
        factory: () => T,
        initialSize = 5,
        maxSize = 50,
        name = 'FabricObjectPool'
    ) {
        super(
            factory,
            (obj) => this.resetFabricObject(obj),
            (obj) => this.destroyFabricObject(obj),
            initialSize,
            maxSize,
            name
        );
    }

    /**
     * Fabric.jsオブジェクトをリセット
     */
    private resetFabricObject(obj: T): void {
        try {
            // 位置とスタイルをリセット
            obj.set({
                left: 0,
                top: 0,
                scaleX: 1,
                scaleY: 1,
                angle: 0,
                opacity: 1,
                visible: true,
                selectable: true,
                evented: true
            });
            
            // カスタムデータをクリア
            (obj as any).data = undefined;
            
            DebugHelper.log(`${this.name}: Fabric object reset`);
        } catch (error) {
            DebugHelper.log(`${this.name}: Error resetting fabric object`, error);
        }
    }

    /**
     * Fabric.jsオブジェクトを破棄
     */
    private destroyFabricObject(obj: T): void {
        try {
            // イベントリスナーをクリア
            obj.off();
            
            // データプロパティをクリア
            (obj as any).data = undefined;
            
            DebugHelper.log(`${this.name}: Fabric object destroyed`);
        } catch (error) {
            DebugHelper.log(`${this.name}: Error destroying fabric object`, error);
        }
    }
}

/**
 * 座標情報用のプール
 */
export class PointPool extends ObjectPool<{ x: number; y: number }> {
    constructor(initialSize = 20, maxSize = 100) {
        super(
            () => ({ x: 0, y: 0 }),
            (point) => {
                point.x = 0;
                point.y = 0;
            },
            undefined,
            initialSize,
            maxSize,
            'PointPool'
        );
    }

    /**
     * 座標を設定してポイントを取得
     */
    public getPoint(x: number, y: number): { x: number; y: number } {
        const point = this.get();
        point.x = x;
        point.y = y;
        return point;
    }
}

/**
 * バウンディングボックス用のプール
 */
export class BoundingBoxPool extends ObjectPool<{
    left: number;
    top: number;
    width: number;
    height: number;
}> {
    constructor(initialSize = 10, maxSize = 50) {
        super(
            () => ({ left: 0, top: 0, width: 0, height: 0 }),
            (box) => {
                box.left = 0;
                box.top = 0;
                box.width = 0;
                box.height = 0;
            },
            undefined,
            initialSize,
            maxSize,
            'BoundingBoxPool'
        );
    }

    /**
     * 値を設定してバウンディングボックスを取得
     */
    public getBox(left: number, top: number, width: number, height: number): {
        left: number;
        top: number;
        width: number;
        height: number;
    } {
        const box = this.get();
        box.left = left;
        box.top = top;
        box.width = width;
        box.height = height;
        return box;
    }
}

/**
 * プールマネージャー - 複数のプールを統合管理
 */
export class PoolManager {
    private pools = new Map<string, ObjectPool<any>>();
    private monitoringInterval?: NodeJS.Timeout | number | undefined;
    
    constructor(private enableMonitoring = true) {
        if (this.enableMonitoring) {
            this.startMonitoring();
        }
        DebugHelper.log('PoolManager initialized');
    }

    /**
     * プールを登録
     */
    public registerPool<T>(name: string, pool: ObjectPool<T>): void {
        this.pools.set(name, pool);
        DebugHelper.log('Pool registered', { name, poolCount: this.pools.size });
    }

    /**
     * プールを取得
     */
    public getPool<T>(name: string): ObjectPool<T> | undefined {
        return this.pools.get(name);
    }

    /**
     * 全プールの統計を取得
     */
    public getAllStats(): Record<string, any> {
        const stats: Record<string, any> = {};
        
        this.pools.forEach((pool, name) => {
            stats[name] = pool.getStats();
        });
        
        return stats;
    }

    /**
     * 全プールをクリア
     */
    public clearAllPools(): void {
        this.pools.forEach((pool, name) => {
            pool.clear();
            DebugHelper.log(`Pool cleared: ${name}`);
        });
    }

    /**
     * メモリ使用量の監視を開始
     */
    private startMonitoring(): void {
        this.monitoringInterval = setInterval(() => {
            const stats = this.getAllStats();
            let totalInUse = 0;
            let totalPooled = 0;
            let totalCreated = 0;
            let totalReused = 0;
            
            Object.values(stats).forEach((poolStats: any) => {
                totalInUse += poolStats.inUse;
                totalPooled += poolStats.poolSize;
                totalCreated += poolStats.createdCount;
                totalReused += poolStats.reuseCount;
            });
            
            const overallReuseRate = totalCreated + totalReused > 0 
                ? (totalReused / (totalCreated + totalReused)) * 100 
                : 0;
            
            DebugHelper.log('Pool monitoring report', {
                poolCount: this.pools.size,
                totalInUse,
                totalPooled,
                totalCreated,
                totalReused,
                overallReuseRate: overallReuseRate.toFixed(1) + '%',
                memoryImpact: totalCreated > 0 
                    ? `${((totalCreated / (totalCreated + totalReused)) * 100).toFixed(1)}% memory saved`
                    : 'No data'
            });
        }, 30000); // 30秒間隔
    }

    /**
     * 監視を停止
     */
    public stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval as NodeJS.Timeout);
            this.monitoringInterval = undefined;
        }
    }

    /**
     * リソースを解放
     */
    public dispose(): void {
        this.stopMonitoring();
        this.clearAllPools();
        this.pools.clear();
        DebugHelper.log('PoolManager disposed');
    }
}

// デフォルトプールマネージャー
export const poolManager = new PoolManager();