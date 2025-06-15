import * as fabric from 'fabric';
import { FabricRenderSystem } from './FabricRenderSystem.js';
import type { Platform, Spike, Goal, StageData, TextElement } from '../core/StageLoader.js';
import {
    type EditorState,
    type EditorCallbacks,
    type FabricObjectWithData,
    type MouseEventHandler,
    type ObjectCreationParams,
    EDITOR_TOOLS,
    EDITOR_CONFIG,
    isFabricObjectWithData,
    isPlatformObject,
    isSpikeObject,
    isGoalObject,
    isTextObject,
    isGridObject,
    EditorError,
    ERROR_CODES,
    ERROR_TYPES
} from '../types/EditorTypes.js';

import {
    FabricHelper,
    ObjectFactory,
    DebugHelper
} from '../utils/EditorUtils.js';

// 型定義を再エクスポート
export type { EditorState, EditorCallbacks, FabricObjectWithData };

export class EditorRenderSystem extends FabricRenderSystem {
    private editorState: EditorState;
    private callbacks: EditorCallbacks;
    private stageData: StageData | null = null;
    
    constructor(canvasElement: HTMLCanvasElement, callbacks: EditorCallbacks = {}) {
        super(canvasElement);
        
        this.callbacks = callbacks;
        this.editorState = {
            selectedTool: EDITOR_TOOLS.SELECT,
            selectedObject: null,
            isDrawing: false,
            gridEnabled: true,
            snapToGrid: true
        };
        
        this.initializeEditorMode();
        this.setupEventListeners();
        
        DebugHelper.log('EditorRenderSystem initialized', {
            canvasSize: { width: this.canvas.width, height: this.canvas.height },
            state: this.editorState
        });
    }

    /**
     * エディターモードを有効化
     */
    public enableEditorMode(): void {
        this.initializeEditorMode();
    }

    private initializeEditorMode(): void {
        try {
            // Fabric.jsのインタラクティブ機能を有効化
            this.canvas.selection = true;
            this.canvas.allowTouchScrolling = true;
            this.canvas.preserveObjectStacking = true;
            
            DebugHelper.log('Editor mode enabled');
        } catch (error) {
            throw new EditorError(
                'Failed to initialize editor mode',
                ERROR_CODES.CANVAS_INIT_FAILED,
                ERROR_TYPES.FABRIC,
                { error }
            );
        }
    }

    /**
     * イベントリスナーを設定
     */
    private setupEventListeners(): void {
        this.setupSelectionEvents();
        this.setupModificationEvents();
        this.setupMouseEvents();
    }

    private setupSelectionEvents(): void {
        this.canvas.on('selection:created', (e: any) => {
            const selectedObject = e.selected?.[0] || null;
            this.handleObjectSelection(selectedObject);
        });

        this.canvas.on('selection:updated', (e: any) => {
            const selectedObject = e.selected?.[0] || null;
            this.handleObjectSelection(selectedObject);
        });

        this.canvas.on('selection:cleared', () => {
            this.handleObjectSelection(null);
        });
    }

    private setupModificationEvents(): void {
        this.canvas.on('object:modified', (e: any) => {
            if (e.target && isFabricObjectWithData(e.target)) {
                this.callbacks.onObjectModified?.(e.target);
                this.updateStageDataFromCanvas();
            }
        });
    }

    private setupMouseEvents(): void {
        this.canvas.on('mouse:down', this.handleMouseDown.bind(this));
        this.canvas.on('mouse:move', this.handleMouseMove.bind(this));
        this.canvas.on('mouse:up', this.handleMouseUp.bind(this));
    }

    /**
     * オブジェクト選択時の処理
     */
    private handleObjectSelection(object: fabric.Object | null): void {
        const typedObject = object && isFabricObjectWithData(object) ? object : null;
        this.editorState.selectedObject = typedObject;
        this.callbacks.onObjectSelected?.(typedObject);
        
        DebugHelper.log('Object selected', {
            objectType: typedObject ? FabricHelper.getObjectType(typedObject) : null,
            objectData: typedObject?.data
        });
    }

