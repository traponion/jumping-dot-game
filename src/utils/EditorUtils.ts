// エディター用のユーティリティ関数
import * as fabric from 'fabric';
import { 
    EditorError, 
    ERROR_CODES, 
    ERROR_TYPES, 
    type ObjectCreationParams 
} from '../types/EditorTypes.js';
import { EDITOR_CONFIG } from '../types/EditorTypes.js';

/**
 * DOM要素取得のヘルパー関数
 */
export class DOMHelper {
    /**
     * 必須のDOM要素を取得する（見つからない場合はエラー）
     */
    static getRequiredElement<T extends HTMLElement>(id: string): T {
        const element = document.getElementById(id) as T;
        if (!element) {
            throw new EditorError(
                `Required DOM element not found: ${id}`,
                ERROR_CODES.DOM_ELEMENT_NOT_FOUND,
                ERROR_TYPES.DOM,
                { elementId: id }
            );
        }
        return element;
    }

    /**
     * オプショナルなDOM要素を取得する
     */
    static getOptionalElement<T extends HTMLElement>(id: string): T | null {
        return document.getElementById(id) as T | null;
    }

    /**
     * 複数のDOM要素を一括取得する
     */
    static getElements<T extends Record<string, string>>(
        elementIds: T
    ): { [K in keyof T]: HTMLElement } {
        const elements = {} as { [K in keyof T]: HTMLElement };
        
        for (const [key, id] of Object.entries(elementIds)) {
            elements[key as keyof T] = this.getRequiredElement(id);
        }
        
        return elements;
    }

    /**
     * NodeListの要素に対してイベントリスナーを一括設定
     */
    static addEventListenersToNodeList<T extends Event>(
        nodeList: NodeListOf<Element>,
        eventType: string,
        handler: (element: Element, event: T) => void
    ): void {
        nodeList.forEach(element => {
            element.addEventListener(eventType, (event) => {
                handler(element, event as T);
            });
        });
    }
}

/**
 * 型変換のヘルパー関数
 */
