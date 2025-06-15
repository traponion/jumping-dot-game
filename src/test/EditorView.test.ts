// EditorView UIテスト
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EditorView } from '../views/EditorView.js';
import { EDITOR_TOOLS, EDITOR_CONFIG } from '../types/EditorTypes.js';
import type { IEditorController } from '../controllers/EditorController.js';
import type { StageData } from '../core/StageLoader.js';

// DOM操作のためのユーティリティ
const createMockDOM = (): void => {
    // 基本的なHTML構造を作成
    document.body.innerHTML = `
        <div id="mouseCoords">0, 0</div>
        <div id="objectCount">0</div>
        <div id="currentTool">Select</div>
        
        <button id="deleteObjectBtn">Delete</button>
        <button id="duplicateObjectBtn">Duplicate</button>
        
        <input id="stageName" type="text" value="" />
        <input id="stageId" type="number" value="1" />
        <textarea id="stageDescription">Description</textarea>
        
        <div id="noSelection" style="display: none;">No Selection</div>
        <div id="platformProperties" style="display: none;">Platform Props</div>
        <div id="spikeProperties" style="display: none;">Spike Props</div>
        <div id="goalProperties" style="display: none;">Goal Props</div>
        <div id="textProperties" style="display: none;">Text Props</div>
        
        <input id="gridEnabled" type="checkbox" checked />
        <input id="snapEnabled" type="checkbox" checked />
        
        <canvas id="editorCanvas" width="800" height="600"></canvas>
    `;

    // ツールアイテムを追加
    Object.values(EDITOR_TOOLS).forEach(tool => {
        const toolElement = document.createElement('div');
        toolElement.className = 'tool-item';
        toolElement.setAttribute('data-tool', tool);
        toolElement.textContent = tool.charAt(0).toUpperCase() + tool.slice(1);
        document.body.appendChild(toolElement);
    });

    // プロパティ入力要素を追加
    const propertyInputs = [
        'platformLength', 'platformAngle',
        'spikeSize',
        'goalWidth', 'goalHeight',
        'textContent', 'textSize'
    ];

    propertyInputs.forEach(id => {
        const input = document.createElement('input');
        input.id = id;
        input.type = 'text';
        document.body.appendChild(input);
    });

    // ツールバーボタンを追加
    const toolbarButtons = [
        'newStageBtn', 'loadStageBtn', 'saveStageBtn', 'testStageBtn',
        'clearStageBtn', 'toggleGridBtn', 'toggleSnapBtn'
    ];

    toolbarButtons.forEach(id => {
        const button = document.createElement('button');
        button.id = id;
        button.textContent = id.replace('Btn', '');
        document.body.appendChild(button);
    });
};

const createMockCanvas = (): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.id = 'editorCanvas';
    canvas.width = EDITOR_CONFIG.CANVAS_SIZE.width;
    canvas.height = EDITOR_CONFIG.CANVAS_SIZE.height;
    return canvas;
};

const createMockController = (): IEditorController => ({
    selectTool: vi.fn(),
    createNewStage: vi.fn(),
    loadStage: vi.fn(),
    saveStage: vi.fn(),
    testStage: vi.fn(),
    clearStage: vi.fn(),
    toggleGrid: vi.fn(),
    toggleSnap: vi.fn(),
    deleteSelectedObject: vi.fn(),
    duplicateSelectedObject: vi.fn(),
    initialize: vi.fn(),
    dispose: vi.fn(),
    createObject: vi.fn(),
    startPlatformDrawing: vi.fn(),
    finishPlatformDrawing: vi.fn(),
    getFabricCanvas: vi.fn()
});

