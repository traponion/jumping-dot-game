// エディターのModel層 - データ状態管理とビジネスロジック
import type { StageData } from '../core/StageLoader.js';
import type { IEditorModel } from '../controllers/EditorController.js';
import {
    type EditorState,
    EDITOR_TOOLS,
    EDITOR_CONFIG
} from '../types/EditorTypes.js';
import {
    DebugHelper
} from '../utils/EditorUtils.js';

// Model層の状態変更通知用インターフェース
export interface ModelChangeListener {
    onStageDataChanged(stageData: StageData | null): void;
    onEditorStateChanged(editorState: EditorState): void;
    onValidationError(error: string): void;
}

/**
 * エディターのModel層実装
 * - ステージデータの管理
 * - エディター状態の管理
 * - データ検証とシリアライゼーション
 * - ビジネスロジックの実装
 */
export class EditorModel implements IEditorModel {
    private currentStage: StageData | null = null;
    private editorState: EditorState;
    private changeListeners: ModelChangeListener[] = [];
    private isModified = false;
    private lastSaved: Date | null = null;

    // バリデーションルール
    private readonly validationRules = {
        stageName: {
            minLength: 1,
            maxLength: 50,
            pattern: /^[a-zA-Z0-9\s\-_]+$/
        },
        stageId: {
            min: 1,
            max: 9999
        },
        objectLimits: {
            platforms: 100,
            spikes: 50,
            texts: 10
        }
    };

    constructor() {
        this.editorState = this.createDefaultEditorState();
        DebugHelper.log('EditorModel constructed', { 
            editorState: this.editorState 
        });
    }

    // === 変更通知システム ===

    /**
     * 変更リスナーを追加
     */
    public addChangeListener(listener: ModelChangeListener): void {
        this.changeListeners.push(listener);
        DebugHelper.log('Change listener added', { 
            listenerCount: this.changeListeners.length 
        });
    }

    /**
     * 変更リスナーを削除
     */
    public removeChangeListener(listener: ModelChangeListener): void {
        const index = this.changeListeners.indexOf(listener);
        if (index > -1) {
            this.changeListeners.splice(index, 1);
            DebugHelper.log('Change listener removed', { 
                listenerCount: this.changeListeners.length 
            });
        }
    }

    /**
     * ステージデータ変更を通知
     */
    private notifyStageDataChanged(): void {
        this.changeListeners.forEach(listener => {
            try {
                listener.onStageDataChanged(this.currentStage);
            } catch (error) {
                DebugHelper.log('Error in stage data change listener', error);
            }
        });
    }

    /**
     * エディター状態変更を通知
     */
    private notifyEditorStateChanged(): void {
        this.changeListeners.forEach(listener => {
            try {
                listener.onEditorStateChanged(this.editorState);
            } catch (error) {
                DebugHelper.log('Error in editor state change listener', error);
            }
        });
    }

    /**
     * バリデーションエラーを通知
     */
    private notifyValidationError(error: string): void {
        this.changeListeners.forEach(listener => {
            try {
                listener.onValidationError(error);
            } catch (error) {
                DebugHelper.log('Error in validation error listener', error);
            }
        });
    }

    // === IEditorModel インターフェース実装 ===

    /**
     * 現在のステージを取得
     */
    public getCurrentStage(): StageData | null {
        return this.currentStage;
    }

    /**
     * 現在のステージを設定
     */
    public setCurrentStage(stageData: StageData): void {
        if (!this.validateStageData(stageData)) {
            this.notifyValidationError('Invalid stage data provided');
            return;
        }

        this.currentStage = { ...stageData }; // Deep copy for immutability
        this.isModified = false;
        this.lastSaved = null;
        this.notifyStageDataChanged();
        
        DebugHelper.log('Current stage set', { 
            stageId: stageData.id, 
            name: stageData.name,
            objectCount: this.getObjectCount()
        });
    }

    /**
     * エディター状態を取得
     */
    public getEditorState(): EditorState {
        return { ...this.editorState }; // Immutable copy
    }

    /**
     * エディター状態を更新
     */
    public updateEditorState(updates: Partial<EditorState>): void {
        const previousState = { ...this.editorState };
        this.editorState = { ...this.editorState, ...updates };
        
        // 状態変更をログ
        const changedKeys = Object.keys(updates);
        DebugHelper.log('Editor state updated', { 
            changedKeys,
            previousState: this.pickProperties(previousState, changedKeys),
            newState: this.pickProperties(this.editorState, changedKeys)
        });
        
        this.notifyEditorStateChanged();
    }

