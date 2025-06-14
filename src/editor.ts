import * as fabric from 'fabric';
import { EditorRenderSystem, type EditorCallbacks } from './systems/EditorRenderSystem.js';
import { StageLoader, type StageData } from './core/StageLoader.js';
import {
    type FabricObjectWithData,
    type KeyboardEventHandler,
    EDITOR_TOOLS,
    KEYBOARD_SHORTCUTS,
    EDITOR_CONFIG,
    isValidEditorTool,
    EditorError
} from './types/EditorTypes.js';
import {
    DOMHelper,
    TypeHelper,
    FabricHelper,
    EventHelper,
    MathHelper,
    DebugHelper
} from './utils/EditorUtils.js';

/**
 * ステージエディターのメインコントローラークラス
 */
class StageEditor {
    private editorSystem!: EditorRenderSystem;
    private stageLoader: StageLoader;
    private currentStage: StageData | null = null;

    // UI Elements (型安全な取得)
    private canvas: HTMLCanvasElement;
    private toolItems!: NodeListOf<Element>;
    private uiElements!: {
        mouseCoords: HTMLElement;
        objectCount: HTMLElement;
        currentTool: HTMLElement;
        deleteBtn: HTMLButtonElement;
        duplicateBtn: HTMLButtonElement;
        stageNameInput: HTMLInputElement;
        stageIdInput: HTMLInputElement;
        stageDescInput: HTMLTextAreaElement;
        noSelectionDiv: HTMLElement;
        platformPropsDiv: HTMLElement;
        spikePropsDiv: HTMLElement;
        goalPropsDiv: HTMLElement;
        textPropsDiv: HTMLElement;
        gridEnabledCheckbox: HTMLInputElement;
        snapEnabledCheckbox: HTMLInputElement;
    };

    // イベントハンドラー（デバウンス処理済み）
    private debouncedUpdateStageInfo = EventHelper.debounce(() => this.updateStageInfo(), 300);
    private throttledMouseMove = EventHelper.throttle((e: MouseEvent) => this.handleMouseMove(e), 16);

    constructor() {
        try {
            this.canvas = DOMHelper.getRequiredElement<HTMLCanvasElement>('editorCanvas');
            this.stageLoader = new StageLoader();
            
            this.initializeUI();
            this.setupEditorSystem();
            this.setupEventListeners();
            this.updateUI();
            
            DebugHelper.log('StageEditor initialized successfully');
        } catch (error) {
            DebugHelper.log('Failed to initialize StageEditor', error);
            throw new EditorError(
                'Failed to initialize stage editor',
                'CANVAS_INIT_FAILED',
                { error }
            );
        }
    }

    /**
     * UI要素を初期化
     */
    private initializeUI(): void {
        // ツールパレット要素
        this.toolItems = document.querySelectorAll('.tool-item');

        // 必須UI要素を一括取得
        this.uiElements = {
            mouseCoords: DOMHelper.getRequiredElement('mouseCoords'),
            objectCount: DOMHelper.getRequiredElement('objectCount'),
            currentTool: DOMHelper.getRequiredElement('currentTool'),
            deleteBtn: DOMHelper.getRequiredElement<HTMLButtonElement>('deleteObjectBtn'),
            duplicateBtn: DOMHelper.getRequiredElement<HTMLButtonElement>('duplicateObjectBtn'),
            stageNameInput: DOMHelper.getRequiredElement<HTMLInputElement>('stageName'),
            stageIdInput: DOMHelper.getRequiredElement<HTMLInputElement>('stageId'),
            stageDescInput: DOMHelper.getRequiredElement<HTMLTextAreaElement>('stageDescription'),
            noSelectionDiv: DOMHelper.getRequiredElement('noSelection'),
            platformPropsDiv: DOMHelper.getRequiredElement('platformProperties'),
            spikePropsDiv: DOMHelper.getRequiredElement('spikeProperties'),
            goalPropsDiv: DOMHelper.getRequiredElement('goalProperties'),
            textPropsDiv: DOMHelper.getRequiredElement('textProperties'),
            gridEnabledCheckbox: DOMHelper.getRequiredElement<HTMLInputElement>('gridEnabled'),
            snapEnabledCheckbox: DOMHelper.getRequiredElement<HTMLInputElement>('snapEnabled')
        };

        DebugHelper.log('UI elements initialized', Object.keys(this.uiElements));
    }

    /**
     * エディターシステムを設定
     */
    private setupEditorSystem(): void {
        const callbacks: EditorCallbacks = {
            onObjectSelected: (object: FabricObjectWithData | null) => this.handleObjectSelection(object),
            onObjectModified: (object: FabricObjectWithData) => this.handleObjectModified(object),
            onStageModified: (stageData: StageData) => this.handleStageModified(stageData)
        };

        this.editorSystem = new EditorRenderSystem(this.canvas, callbacks);
        this.createNewStage();
    }