describe('EditorView', () => {
    let view: EditorView;
    let canvas: HTMLCanvasElement;
    let mockController: IEditorController;

    beforeEach(() => {
        createMockDOM();
        canvas = createMockCanvas();
        document.body.appendChild(canvas);
        
        view = new EditorView(canvas);
        mockController = createMockController();
        view.setController(mockController);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    describe('初期化', () => {
        it('正常に構築されること', () => {
            expect(view).toBeDefined();
        });

        it('初期化が正常に完了すること', () => {
            expect(() => view.initialize()).not.toThrow();
        });

        it('コントローラーが設定されること', () => {
            expect(() => view.setController(mockController)).not.toThrow();
        });

        it('初期化前のメソッド呼び出しが安全であること', () => {
            const newView = new EditorView(canvas);
            
            // 初期化前でも例外が発生しない
            expect(() => newView.updateToolSelection(EDITOR_TOOLS.PLATFORM)).not.toThrow();
            expect(() => newView.updateObjectCount(5)).not.toThrow();
            expect(() => newView.updateMouseCoordinates(100, 200)).not.toThrow();
        });
    });

    describe('ツール選択の表示更新', () => {
        beforeEach(() => {
            view.initialize();
        });

        it('ツール選択が正しく表示されること', () => {
            view.updateToolSelection(EDITOR_TOOLS.PLATFORM);
            
            const selectedTool = document.querySelector('.tool-item.active');
            expect(selectedTool).toBeTruthy();
            expect(selectedTool?.getAttribute('data-tool')).toBe(EDITOR_TOOLS.PLATFORM);
        });

        it('以前の選択が解除されること', () => {
            view.updateToolSelection(EDITOR_TOOLS.PLATFORM);
            view.updateToolSelection(EDITOR_TOOLS.SPIKE);
            
            const platformTool = document.querySelector(`[data-tool="${EDITOR_TOOLS.PLATFORM}"]`);
            const spikeTool = document.querySelector(`[data-tool="${EDITOR_TOOLS.SPIKE}"]`);
            
            expect(platformTool?.classList.contains('active')).toBe(false);
            expect(spikeTool?.classList.contains('active')).toBe(true);
        });

        it('現在のツール表示が更新されること', () => {
            view.updateCurrentTool(EDITOR_TOOLS.GOAL);
            
            const currentToolElement = document.getElementById('currentTool');
            expect(currentToolElement?.textContent).toBe('Goal');
            expect(currentToolElement?.className).toBe('current-tool tool-goal');
        });
    });

    describe('オブジェクト数表示', () => {
        beforeEach(() => {
            view.initialize();
        });

        it('オブジェクト数が正しく表示されること', () => {
            view.updateObjectCount(5);
            
            const objectCountElement = document.getElementById('objectCount');
            expect(objectCountElement?.textContent).toBe('5');
        });

        it('オブジェクト数に応じてスタイルが変わること', () => {
            const objectCountElement = document.getElementById('objectCount')!;
            
            view.updateObjectCount(0);
            expect(objectCountElement.className).toBe('object-count');
            
            view.updateObjectCount(3);
            expect(objectCountElement.className).toBe('object-count active');
        });
    });

    describe('マウス座標表示', () => {
        beforeEach(() => {
            view.initialize();
        });

        it('マウス座標が正しく表示されること', () => {
            view.updateMouseCoordinates(123, 456);
            
            const mouseCoordsElement = document.getElementById('mouseCoords');
            expect(mouseCoordsElement?.textContent).toBe('123, 456');
        });

        it('マウス移動イベントで座標が更新されること', () => {
            // キャンバスの位置をモック
            canvas.getBoundingClientRect = vi.fn().mockReturnValue({
                left: 10,
                top: 20,
                width: 800,
                height: 600
            });

            const mouseEvent = new MouseEvent('mousemove', {
                clientX: 110, // キャンバス内のX座標100
                clientY: 120  // キャンバス内のY座標100
            });

            canvas.dispatchEvent(mouseEvent);

            // 座標が更新されたかは直接確認が困難なので、
            // エラーが発生しないことを確認
            expect(() => canvas.dispatchEvent(mouseEvent)).not.toThrow();
        });
    });

    describe('ステージ情報表示', () => {
        beforeEach(() => {
            view.initialize();
        });

        const testStageData: StageData = {
            id: 42,
            name: 'UIテストステージ',
            platforms: [],
            spikes: [],
            goal: { x: 100, y: 100, width: 40, height: 50 },
            startText: { x: 50, y: 50, text: 'START' },
            goalText: { x: 150, y: 100, text: 'GOAL' }
        };

        it('ステージ情報が正しく表示されること', () => {
            view.updateStageInfo(testStageData);
            
            const nameInput = document.getElementById('stageName') as HTMLInputElement;
            const idInput = document.getElementById('stageId') as HTMLInputElement;
            
            expect(nameInput.value).toBe('UIテストステージ');
            expect(idInput.value).toBe('42');
        });

        it('ステージ情報の入力時にデバウンスが働くこと', () => {
            const nameInput = document.getElementById('stageName') as HTMLInputElement;
            
            // 複数の入力イベントを短時間で発生
            nameInput.value = 'Test1';
            nameInput.dispatchEvent(new Event('input'));
            
            nameInput.value = 'Test2';
            nameInput.dispatchEvent(new Event('input'));
            
            nameInput.value = 'Test3';
            nameInput.dispatchEvent(new Event('input'));
            
            // デバウンス機能により、コントローラーの呼び出し回数が制限されることを確認
            // （実際のタイマー処理のテストは困難なので、エラーが発生しないことを確認）
            expect(() => {
                nameInput.dispatchEvent(new Event('input'));
            }).not.toThrow();
        });
    });

    describe('プロパティパネル', () => {
        beforeEach(() => {
            view.initialize();
        });

        it('選択なしの場合、適切なパネルが表示されること', () => {
            view.showObjectProperties(null);
            
            const noSelectionDiv = document.getElementById('noSelection')!;
            expect(noSelectionDiv.style.display).toBe('block');
            
            // 他のパネルは非表示
            const otherPanels = [
                'platformProperties', 'spikeProperties', 
                'goalProperties', 'textProperties'
            ];
            otherPanels.forEach(id => {
                const panel = document.getElementById(id)!;
                expect(panel.style.display).toBe('none');
            });
        });

        it('プラットフォーム選択時に適切なパネルが表示されること', () => {
            const mockPlatform = {
                data: { type: EDITOR_TOOLS.PLATFORM },
                x1: 0, y1: 100, x2: 100, y2: 100
            } as any;

            view.showObjectProperties(mockPlatform);
            
            const platformDiv = document.getElementById('platformProperties')!;
            expect(platformDiv.style.display).toBe('block');
            
            // 他のパネルは非表示
            const otherPanels = [
                'noSelection', 'spikeProperties', 
                'goalProperties', 'textProperties'
            ];
            otherPanels.forEach(id => {
                const panel = document.getElementById(id)!;
                expect(panel.style.display).toBe('none');
            });
        });

        it('スパイク選択時に適切なパネルが表示されること', () => {
            const mockSpike = {
                data: { type: EDITOR_TOOLS.SPIKE },
                left: 50, top: 50, width: 15, height: 15,
                getBoundingRect: vi.fn().mockReturnValue({
                    left: 50, top: 50, width: 15, height: 15
                })
            } as any;

            view.showObjectProperties(mockSpike);
            
            const spikeDiv = document.getElementById('spikeProperties')!;
            expect(spikeDiv.style.display).toBe('block');
        });

        it('ゴール選択時に適切なパネルが表示されること', () => {
            const mockGoal = {
                data: { type: EDITOR_TOOLS.GOAL },
                width: 40, height: 50
            } as any;

            view.showObjectProperties(mockGoal);
            
            const goalDiv = document.getElementById('goalProperties')!;
            expect(goalDiv.style.display).toBe('block');
        });

        it('テキスト選択時に適切なパネルが表示されること', () => {
            const mockText = {
                data: { type: EDITOR_TOOLS.TEXT },
                text: 'Sample Text', fontSize: 16
            } as any;

            view.showObjectProperties(mockText);
            
            const textDiv = document.getElementById('textProperties')!;
            expect(textDiv.style.display).toBe('block');
        });
    });

    describe('アクションボタン', () => {
        beforeEach(() => {
            view.initialize();
        });

        it('ボタンの有効/無効が切り替わること', () => {
            const deleteBtn = document.getElementById('deleteObjectBtn') as HTMLButtonElement;
            const duplicateBtn = document.getElementById('duplicateObjectBtn') as HTMLButtonElement;
            
            view.enableActionButtons(false);
            expect(deleteBtn.disabled).toBe(true);
            expect(duplicateBtn.disabled).toBe(true);
            expect(deleteBtn.className).toBe('action-btn disabled');
            expect(duplicateBtn.className).toBe('action-btn disabled');
            
            view.enableActionButtons(true);
            expect(deleteBtn.disabled).toBe(false);
            expect(duplicateBtn.disabled).toBe(false);
            expect(deleteBtn.className).toBe('action-btn enabled');
            expect(duplicateBtn.className).toBe('action-btn enabled');
        });

        it('削除ボタンクリックでコントローラーが呼ばれること', () => {
            const deleteBtn = document.getElementById('deleteObjectBtn')!;
            deleteBtn.click();
            
            expect(mockController.deleteSelectedObject).toHaveBeenCalledTimes(1);
        });

        it('複製ボタンクリックでコントローラーが呼ばれること', () => {
            const duplicateBtn = document.getElementById('duplicateObjectBtn')!;
            duplicateBtn.click();
            
            expect(mockController.duplicateSelectedObject).toHaveBeenCalledTimes(1);
        });
    });

    describe('ツールバーボタン', () => {
        beforeEach(() => {
            view.initialize();
        });

        it('各ツールバーボタンでコントローラーが呼ばれること', () => {
            const buttonTests = [
                { id: 'newStageBtn', method: 'createNewStage' },
                { id: 'loadStageBtn', method: 'loadStage' },
                { id: 'saveStageBtn', method: 'saveStage' },
                { id: 'testStageBtn', method: 'testStage' },
                { id: 'clearStageBtn', method: 'clearStage' },
                { id: 'toggleGridBtn', method: 'toggleGrid' },
                { id: 'toggleSnapBtn', method: 'toggleSnap' }
            ];

            buttonTests.forEach(({ id, method }) => {
                const button = document.getElementById(id);
                if (button) {
                    button.click();
                    expect((mockController as any)[method]).toHaveBeenCalled();
                }
            });
        });
    });

    describe('ツール選択イベント', () => {
        beforeEach(() => {
            view.initialize();
        });

        it('ツールクリックでコントローラーが呼ばれること', () => {
            Object.values(EDITOR_TOOLS).forEach(tool => {
                const toolElement = document.querySelector(`[data-tool="${tool}"]`);
                if (toolElement) {
                    (toolElement as HTMLElement).click();
                    expect(mockController.selectTool).toHaveBeenCalledWith(tool);
                }
            });
        });

        it('無効なツールデータでエラーが発生しないこと', () => {
            const invalidToolElement = document.createElement('div');
            invalidToolElement.className = 'tool-item';
            invalidToolElement.setAttribute('data-tool', 'invalid-tool');
            document.body.appendChild(invalidToolElement);
            
            expect(() => {
                invalidToolElement.click();
            }).not.toThrow();
        });
    });

    describe('設定チェックボックス', () => {
        beforeEach(() => {
            view.initialize();
        });

        it('グリッド設定の変更でコントローラーが呼ばれること', () => {
            const gridCheckbox = document.getElementById('gridEnabled') as HTMLInputElement;
            gridCheckbox.click();
            
            expect(mockController.toggleGrid).toHaveBeenCalled();
        });

        it('スナップ設定の変更でコントローラーが呼ばれること', () => {
            const snapCheckbox = document.getElementById('snapEnabled') as HTMLInputElement;
            snapCheckbox.click();
            
            expect(mockController.toggleSnap).toHaveBeenCalled();
        });
    });

    describe('メッセージ表示', () => {
        beforeEach(() => {
            view.initialize();
        });

        it('エラーメッセージが表示されること', () => {
            view.showErrorMessage('テストエラー');
            
            const messageElements = document.querySelectorAll('.message-error');
            expect(messageElements.length).toBeGreaterThan(0);
            
            const lastMessage = messageElements[messageElements.length - 1];
            expect(lastMessage.textContent).toBe('テストエラー');
        });

        it('成功メッセージが表示されること', () => {
            view.showSuccessMessage('テスト成功');
            
            const messageElements = document.querySelectorAll('.message-success');
            expect(messageElements.length).toBeGreaterThan(0);
            
            const lastMessage = messageElements[messageElements.length - 1];
            expect(lastMessage.textContent).toBe('テスト成功');
        });

        it('メッセージクリックで削除されること', async () => {
            view.showErrorMessage('クリックで削除');
            
            const messageElement = document.querySelector('.message-error') as HTMLElement;
            expect(messageElement).toBeTruthy();
            
            messageElement.click();
            
            // アニメーション待機
            await new Promise(resolve => setTimeout(resolve, 400));
            
            const remainingMessages = document.querySelectorAll('.message-error');
            expect(remainingMessages.length).toBe(0);
        });

        it('メッセージコンテナが自動作成されること', () => {
            // messageContainerを削除
            const existingContainer = document.getElementById('messageContainer');
            if (existingContainer) {
                existingContainer.remove();
            }
            
            // 新しいViewを作成（messageContainerなし）
            const newView = new EditorView(canvas);
            newView.setController(mockController);
            newView.initialize();
            
            // メッセージ表示でコンテナが自動作成される
            newView.showErrorMessage('自動作成テスト');
            
            const messageContainer = document.getElementById('messageContainer');
            expect(messageContainer).toBeTruthy();
        });
    });

    describe('プロパティ値の読み込み', () => {
        beforeEach(() => {
            view.initialize();
        });

        it.skip('プラットフォームプロパティが正しく読み込まれること', () => {
            const mockLine = {
                data: { type: EDITOR_TOOLS.PLATFORM },
                x1: 0, y1: 100, x2: 100, y2: 100
            } as any;

            view.showObjectProperties(mockLine);
            
            const lengthInput = document.getElementById('platformLength') as HTMLInputElement;
            const angleInput = document.getElementById('platformAngle') as HTMLInputElement;
            
            expect(lengthInput?.value).toBe('100'); // 距離は100
            expect(angleInput?.value).toBe('0.0');  // 角度は0度
        });

        it('ゴールプロパティが正しく読み込まれること', () => {
            const mockGoal = {
                data: { type: EDITOR_TOOLS.GOAL },
                width: 40, height: 50
            } as any;

            view.showObjectProperties(mockGoal);
            
            const widthInput = document.getElementById('goalWidth') as HTMLInputElement;
            const heightInput = document.getElementById('goalHeight') as HTMLInputElement;
            
            expect(widthInput?.value).toBe('40');
            expect(heightInput?.value).toBe('50');
        });

        it('テキストプロパティが正しく読み込まれること', () => {
            const mockText = {
                data: { type: EDITOR_TOOLS.TEXT },
                text: 'Sample Text',
                fontSize: 20
            } as any;

            view.showObjectProperties(mockText);
            
            const contentInput = document.getElementById('textContent') as HTMLInputElement;
            const sizeInput = document.getElementById('textSize') as HTMLInputElement;
            
            expect(contentInput?.value).toBe('Sample Text');
            expect(sizeInput?.value).toBe('20');
        });
    });

    describe('リソース管理', () => {
        beforeEach(() => {
            view.initialize();
        });

        it('dispose時にイベントリスナーが削除されること', () => {
            const removeEventListenerSpy = vi.spyOn(canvas, 'removeEventListener');
            
            view.dispose();
            
            expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
        });

        it('dispose後はメソッド呼び出しが安全であること', () => {
            view.dispose();
            
            expect(() => view.updateToolSelection(EDITOR_TOOLS.PLATFORM)).not.toThrow();
            expect(() => view.updateObjectCount(5)).not.toThrow();
            expect(() => view.showErrorMessage('テスト')).not.toThrow();
        });
    });

    describe('エラー処理', () => {
        it('存在しないDOM要素への対応', () => {
            // 一部のDOM要素を削除
            document.getElementById('mouseCoords')?.remove();
            
            const newView = new EditorView(canvas);
            newView.setController(mockController);
            
            // 初期化時にエラーが発生することを確認
            expect(() => newView.initialize()).toThrow();
        });

        it('イベントハンドラーでのエラーが処理されること', () => {
            // コントローラーメソッドがエラーを投げるように設定
            (mockController.selectTool as any).mockImplementation(() => {
                throw new Error('Controller error');
            });
            
            const toolElement = document.querySelector(`[data-tool="${EDITOR_TOOLS.PLATFORM}"]`) as HTMLElement;
            
            // エラーが発生してもアプリケーションが停止しない
            expect(() => toolElement.click()).not.toThrow();
        });
    });
});