    /**
     * オブジェクト数を取得
     */
    public getObjectCount(): number {
        if (!this.currentStage) return 0;
        
        return this.currentStage.platforms.length + 
               this.currentStage.spikes.length + 
               1; // +1 for goal
    }

    /**
     * ステージデータを検証
     */
    public validateStageData(stageData: StageData): boolean {
        try {
            // 基本フィールドの存在確認
            if (!this.validateRequiredFields(stageData)) {
                return false;
            }

            // ステージ名の検証
            if (!this.validateStageName(stageData.name)) {
                this.notifyValidationError('Invalid stage name');
                return false;
            }

            // ステージIDの検証
            if (!this.validateStageId(stageData.id)) {
                this.notifyValidationError('Invalid stage ID');
                return false;
            }

            // オブジェクト数の制限チェック
            if (!this.validateObjectLimits(stageData)) {
                this.notifyValidationError('Too many objects in stage');
                return false;
            }

            // 座標値の検証
            if (!this.validateCoordinates(stageData)) {
                this.notifyValidationError('Invalid object coordinates');
                return false;
            }

            DebugHelper.log('Stage data validation passed', { 
                stageId: stageData.id,
                objectCount: this.calculateObjectCount(stageData)
            });
            
            return true;
        } catch (error) {
            DebugHelper.log('Stage data validation error', error);
            this.notifyValidationError('Validation failed due to unexpected error');
            return false;
        }
    }

    /**
     * ステージをJSONとしてエクスポート
     */
    public exportStageAsJson(): string {
        if (!this.currentStage) {
            throw new Error('No stage data to export');
        }

        try {
            const exportData = {
                ...this.currentStage,
                exportedAt: new Date().toISOString(),
                editorVersion: '1.0.0'
            };

            const json = JSON.stringify(exportData, null, 2);
            DebugHelper.log('Stage exported as JSON', { 
                stageId: this.currentStage.id,
                dataSize: json.length 
            });
            
            return json;
        } catch (error) {
            DebugHelper.log('JSON export failed', error);
            throw new Error('Failed to export stage as JSON');
        }
    }