    /**
     * イベントリスナーを設定
     */
    private setupEventListeners(): void {
        this.setupToolSelectionEvents();
        this.setupToolbarEvents();
        this.setupObjectActionEvents();
        this.setupSettingsEvents();
        this.setupStageInfoEvents();
        this.setupCanvasEvents();
        this.setupKeyboardEvents();
    }

    private setupToolSelectionEvents(): void {
        DOMHelper.addEventListenersToNodeList(
            this.toolItems,
            'click',
            (element) => {
                const tool = element.getAttribute('data-tool');
                if (tool && isValidEditorTool(tool)) {
                    this.selectTool(tool);
                }
            }
        );
    }

    private setupToolbarEvents(): void {
        const toolbarActions = {
            'newStageBtn': () => this.createNewStage(),
            'loadStageBtn': () => this.loadStage(),
            'saveStageBtn': () => this.saveStage(),
            'testStageBtn': () => this.testStage(),
            'clearStageBtn': () => this.clearStage(),
            'toggleGridBtn': () => this.toggleGrid(),
            'toggleSnapBtn': () => this.toggleSnap()
        };

        Object.entries(toolbarActions).forEach(([id, handler]) => {
            const element = DOMHelper.getOptionalElement(id);
            element?.addEventListener('click', handler);
        });
    }

    private setupObjectActionEvents(): void {
        this.uiElements.deleteBtn.addEventListener('click', () => this.deleteSelectedObject());
        this.uiElements.duplicateBtn.addEventListener('click', () => this.duplicateSelectedObject());
    }

    private setupSettingsEvents(): void {
        this.uiElements.gridEnabledCheckbox.addEventListener('change', () => {
            this.editorSystem.toggleGrid();
        });
        
        this.uiElements.snapEnabledCheckbox.addEventListener('change', () => {
            this.editorSystem.toggleSnapToGrid();
        });
    }

    private setupStageInfoEvents(): void {
        [this.uiElements.stageNameInput, this.uiElements.stageIdInput, this.uiElements.stageDescInput]
            .forEach(input => {
                input.addEventListener('input', this.debouncedUpdateStageInfo);
            });
    }

    private setupCanvasEvents(): void {
        this.canvas.addEventListener('mousemove', this.throttledMouseMove);
    }

    private setupKeyboardEvents(): void {
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
    }

    /**
     * ツール選択処理
     */
    private selectTool(tool: string): void {
        if (!isValidEditorTool(tool)) {
            DebugHelper.log('Invalid tool selected', { tool });
            return;
        }

        // UI更新
        this.toolItems.forEach(item => item.classList.remove('active'));
        const selectedTool = document.querySelector(`[data-tool="${tool}"]`);
        selectedTool?.classList.add('active');
        
        // エディターシステム更新
        this.editorSystem.setSelectedTool(tool);
        this.uiElements.currentTool.textContent = tool.charAt(0).toUpperCase() + tool.slice(1);
        
        DebugHelper.log('Tool selected', { tool });
    }

    /**
     * オブジェクト選択時の処理
     */
    private handleObjectSelection(object: FabricObjectWithData | null): void {
        // アクションボタン状態更新
        this.uiElements.deleteBtn.disabled = !object;
        this.uiElements.duplicateBtn.disabled = !object;

        // プロパティパネル表示制御
        this.hideAllPropertyPanels();
        
        if (!object) {
            this.uiElements.noSelectionDiv.style.display = 'block';
            return;
        }

        const objectType = FabricHelper.getObjectType(object);
        this.showPropertyPanel(objectType, object);
    }

    /**
     * すべてのプロパティパネルを非表示
     */
    private hideAllPropertyPanels(): void {
        [
            this.uiElements.noSelectionDiv,
            this.uiElements.platformPropsDiv,
            this.uiElements.spikePropsDiv,
            this.uiElements.goalPropsDiv,
            this.uiElements.textPropsDiv
        ].forEach(panel => {
            panel.style.display = 'none';
        });
    }

    /**
     * 指定タイプのプロパティパネルを表示
     */
    private showPropertyPanel(objectType: string | null, object: FabricObjectWithData): void {
        switch (objectType) {
            case EDITOR_TOOLS.PLATFORM:
                this.uiElements.platformPropsDiv.style.display = 'block';
                this.loadPlatformProperties(object);
                break;
            case EDITOR_TOOLS.SPIKE:
                this.uiElements.spikePropsDiv.style.display = 'block';
                this.loadSpikeProperties(object);
                break;
            case EDITOR_TOOLS.GOAL:
                this.uiElements.goalPropsDiv.style.display = 'block';
                this.loadGoalProperties(object);
                break;
            case EDITOR_TOOLS.TEXT:
                this.uiElements.textPropsDiv.style.display = 'block';
                this.loadTextProperties(object);
                break;
            default:
                this.uiElements.noSelectionDiv.style.display = 'block';
        }
    }

