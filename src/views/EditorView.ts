import type * as fabric from 'fabric';
import type { IEditorController, IEditorView } from '../controllers/EditorController.js';
// エディターのView層 - UIの状態管理と表示制御
import type { StageData } from '../core/StageLoader.js';
import {
    EDITOR_CONFIG,
    EDITOR_TOOLS,
    type FabricObjectWithData,
    isValidEditorTool
} from '../types/EditorTypes.js';
import {
    DOMHelper,
    DebugHelper,
    EventHelper,
    FabricHelper,
    MathHelper
} from '../utils/EditorUtils.js';

/**
 * エディターのView層実装
 * - UI要素の管理と更新
 * - ユーザーインタラクションの処理
 * - 表示状態の制御
 */
export class EditorView implements IEditorView {
    private controller!: IEditorController;
    private canvas: HTMLCanvasElement;

    // UI要素（型安全な管理）
    private toolItems!: NodeListOf<Element>;
    private uiElements!: {
        // 表示系
        mouseCoords: HTMLElement;
        objectCount: HTMLElement;
        currentTool: HTMLElement;

        // アクション系
        deleteBtn: HTMLButtonElement;
        duplicateBtn: HTMLButtonElement;

        // ステージ情報系
        stageNameInput: HTMLInputElement;
        stageIdInput: HTMLInputElement;
        stageDescInput: HTMLTextAreaElement;

        // プロパティパネル系
        noSelectionDiv: HTMLElement;
        platformPropsDiv: HTMLElement;
        spikePropsDiv: HTMLElement;
        goalPropsDiv: HTMLElement;
        textPropsDiv: HTMLElement;

        // 設定系
        gridEnabledCheckbox: HTMLInputElement;
        snapEnabledCheckbox: HTMLInputElement;

        // メッセージ系
        messageContainer: HTMLElement;
    };

    // イベントハンドラー（最適化済み）
    private throttledMouseMove = EventHelper.throttle(
        (e: MouseEvent) => this.handleMouseMove(e),
        16
    );
    private debouncedStageInfoUpdate = EventHelper.debounce(
        () => this.updateStageInfoFromInputs(),
        300
    );