    /**
     * JSONからステージをインポート
     */
    public importStageFromJson(json: string): StageData {
        try {
            const data = JSON.parse(json);
            
            // インポートデータの基本検証
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid JSON format');
            }

            // エクスポート時の追加フィールドを削除
            const { exportedAt, editorVersion, ...stageData } = data;

            if (!this.validateStageData(stageData)) {
                throw new Error('Imported data failed validation');
            }

            DebugHelper.log('Stage imported from JSON', { 
                stageId: stageData.id,
                hasExportMeta: !!(exportedAt || editorVersion)
            });
            
            return stageData;
        } catch (error) {
            DebugHelper.log('JSON import failed', error);
            throw new Error(`Failed to import stage from JSON: ${error}`);
        }
    }

    // === 追加のModel機能 ===

    /**
     * 変更状態を取得
     */
    public isStageModified(): boolean {
        return this.isModified;
    }

    /**
     * 変更状態をマーク
     */
    public markAsModified(): void {
        this.isModified = true;
        DebugHelper.log('Stage marked as modified');
    }

    /**
     * 保存状態をマーク
     */
    public markAsSaved(): void {
        this.isModified = false;
        this.lastSaved = new Date();
        DebugHelper.log('Stage marked as saved', { savedAt: this.lastSaved });
    }

    /**
     * 最後の保存時刻を取得
     */
    public getLastSavedTime(): Date | null {
        return this.lastSaved;
    }

    /**
     * ステージ統計を取得
     */
    public getStageStatistics(): {
        platformCount: number;
        spikeCount: number;
        totalLength: number;
        averageObjectSize: number;
        boundingBox: { width: number; height: number };
    } | null {
        if (!this.currentStage) return null;

        const stats = {
            platformCount: this.currentStage.platforms.length,
            spikeCount: this.currentStage.spikes.length,
            totalLength: 0,
            averageObjectSize: 0,
            boundingBox: { width: 0, height: 0 }
        };

        // プラットフォームの総長計算
        stats.totalLength = this.currentStage.platforms.reduce((total, platform) => {
            const length = Math.sqrt(
                Math.pow(platform.x2 - platform.x1, 2) + 
                Math.pow(platform.y2 - platform.y1, 2)
            );
            return total + length;
        }, 0);

        // バウンディングボックス計算
        const allCoords = [
            ...this.currentStage.platforms.flatMap(p => [
                { x: p.x1, y: p.y1 }, 
                { x: p.x2, y: p.y2 }
            ]),
            ...this.currentStage.spikes.map(s => ({ x: s.x, y: s.y })),
            { x: this.currentStage.goal.x, y: this.currentStage.goal.y }
        ];

        if (allCoords.length > 0) {
            const minX = Math.min(...allCoords.map(c => c.x));
            const maxX = Math.max(...allCoords.map(c => c.x));
            const minY = Math.min(...allCoords.map(c => c.y));
            const maxY = Math.max(...allCoords.map(c => c.y));
            
            stats.boundingBox = {
                width: maxX - minX,
                height: maxY - minY
            };
        }

        return stats;
    }

    /**
     * ステージを複製
     */
    public cloneCurrentStage(newId?: number, newName?: string): StageData | null {
        if (!this.currentStage) return null;

        const cloned: StageData = {
            ...this.currentStage,
            id: newId || this.generateNextStageId(),
            name: newName || `${this.currentStage.name} (Copy)`,
            platforms: [...this.currentStage.platforms],
            spikes: [...this.currentStage.spikes],
            goal: { ...this.currentStage.goal },
            startText: { ...this.currentStage.startText },
            goalText: { ...this.currentStage.goalText }
        };

        DebugHelper.log('Stage cloned', { 
            originalId: this.currentStage.id,
            clonedId: cloned.id 
        });

        return cloned;
    }

    // === プライベートメソッド ===

    /**
     * デフォルトのエディター状態を作成
     */
    private createDefaultEditorState(): EditorState {
        return {
            selectedTool: EDITOR_TOOLS.SELECT,
            selectedObject: null,
            isDrawing: false,
            gridEnabled: true,
            snapToGrid: true
        };
    }

    /**
     * 必須フィールドの存在確認
     */
    private validateRequiredFields(stageData: any): boolean {
        const requiredFields = ['id', 'name', 'platforms', 'spikes', 'goal'];
        return requiredFields.every(field => 
            stageData.hasOwnProperty(field) && stageData[field] !== undefined
        );
    }

    /**
     * ステージ名の検証
     */
    private validateStageName(name: string): boolean {
        const rules = this.validationRules.stageName;
        return typeof name === 'string' &&
               name.length >= rules.minLength &&
               name.length <= rules.maxLength &&
               rules.pattern.test(name);
    }

    /**
     * ステージIDの検証
     */
    private validateStageId(id: number): boolean {
        const rules = this.validationRules.stageId;
        return typeof id === 'number' &&
               Number.isInteger(id) &&
               id >= rules.min &&
               id <= rules.max;
    }

    /**
     * オブジェクト数制限の検証
     */
    private validateObjectLimits(stageData: StageData): boolean {
        const limits = this.validationRules.objectLimits;
        return stageData.platforms.length <= limits.platforms &&
               stageData.spikes.length <= limits.spikes;
    }

    /**
     * 座標値の検証
     */
    private validateCoordinates(stageData: StageData): boolean {
        const maxCoord = EDITOR_CONFIG.CANVAS_SIZE.width * 2; // Allow some overflow
        
        // プラットフォーム座標チェック
        for (const platform of stageData.platforms) {
            if (!this.isValidCoordinate(platform.x1, maxCoord) ||
                !this.isValidCoordinate(platform.y1, maxCoord) ||
                !this.isValidCoordinate(platform.x2, maxCoord) ||
                !this.isValidCoordinate(platform.y2, maxCoord)) {
                return false;
            }
        }

        // スパイク座標チェック
        for (const spike of stageData.spikes) {
            if (!this.isValidCoordinate(spike.x, maxCoord) ||
                !this.isValidCoordinate(spike.y, maxCoord)) {
                return false;
            }
        }

        // ゴール座標チェック
        if (!this.isValidCoordinate(stageData.goal.x, maxCoord) ||
            !this.isValidCoordinate(stageData.goal.y, maxCoord)) {
            return false;
        }

        return true;
    }

    /**
     * 座標値の妥当性チェック
     */
    private isValidCoordinate(coord: number, maxValue: number): boolean {
        return typeof coord === 'number' &&
               !isNaN(coord) &&
               coord >= -maxValue &&
               coord <= maxValue;
    }

    /**
     * オブジェクト数をカウント
     */
    private calculateObjectCount(stageData: StageData): number {
        return stageData.platforms.length + stageData.spikes.length + 1;
    }

    /**
     * 次のステージIDを生成
     */
    private generateNextStageId(): number {
        // 簡単な実装：現在時刻ベースのID
        return Math.floor(Date.now() / 1000) % 10000;
    }

    /**
     * オブジェクトから指定プロパティを抽出
     */
    private pickProperties<T extends object>(obj: T, keys: string[]): Partial<T> {
        const result: Partial<T> = {};
        keys.forEach(key => {
            if (key in obj) {
                (result as any)[key] = (obj as any)[key];
            }
        });
        return result;
    }
}