    /**
     * プラットフォームプロパティを読み込み
     */
    private loadPlatformProperties(platform: FabricObjectWithData): void {
        const line = platform as unknown as fabric.Line;
        if (!line.x1 || !line.y1 || !line.x2 || !line.y2) return;

        const length = MathHelper.distance(
            { x: line.x1, y: line.y1 },
            { x: line.x2, y: line.y2 }
        );
        const angle = MathHelper.angle(
            { x: line.x1, y: line.y1 },
            { x: line.x2, y: line.y2 }
        );
        
        const lengthInput = DOMHelper.getOptionalElement<HTMLInputElement>('platformLength');
        const angleInput = DOMHelper.getOptionalElement<HTMLInputElement>('platformAngle');
        
        if (lengthInput) lengthInput.value = Math.round(length).toString();
        if (angleInput) angleInput.value = angle.toFixed(1);
    }

    /**
     * スパイクプロパティを読み込み
     */
    private loadSpikeProperties(spike: FabricObjectWithData): void {
        const bounds = FabricHelper.getObjectBounds(spike);
        const sizeInput = DOMHelper.getOptionalElement<HTMLInputElement>('spikeSize');
        if (sizeInput) sizeInput.value = bounds.width.toString();
    }

    /**
     * ゴールプロパティを読み込み
     */
    private loadGoalProperties(goal: FabricObjectWithData): void {
        const rect = goal as unknown as fabric.Rect;
        const widthInput = DOMHelper.getOptionalElement<HTMLInputElement>('goalWidth');
        const heightInput = DOMHelper.getOptionalElement<HTMLInputElement>('goalHeight');
        
        if (widthInput) widthInput.value = (rect.width || EDITOR_CONFIG.OBJECT_SIZES.GOAL.width).toString();
        if (heightInput) heightInput.value = (rect.height || EDITOR_CONFIG.OBJECT_SIZES.GOAL.height).toString();
    }

    /**
     * テキストプロパティを読み込み
     */
    private loadTextProperties(text: FabricObjectWithData): void {
        const textObj = text as unknown as fabric.Text;
        const contentInput = DOMHelper.getOptionalElement<HTMLInputElement>('textContent');
        const sizeInput = DOMHelper.getOptionalElement<HTMLInputElement>('textSize');
        
        if (contentInput) contentInput.value = textObj.text || '';
        if (sizeInput) sizeInput.value = (textObj.fontSize || 16).toString();
    }

    /**
     * オブジェクト変更時の処理
     */
    private handleObjectModified(object: FabricObjectWithData): void {
        this.updateObjectCount();
        DebugHelper.log('Object modified', { type: FabricHelper.getObjectType(object) });
    }

    /**
     * ステージ変更時の処理
     */
    private handleStageModified(stageData: StageData): void {
        this.currentStage = stageData;
        this.updateObjectCount();
        DebugHelper.log('Stage modified', { objectCount: this.getObjectCount(stageData) });
    }

    /**
     * オブジェクト数を更新
     */
    private updateObjectCount(): void {
        if (!this.currentStage) return;
        
        const count = this.getObjectCount(this.currentStage);
        this.uiElements.objectCount.textContent = count.toString();
    }

    private getObjectCount(stageData: StageData): number {
        return stageData.platforms.length + stageData.spikes.length + 1; // +1 for goal
    }