    // ステート
    private isInitialized = false;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        DebugHelper.log('EditorView constructed');
    }

    /**
     * コントローラーを設定
     */
    public setController(controller: IEditorController): void {
        this.controller = controller;
        DebugHelper.log('Controller set on EditorView');
    }

    /**
     * Viewを初期化
     */
    public initialize(): void {
        try {
            DebugHelper.time('EditorView.initialize', () => {
                this.initializeUIElements();
                this.setupEventListeners();
                this.initializePropertyPanels();
                this.showWelcomeMessage();
                this.isInitialized = true;
            });

            DebugHelper.log('EditorView initialized successfully');
        } catch (error) {
            DebugHelper.log('EditorView initialization failed', error);
            this.showErrorMessage('Failed to initialize editor interface');
        }
    }

    /**
     * UI要素を初期化
     */
    private initializeUIElements(): void {
        // ツールパレット要素
        this.toolItems = document.querySelectorAll('.tool-item');

        // メッセージコンテナの作成（存在しない場合）
        let messageContainer = DOMHelper.getOptionalElement('messageContainer');
        if (!messageContainer) {
            messageContainer = this.createMessageContainer();
        }

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
            snapEnabledCheckbox: DOMHelper.getRequiredElement<HTMLInputElement>('snapEnabled'),
            messageContainer
        };

        DebugHelper.log('UI elements initialized', {
            elementCount: Object.keys(this.uiElements).length,
            toolItemCount: this.toolItems.length
        });
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
    }

    private setupToolSelectionEvents(): void {
        DOMHelper.addEventListenersToNodeList(this.toolItems, 'click', (element) => {
            const tool = element.getAttribute('data-tool');
            if (tool && isValidEditorTool(tool)) {
                this.controller.selectTool(tool);
            }
        });
    }

    private setupToolbarEvents(): void {
        const toolbarActions = {
            newStageBtn: () => this.controller.createNewStage(),
            loadStageBtn: () => this.controller.loadStage(),
            saveStageBtn: () => this.controller.saveStage(),
            testStageBtn: () => this.controller.testStage(),
            clearStageBtn: () => this.controller.clearStage(),
            toggleGridBtn: () => this.controller.toggleGrid(),
            toggleSnapBtn: () => this.controller.toggleSnap()
        };

        for (const [id, handler] of Object.entries(toolbarActions)) {
            const element = DOMHelper.getOptionalElement(id);
            element?.addEventListener('click', handler);
        }
    }

    private setupObjectActionEvents(): void {
        this.uiElements.deleteBtn.addEventListener('click', () =>
            this.controller.deleteSelectedObject()
        );
        this.uiElements.duplicateBtn.addEventListener('click', () =>
            this.controller.duplicateSelectedObject()
        );
    }

    private setupSettingsEvents(): void {
        this.uiElements.gridEnabledCheckbox.addEventListener('change', () => {
            this.controller.toggleGrid();
        });

        this.uiElements.snapEnabledCheckbox.addEventListener('change', () => {
            this.controller.toggleSnap();
        });
    }

    private setupStageInfoEvents(): void {
        const stageInputs = [
            this.uiElements.stageNameInput,
            this.uiElements.stageIdInput,
            this.uiElements.stageDescInput
        ];
        
        for (const input of stageInputs) {
            input.addEventListener('input', this.debouncedStageInfoUpdate);
        }
    }

    private setupCanvasEvents(): void {
        this.canvas.addEventListener('mousemove', this.throttledMouseMove);
    }

    // === IEditorView インターフェース実装 ===

    /**
     * ツール選択状態を更新
     */
    public updateToolSelection(tool: string): void {
        if (!this.isInitialized) return;

        for (const item of this.toolItems) {
            item.classList.remove('active');
        }
        const selectedTool = document.querySelector(`[data-tool="${tool}"]`);
        selectedTool?.classList.add('active');

        DebugHelper.log('Tool selection updated in view', { tool });
    }

    /**
     * オブジェクト数を更新
     */
    public updateObjectCount(count: number): void {
        if (!this.isInitialized) return;

        this.uiElements.objectCount.textContent = count.toString();

        // オブジェクト数に応じた視覚的フィードバック
        this.uiElements.objectCount.className = count > 0 ? 'object-count active' : 'object-count';
    }

    /**
     * マウス座標を更新
     */
    public updateMouseCoordinates(x: number, y: number): void {
        if (!this.isInitialized) return;

        this.uiElements.mouseCoords.textContent = `${x}, ${y}`;
    }

    /**
     * 現在のツール表示を更新
     */
    public updateCurrentTool(tool: string): void {
        if (!this.isInitialized) return;

        this.uiElements.currentTool.textContent = tool.charAt(0).toUpperCase() + tool.slice(1);

        // ツールに応じたスタイル適用
        this.uiElements.currentTool.className = `current-tool tool-${tool}`;
    }

    /**
     * ステージ情報を更新
     */
    public updateStageInfo(stageData: StageData): void {
        if (!this.isInitialized) return;

        this.uiElements.stageNameInput.value = stageData.name;
        this.uiElements.stageIdInput.value = stageData.id.toString();
        this.uiElements.stageDescInput.value = '';

        DebugHelper.log('Stage info updated in view', {
            stageId: stageData.id,
            name: stageData.name
        });
    }

    /**
     * オブジェクトプロパティを表示
     */
    public showObjectProperties(object: FabricObjectWithData | null): void {
        if (!this.isInitialized) return;

        this.hideAllPropertyPanels();

        if (!object) {
            this.uiElements.noSelectionDiv.style.display = 'block';
            return;
        }

        const objectType = FabricHelper.getObjectType(object);
        this.showPropertyPanel(objectType, object);
    }

    /**
     * アクションボタンの有効/無効を制御
     */
    public enableActionButtons(enabled: boolean): void {
        if (!this.isInitialized) return;

        this.uiElements.deleteBtn.disabled = !enabled;
        this.uiElements.duplicateBtn.disabled = !enabled;

        // 視覚的フィードバック
        const className = enabled ? 'action-btn enabled' : 'action-btn disabled';
        this.uiElements.deleteBtn.className = className;
        this.uiElements.duplicateBtn.className = className;
    }

    /**
     * エラーメッセージを表示
     */
    public showErrorMessage(message: string): void {
        this.showMessage(message, 'error', 5000);
        DebugHelper.log('Error message shown', { message });
    }

    /**
     * 成功メッセージを表示
     */
    public showSuccessMessage(message: string): void {
        this.showMessage(message, 'success', 3000);
        DebugHelper.log('Success message shown', { message });
    }

    /**
     * リソースを解放
     */
    public dispose(): void {
        this.canvas.removeEventListener('mousemove', this.throttledMouseMove);
        this.isInitialized = false;
        DebugHelper.log('EditorView disposed');
    }

    // === プライベートメソッド ===

    /**
     * プロパティパネルを初期化
     */
    private initializePropertyPanels(): void {
        this.hideAllPropertyPanels();
        this.uiElements.noSelectionDiv.style.display = 'block';
    }

    /**
     * すべてのプロパティパネルを非表示
     */
    private hideAllPropertyPanels(): void {
        const propertyPanels = [
            this.uiElements.noSelectionDiv,
            this.uiElements.platformPropsDiv,
            this.uiElements.spikePropsDiv,
            this.uiElements.goalPropsDiv,
            this.uiElements.textPropsDiv
        ];
        
        for (const panel of propertyPanels) {
            panel.style.display = 'none';
        }
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
        if (!(line.x1 && line.y1 && line.x2 && line.y2)) return;

        const length = MathHelper.distance({ x: line.x1, y: line.y1 }, { x: line.x2, y: line.y2 });
        const angle = MathHelper.angle({ x: line.x1, y: line.y1 }, { x: line.x2, y: line.y2 });

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

        if (widthInput)
            widthInput.value = (rect.width || EDITOR_CONFIG.OBJECT_SIZES.GOAL.width).toString();
        if (heightInput)
            heightInput.value = (rect.height || EDITOR_CONFIG.OBJECT_SIZES.GOAL.height).toString();
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
     * マウス移動時の座標表示更新
     */
    private handleMouseMove(e: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);
        this.updateMouseCoordinates(x, y);
    }

    /**
     * ステージ情報の入力からの更新
     */
    private updateStageInfoFromInputs(): void {
        // TODO: コントローラーにステージ情報更新を通知
        DebugHelper.log('Stage info update requested from inputs');
    }

    /**
     * メッセージコンテナを作成
     */
    private createMessageContainer(): HTMLElement {
        const container = document.createElement('div');
        container.id = 'messageContainer';
        container.className = 'message-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 300px;
        `;
        document.body.appendChild(container);
        return container;
    }

    /**
     * メッセージを表示
     */
    private showMessage(
        message: string,
        type: 'success' | 'error' | 'info',
        duration = 3000
    ): void {
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 4px;
            font-size: 14px;
            line-height: 1.4;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease-out;
            background: ${type === 'error' ? '#ff4757' : type === 'success' ? '#2ed573' : '#3742fa'};
            color: white;
            cursor: pointer;
        `;

        // クリックで削除
        messageEl.addEventListener('click', () => {
            this.removeMessage(messageEl);
        });

        this.uiElements.messageContainer.appendChild(messageEl);

        // 自動削除
        setTimeout(() => {
            this.removeMessage(messageEl);
        }, duration);
    }

    /**
     * メッセージを削除
     */
    private removeMessage(messageEl: HTMLElement): void {
        if (messageEl.parentNode) {
            messageEl.style.animation = 'slideOutRight 0.3s ease-in forwards';
            // Use animationend event instead of setTimeout for better synchronization
            messageEl.addEventListener(
                'animationend',
                () => {
                    messageEl.remove();
                },
                { once: true }
            );
        }
    }

    /**
     * ウェルカムメッセージを表示
     */
    private showWelcomeMessage(): void {
        this.showMessage('🎮 Stage Editor ready! Press 1-5 to select tools.', 'info', 4000);
    }
}