    /**
     * マウスダウンイベント処理
     */
    private handleMouseDown: MouseEventHandler = (e) => {
        if (this.editorState.selectedTool === EDITOR_TOOLS.SELECT) return;

        const pointer = this.canvas.getPointer(e.e as any);
        const snappedPointer = this.getSnappedPosition(pointer);
        
        this.editorState.isDrawing = true;
        
        try {
            switch (this.editorState.selectedTool) {
                case EDITOR_TOOLS.PLATFORM:
                    this.startDrawingPlatform(snappedPointer);
                    break;
                case EDITOR_TOOLS.SPIKE:
                    this.placeObject(EDITOR_TOOLS.SPIKE, snappedPointer);
                    break;
                case EDITOR_TOOLS.GOAL:
                    this.placeObject(EDITOR_TOOLS.GOAL, snappedPointer);
                    break;
                case EDITOR_TOOLS.TEXT:
                    this.placeObject(EDITOR_TOOLS.TEXT, snappedPointer);
                    break;
            }
        } catch (error) {
            DebugHelper.log('Error during object creation', error);
            this.editorState.isDrawing = false;
        }
    };

    /**
     * マウス移動イベント処理
     */
    private handleMouseMove: MouseEventHandler = (e) => {
        if (!this.editorState.isDrawing) return;

        const pointer = this.canvas.getPointer(e.e as any);
        const snappedPointer = this.getSnappedPosition(pointer);

        if (this.editorState.selectedTool === EDITOR_TOOLS.PLATFORM) {
            this.updateDrawingPlatform(snappedPointer);
        }
    };

    /**
     * マウスアップイベント処理
     */
    private handleMouseUp: MouseEventHandler = () => {
        if (!this.editorState.isDrawing) return;

        this.editorState.isDrawing = false;

        if (this.editorState.selectedTool === EDITOR_TOOLS.PLATFORM) {
            this.finishDrawingPlatform();
        }

        this.updateStageDataFromCanvas();
    };

    /**
     * 位置をグリッドにスナップ
     */
    private getSnappedPosition(pointer: { x: number; y: number }): { x: number; y: number } {
        if (!this.editorState.snapToGrid) return pointer;
        return FabricHelper.snapToGrid(pointer, EDITOR_CONFIG.GRID_SIZE);
    }