    /**
     * マウス移動時の座標表示更新
     */
    private handleMouseMove(e: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);
        this.uiElements.mouseCoords.textContent = `${x}, ${y}`;
    }

    /**
     * 新しいステージを作成
     */
    private createNewStage(): void {
        const newStage: StageData = {
            id: 1,
            name: 'New Stage',
            platforms: [],
            spikes: [],
            goal: { x: 400, y: 300, width: 40, height: 50 },
            startText: { x: 50, y: 450, text: 'START' },
            goalText: { x: 420, y: 280, text: 'GOAL' }
        };

        this.currentStage = newStage;
        this.editorSystem.loadStageForEditing(newStage);
        this.updateStageInfoUI();
        this.updateUI();
        
        DebugHelper.log('New stage created');
    }

    /**
     * ステージを読み込み
     */
    private async loadStage(): Promise<void> {
        try {
            const stageIdStr = prompt('Enter stage ID to load:');
            if (!stageIdStr) return;
            
            const stageId = TypeHelper.safeParseInt(stageIdStr, 1);
            const stageData = await this.stageLoader.loadStage(stageId);
            
            this.currentStage = stageData;
            this.editorSystem.loadStageForEditing(stageData);
            this.updateStageInfoUI();
            this.updateUI();
            
            DebugHelper.log('Stage loaded successfully', { stageId: stageData.id });
        } catch (error) {
            DebugHelper.log('Failed to load stage', error);
            alert('Failed to load stage: ' + error);
        }
    }

    /**
     * ステージを保存
     */
    private saveStage(): void {
        if (!this.currentStage) return;

        const stageData = this.editorSystem.exportStageData();
        
        // ステージ情報をUIから更新
        stageData.name = this.uiElements.stageNameInput.value;
        stageData.id = TypeHelper.safeParseInt(this.uiElements.stageIdInput.value, 1);

        this.downloadStageAsJson(stageData);
        DebugHelper.log('Stage saved', { stageId: stageData.id, name: stageData.name });
    }

    /**
     * ステージをJSONファイルとしてダウンロード
     */
    private downloadStageAsJson(stageData: StageData): void {
        const json = JSON.stringify(stageData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `stage${stageData.id}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * ステージをテスト
     */
    private testStage(): void {
        if (!this.currentStage) return;

        const stageData = this.editorSystem.exportStageData();
        const json = JSON.stringify(stageData);
        
        // localStorageに保存してゲームページで読み込み
        localStorage.setItem('testStage', json);
        window.open('/index.html?test=true', '_blank');
        
        DebugHelper.log('Stage testing started', { stageId: stageData.id });
    }

    /**
     * ステージをクリア
     */
    private clearStage(): void {
        if (confirm('Are you sure you want to clear all objects?')) {
            this.createNewStage();
            DebugHelper.log('Stage cleared');
        }
    }

    /**
     * グリッド表示切り替え
     */
    private toggleGrid(): void {
        this.editorSystem.toggleGrid();
        this.uiElements.gridEnabledCheckbox.checked = !this.uiElements.gridEnabledCheckbox.checked;
    }

    /**
     * スナップ機能切り替え
     */
    private toggleSnap(): void {
        this.editorSystem.toggleSnapToGrid();
        this.uiElements.snapEnabledCheckbox.checked = !this.uiElements.snapEnabledCheckbox.checked;
    }

    /**
     * 選択オブジェクトを削除
     */
    private deleteSelectedObject(): void {
        this.editorSystem.deleteSelectedObject();
        DebugHelper.log('Selected object deleted');
    }

    /**
     * 選択オブジェクトを複製（未実装）
     */
    private duplicateSelectedObject(): void {
        // TODO: 複製機能の実装
        DebugHelper.log('Duplicate function not implemented yet');
        console.log('Duplicate function not implemented yet');
    }

    /**
     * ステージ情報を更新
     */
    private updateStageInfo(): void {
        if (!this.currentStage) return;
        
        this.currentStage.name = this.uiElements.stageNameInput.value;
        this.currentStage.id = TypeHelper.safeParseInt(this.uiElements.stageIdInput.value, this.currentStage.id);
    }

    /**
     * ステージ情報UIを更新
     */
    private updateStageInfoUI(): void {
        if (!this.currentStage) return;

        this.uiElements.stageNameInput.value = this.currentStage.name;
        this.uiElements.stageIdInput.value = this.currentStage.id.toString();
        this.uiElements.stageDescInput.value = (this.currentStage as any).description || '';
    }

    /**
     * UI全体を更新
     */
    private updateUI(): void {
        this.updateObjectCount();
        this.handleObjectSelection(null);
    }

    /**
     * キーボードイベント処理
     */
    private handleKeyboard: KeyboardEventHandler = (e) => {
        const normalizedKey = EventHelper.normalizeKeyboardEvent(e);
        
        // ツールショートカット
        const toolShortcut = KEYBOARD_SHORTCUTS.TOOLS[e.key as keyof typeof KEYBOARD_SHORTCUTS.TOOLS];
        if (toolShortcut) {
            this.selectTool(toolShortcut);
            return;
        }
        
        // アクションショートカット
        switch (normalizedKey) {
            case 'Delete':
            case 'Backspace':
                this.deleteSelectedObject();
                e.preventDefault();
                break;
            case 'Ctrl+KeyG':
            case 'Cmd+KeyG':
                this.toggleGrid();
                e.preventDefault();
                break;
            case 'Ctrl+KeyS':
            case 'Cmd+KeyS':
                this.saveStage();
                e.preventDefault();
                break;
        }
    };
}

// エディターの初期化
document.addEventListener('DOMContentLoaded', () => {
    try {
        new StageEditor();
        console.log('🎮 Stage Editor initialized successfully!');
    } catch (error) {
        console.error('❌ Failed to initialize Stage Editor:', error);
    }
});