export class TypeHelper {
    /**
     * 文字列を数値に安全に変換
     */
    static safeParseInt(value: string, defaultValue: number = 0): number {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    /**
     * 文字列を浮動小数点数に安全に変換
     */
    static safeParseFloat(value: string, defaultValue: number = 0): number {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    /**
     * オブジェクトから安全にプロパティを取得
     */
    static safeGetProperty<T, K extends keyof T>(
        obj: T,
        key: K,
        defaultValue: T[K]
    ): T[K] {
        return obj?.[key] ?? defaultValue;
    }
}

/**
 * Fabric.jsオブジェクトのヘルパー関数
 */
export class FabricHelper {
    /**
     * Fabric.jsオブジェクトにデータプロパティを安全に設定
     */
    static setObjectData(obj: fabric.Object, data: Record<string, any>): void {
        (obj as any).data = data;
    }

    /**
     * Fabric.jsオブジェクトからデータプロパティを安全に取得
     */
    static getObjectData<T = any>(obj: fabric.Object, key: string, defaultValue: T): T {
        const data = (obj as any).data;
        if (!data || typeof data !== 'object') return defaultValue;
        return data[key] ?? defaultValue;
    }

    /**
     * Fabric.jsオブジェクトの型を取得
     */
    static getObjectType(obj: fabric.Object): string | null {
        return this.getObjectData(obj, 'type', null);
    }

    /**
     * 座標をグリッドにスナップ
     */
    static snapToGrid(
        point: { x: number; y: number },
        gridSize: number = EDITOR_CONFIG.GRID_SIZE
    ): { x: number; y: number } {
        return {
            x: Math.round(point.x / gridSize) * gridSize,
            y: Math.round(point.y / gridSize) * gridSize
        };
    }

    /**
     * オブジェクトの境界矩形を取得
     */
    static getObjectBounds(obj: fabric.Object): {
        left: number;
        top: number;
        width: number;
        height: number;
    } {
        const bounds = obj.getBoundingRect();
        return {
            left: bounds.left,
            top: bounds.top,
            width: bounds.width,
            height: bounds.height
        };
    }
}

/**
 * オブジェクトファクトリー
 */
export class ObjectFactory {
    /**
     * プラットフォームオブジェクトを作成
     */
    static createPlatform(
        startPoint: { x: number; y: number },
        endPoint: { x: number; y: number }
    ): fabric.Line {
        const line = new fabric.Line([startPoint.x, startPoint.y, endPoint.x, endPoint.y], {
            stroke: EDITOR_CONFIG.COLORS.PLATFORM,
            strokeWidth: EDITOR_CONFIG.STROKE_WIDTH.PLATFORM,
            selectable: true
        });
        
        FabricHelper.setObjectData(line, { type: 'platform' });
        return line;
    }

    /**
     * スパイクオブジェクトを作成
     */
    static createSpike(params: ObjectCreationParams): fabric.Polygon {
        const { position, size = EDITOR_CONFIG.OBJECT_SIZES.SPIKE } = params;
        
        const triangle = new fabric.Polygon([
            { x: 0, y: size.height },
            { x: size.width / 2, y: 0 },
            { x: size.width, y: size.height }
        ], {
            left: position.x - size.width / 2,
            top: position.y - size.height,
            fill: EDITOR_CONFIG.COLORS.SPIKE
        });
        
        FabricHelper.setObjectData(triangle, { type: 'spike' });
        return triangle;
    }

    /**
     * ゴールオブジェクトを作成
     */
    static createGoal(params: ObjectCreationParams): fabric.Rect {
        const { position, size = EDITOR_CONFIG.OBJECT_SIZES.GOAL } = params;
        
        const goal = new fabric.Rect({
            left: position.x - size.width / 2,
            top: position.y - size.height,
            width: size.width,
            height: size.height,
            fill: 'transparent',
            stroke: EDITOR_CONFIG.COLORS.GOAL,
            strokeWidth: EDITOR_CONFIG.STROKE_WIDTH.GOAL
        });
        
        FabricHelper.setObjectData(goal, { type: 'goal' });
        return goal;
    }

    /**
     * テキストオブジェクトを作成
     */
    static createText(params: ObjectCreationParams): fabric.Text {
        const { position, text = 'TEXT' } = params;
        
        const textObj = new fabric.Text(text, {
            left: position.x,
            top: position.y,
            fontFamily: 'monospace',
            fontSize: 16,
            fill: EDITOR_CONFIG.COLORS.TEXT
        });
        
        FabricHelper.setObjectData(textObj, { type: 'text' });
        return textObj;
    }

    /**
     * グリッドラインを作成
     */
    static createGridLine(
        start: { x: number; y: number },
        end: { x: number; y: number }
    ): fabric.Line {
        const line = new fabric.Line([start.x, start.y, end.x, end.y], {
            stroke: EDITOR_CONFIG.COLORS.GRID,
            strokeWidth: EDITOR_CONFIG.STROKE_WIDTH.GRID,
            selectable: false,
            evented: false
        });
        
        FabricHelper.setObjectData(line, { type: 'grid' });
        return line;
    }
}

/**
 * イベント処理のヘルパー関数
 */
export class EventHelper {
    /**
     * デバウンス関数
     */
    static debounce<T extends (...args: any[]) => void>(
        func: T,
        delay: number
    ): (...args: Parameters<T>) => void {
        let timeoutId: NodeJS.Timeout;
        return (...args: Parameters<T>) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    }

    /**
     * スロットル関数
     */
    static throttle<T extends (...args: any[]) => void>(
        func: T,
        limit: number
    ): (...args: Parameters<T>) => void {
        let inThrottle: boolean;
        return (...args: Parameters<T>) => {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * キーボードイベントのキーを正規化
     */
    static normalizeKeyboardEvent(event: KeyboardEvent): string {
        if (event.ctrlKey || event.metaKey) {
            return `${event.ctrlKey ? 'Ctrl' : 'Cmd'}+${event.code}`;
        }
        return event.code || event.key;
    }
}

/**
 * 算術計算のヘルパー関数
 */
export class MathHelper {
    /**
     * 2点間の距離を計算
     */
    static distance(
        point1: { x: number; y: number },
        point2: { x: number; y: number }
    ): number {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 2点間の角度を計算（度数）
     */
    static angle(
        point1: { x: number; y: number },
        point2: { x: number; y: number }
    ): number {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.atan2(dy, dx) * 180 / Math.PI;
    }

    /**
     * 値を指定範囲内にクランプ
     */
    static clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }
}

/**
 * デバッグ用のヘルパー関数
 */
export class DebugHelper {
    private static debugMode = process.env.NODE_ENV === 'development';

    /**
     * デバッグログ出力
     */
    static log(message: string, data?: any): void {
        if (this.debugMode) {
            console.log(`[Editor Debug] ${message}`, data);
        }
    }

    /**
     * パフォーマンス測定
     */
    static time<T>(label: string, fn: () => T): T {
        if (this.debugMode) {
            console.time(label);
            const result = fn();
            console.timeEnd(label);
            return result;
        }
        return fn();
    }
}