    /**
     * プラットフォーム描画開始
     */
    private startDrawingPlatform(pointer: { x: number; y: number }): void {
        const line = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            stroke: EDITOR_CONFIG.COLORS.PLATFORM,
            strokeWidth: EDITOR_CONFIG.STROKE_WIDTH.PLATFORM,
            selectable: false
        });
        
        FabricHelper.setObjectData(line, { type: EDITOR_TOOLS.PLATFORM, isDrawing: true });
        this.canvas.add(line);
        this.canvas.renderAll();
    }

    /**
     * プラットフォーム描画更新
     */
    private updateDrawingPlatform(pointer: { x: number; y: number }): void {
        const objects = this.canvas.getObjects();
        const drawingPlatform = objects.find(obj => 
            isFabricObjectWithData(obj) && 
            obj.data?.type === EDITOR_TOOLS.PLATFORM && 
            obj.data?.isDrawing
        ) as fabric.Line;

        if (drawingPlatform) {
            drawingPlatform.set({
                x2: pointer.x,
                y2: pointer.y
            });
            this.canvas.renderAll();
        }
    }

    /**
     * プラットフォーム描画完了
     */
    private finishDrawingPlatform(): void {
        const objects = this.canvas.getObjects();
        const drawingPlatform = objects.find(obj => 
            isFabricObjectWithData(obj) && 
            obj.data?.type === EDITOR_TOOLS.PLATFORM && 
            obj.data?.isDrawing
        ) as fabric.Line;

        if (drawingPlatform) {
            drawingPlatform.set({ selectable: true });
            FabricHelper.setObjectData(drawingPlatform, { 
                type: EDITOR_TOOLS.PLATFORM, 
                isDrawing: false 
            });
            this.canvas.renderAll();
        }
    }

    /**
     * オブジェクト配置（スパイク、ゴール、テキスト）
     */
    private placeObject(type: typeof EDITOR_TOOLS[keyof typeof EDITOR_TOOLS], position: { x: number; y: number }): void {
        let object: fabric.Object;
        
        const params: ObjectCreationParams = { position };
        
        switch (type) {
            case EDITOR_TOOLS.SPIKE:
                object = ObjectFactory.createSpike(params);
                break;
            case EDITOR_TOOLS.GOAL:
                object = ObjectFactory.createGoal(params);
                break;
            case EDITOR_TOOLS.TEXT:
                object = ObjectFactory.createText(params);
                break;
            default:
                throw new EditorError(
                    `Unsupported object type: ${type}`,
                    ERROR_CODES.OBJECT_CREATION_FAILED,
                    ERROR_TYPES.FABRIC,
                    { type, position }
                );
        }

        this.canvas.add(object);
        this.canvas.renderAll();
    }

    /**
     * 選択ツールを設定
     */
    public setSelectedTool(tool: typeof EDITOR_TOOLS[keyof typeof EDITOR_TOOLS]): void {
        this.editorState.selectedTool = tool;
        
        // キャンバスの選択モードを更新
        if (tool === EDITOR_TOOLS.SELECT) {
            this.canvas.selection = true;
        } else {
            this.canvas.discardActiveObject();
            this.canvas.selection = false;
        }
        
        this.canvas.renderAll();
        DebugHelper.log('Tool selected', { tool });
    }

    /**
     * 選択されたオブジェクトを削除
     */
    public deleteSelectedObject(): void {
        if (this.editorState.selectedObject) {
            this.canvas.remove(this.editorState.selectedObject as fabric.Object);
            this.editorState.selectedObject = null;
            this.callbacks.onObjectSelected?.(null);
            this.updateStageDataFromCanvas();
            this.canvas.renderAll();
            
            DebugHelper.log('Object deleted');
        }
    }

    /**
     * グリッド表示切り替え
     */
    public toggleGrid(): void {
        this.editorState.gridEnabled = !this.editorState.gridEnabled;
        this.renderGrid();
        DebugHelper.log('Grid toggled', { enabled: this.editorState.gridEnabled });
    }

    /**
     * グリッドスナップ切り替え
     */
    public toggleSnapToGrid(): void {
        this.editorState.snapToGrid = !this.editorState.snapToGrid;
        DebugHelper.log('Snap to grid toggled', { enabled: this.editorState.snapToGrid });
    }

    /**
     * グリッドを描画
     */
    private renderGrid(): void {
        // 既存のグリッドを削除
        const gridObjects = this.canvas.getObjects().filter(obj => 
            isFabricObjectWithData(obj) && isGridObject(obj)
        );
        gridObjects.forEach(obj => this.canvas.remove(obj));

        if (!this.editorState.gridEnabled) {
            this.canvas.renderAll();
            return;
        }

        const canvasWidth = this.canvas.width!;
        const canvasHeight = this.canvas.height!;

        // 縦線を描画
        for (let x = 0; x <= canvasWidth; x += EDITOR_CONFIG.GRID_SIZE) {
            const line = ObjectFactory.createGridLine(
                { x, y: 0 },
                { x, y: canvasHeight }
            );
            this.canvas.add(line);
        }

        // 横線を描画
        for (let y = 0; y <= canvasHeight; y += EDITOR_CONFIG.GRID_SIZE) {
            const line = ObjectFactory.createGridLine(
                { x: 0, y },
                { x: canvasWidth, y }
            );
            this.canvas.add(line);
        }

        this.canvas.renderAll();
    }

    /**
     * ステージデータを編集用に読み込み
     */
    public loadStageForEditing(stageData: StageData): void {
        this.stageData = stageData;
        this.clearCanvas();
        this.renderGrid();
        
        // ステージオブジェクトを編集可能なFabric.jsオブジェクトとして描画
        this.renderEditableObjects(stageData);
        
        this.canvas.renderAll();
        DebugHelper.log('Stage loaded for editing', { stageId: stageData.id });
    }

    /**
     * 編集可能なオブジェクトを描画
     */
    private renderEditableObjects(stageData: StageData): void {
        // プラットフォーム
        stageData.platforms.forEach(platform => {
            const line = ObjectFactory.createPlatform(
                { x: platform.x1, y: platform.y1 },
                { x: platform.x2, y: platform.y2 }
            );
            this.canvas.add(line);
        });

        // スパイク
        stageData.spikes.forEach(spike => {
            const triangle = ObjectFactory.createSpike({
                position: { x: spike.x, y: spike.y },
                size: { width: spike.width, height: spike.height }
            });
            this.canvas.add(triangle);
        });

        // ゴール
        const goal = ObjectFactory.createGoal({
            position: { x: stageData.goal.x, y: stageData.goal.y },
            size: { width: stageData.goal.width, height: stageData.goal.height }
        });
        this.canvas.add(goal);

        // テキスト要素
        const texts = [
            stageData.startText,
            stageData.goalText,
            stageData.leftEdgeMessage,
            stageData.leftEdgeSubMessage
        ].filter(Boolean) as TextElement[];

        texts.forEach(textElement => {
            const text = ObjectFactory.createText({
                position: { x: textElement.x, y: textElement.y },
                text: textElement.text
            });
            this.canvas.add(text);
        });
    }

    /**
     * ステージデータをエクスポート
     */
    public exportStageData(): StageData {
        return this.generateStageDataFromCanvas();
    }

    /**
     * キャンバスからステージデータを更新
     */
    public updateStageDataFromCanvas(): void {
        const newStageData = this.generateStageDataFromCanvas();
        this.callbacks.onStageModified?.(newStageData);
    }

    /**
     * キャンバスからステージデータを生成
     */
    private generateStageDataFromCanvas(): StageData {
        const objects = this.canvas.getObjects().filter(obj => 
            isFabricObjectWithData(obj) && !isGridObject(obj)
        );
        
        const platforms: Platform[] = [];
        const spikes: Spike[] = [];
        let goal: Goal = { x: 0, y: 0, width: 40, height: 50 };
        const texts: TextElement[] = [];

        objects.forEach(obj => {
            if (!isFabricObjectWithData(obj)) return;
            
            if (isPlatformObject(obj)) {
                const line = obj as unknown as fabric.Line;
                platforms.push({
                    x1: line.x1!,
                    y1: line.y1!,
                    x2: line.x2!,
                    y2: line.y2!
                });
            } else if (isSpikeObject(obj)) {
                const bounds = FabricHelper.getObjectBounds(obj);
                spikes.push({
                    x: bounds.left + bounds.width / 2,
                    y: bounds.top + bounds.height,
                    width: bounds.width,
                    height: bounds.height
                });
            } else if (isGoalObject(obj)) {
                const rect = obj as unknown as fabric.Rect;
                goal = {
                    x: rect.left!,
                    y: rect.top!,
                    width: rect.width!,
                    height: rect.height!
                };
            } else if (isTextObject(obj)) {
                const text = obj as unknown as fabric.Text;
                texts.push({
                    x: text.left!,
                    y: text.top!,
                    text: text.text!
                });
            }
        });

        return {
            id: this.stageData?.id || 1,
            name: this.stageData?.name || 'New Stage',
            platforms,
            spikes,
            goal,
            startText: texts[0] || { x: 50, y: 450, text: 'START' },
            goalText: texts[1] || { x: goal.x + 20, y: goal.y - 20, text: 'GOAL' }
        };
    }

    /**
     * エディター状態を取得
     */
    public getEditorState(): EditorState {
        return { ...this.editorState };
    }

    /**
     * 選択されたオブジェクトを取得
     */
    public getSelectedObject(): FabricObjectWithData | null {
        return this.editorState.selectedObject;
    }

    /**
     * オブジェクトをキャンバスに追加
     */
    public addObject(object: FabricObjectWithData): void {
        this.canvas.add(object);
        this.canvas.renderAll();
        this.updateStageDataFromCanvas();
        DebugHelper.log('Object added to canvas', { type: object.data?.type });
    }

    /**
     * オブジェクトを選択状態にする
     */
    public selectObject(object: FabricObjectWithData): void {
        this.canvas.setActiveObject(object);
        this.editorState.selectedObject = object;
        this.callbacks.onObjectSelected?.(object);
        this.canvas.renderAll();
        DebugHelper.log('Object selected', { type: object.data?.type });
    }

    /**
     * Fabric.jsキャンバスを取得
     */
    public getFabricCanvas(): fabric.Canvas {
        return this.canvas;
    }

    /**
     * スパイクを作成（API用）
     */
    public createSpike(x: number, y: number): void {
        this.placeObject(EDITOR_TOOLS.SPIKE, { x, y });
        this.updateStageDataFromCanvas();
    }

    /**
     * ゴールを作成（API用）
     */
    public createGoal(x: number, y: number): void {
        this.placeObject(EDITOR_TOOLS.GOAL, { x, y });
        this.updateStageDataFromCanvas();
    }

    /**
     * テキストを作成（API用）
     */
    public createText(x: number, y: number, text: string): void {
        const params: ObjectCreationParams = { 
            position: { x, y }, 
            text 
        };
        const textObject = ObjectFactory.createText(params);
        this.canvas.add(textObject);
        this.canvas.renderAll();
        this.updateStageDataFromCanvas();
    }

    /**
     * プラットフォーム描画開始（API用）
     */
    public startPlatformDrawing(x: number, y: number): void {
        this.startDrawingPlatform({ x, y });
    }

    /**
     * プラットフォーム描画終了（API用）
     */
    public finishPlatformDrawing(x: number, y: number): void {
        // 現在描画中のプラットフォームを更新してから完了
        this.updateDrawingPlatform({ x, y });
        this.finishDrawingPlatform();
        this.updateStageDataFromCanvas();
    }

    /**
     * シリアライズデータからプラットフォームを作成
     */
    public createPlatformFromData(data: any): FabricObjectWithData | null {
        try {
            const line = new fabric.Line([data.x1, data.y1, data.x2, data.y2], {
                stroke: EDITOR_CONFIG.COLORS.PLATFORM,
                strokeWidth: EDITOR_CONFIG.STROKE_WIDTH.PLATFORM,
                selectable: true
            });
            FabricHelper.setObjectData(line, { type: EDITOR_TOOLS.PLATFORM });
            return line as FabricObjectWithData;
        } catch (error) {
            DebugHelper.log('Failed to create platform from data', error);
            return null;
        }
    }

    /**
     * シリアライズデータからスパイクを作成
     */
    public createSpikeFromData(data: any): FabricObjectWithData | null {
        try {
            const spike = ObjectFactory.createSpike({
                position: { x: data.left, y: data.top },
                size: { width: data.width, height: data.height }
            });
            return spike;
        } catch (error) {
            DebugHelper.log('Failed to create spike from data', error);
            return null;
        }
    }

    /**
     * シリアライズデータからゴールを作成
     */
    public createGoalFromData(data: any): FabricObjectWithData | null {
        try {
            const goal = ObjectFactory.createGoal({
                position: { x: data.left, y: data.top },
                size: { width: data.width, height: data.height }
            });
            return goal;
        } catch (error) {
            DebugHelper.log('Failed to create goal from data', error);
            return null;
        }
    }

    /**
     * シリアライズデータからテキストを作成
     */
    public createTextFromData(data: any): FabricObjectWithData | null {
        try {
            const text = ObjectFactory.createText({
                position: { x: data.left, y: data.top },
                text: data.text || 'TEXT'
            });
            return text;
        } catch (error) {
            DebugHelper.log('Failed to create text from data', error);
            return null;
        }
    }
}