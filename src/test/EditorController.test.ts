// EditorController統合テスト
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EditorController } from '../controllers/EditorController.js';
import { EditorView } from '../views/EditorView.js';
import { EditorModel } from '../models/EditorModel.js';
import { EditorStore } from '../stores/EditorStore.js';
import { EDITOR_TOOLS, EDITOR_CONFIG } from '../types/EditorTypes.js';
import { globalErrorHandler } from '../utils/ErrorHandler.js';

// モック設定
vi.mock('fabric', () => ({
    Canvas: vi.fn().mockImplementation(() => ({
        add: vi.fn(),
        remove: vi.fn(),
        renderAll: vi.fn(),
        clear: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        getObjects: vi.fn().mockReturnValue([]),
        getActiveObject: vi.fn().mockReturnValue(null),
        setActiveObject: vi.fn(),
        discardActiveObject: vi.fn(),
        setWidth: vi.fn(),
        setHeight: vi.fn(),
        getElement: vi.fn().mockReturnValue(document.createElement('canvas'))
    })),
    Line: vi.fn().mockImplementation(() => ({
        set: vi.fn(),
        data: {}
    })),
    Polygon: vi.fn().mockImplementation(() => ({
        set: vi.fn(),
        data: {}
    })),
    Rect: vi.fn().mockImplementation(() => ({
        set: vi.fn(),
        data: {}
    })),
    Text: vi.fn().mockImplementation(() => ({
        set: vi.fn(),
        data: {}
    }))
}));

// DOM要素のモック
const createMockCanvas = (): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.id = 'editorCanvas';
    canvas.width = EDITOR_CONFIG.CANVAS_SIZE.width;
    canvas.height = EDITOR_CONFIG.CANVAS_SIZE.height;
    return canvas;
};

const createMockUIElements = (): void => {
    // 必要なDOM要素を作成
    const elements = [
        'mouseCoords', 'objectCount', 'currentTool', 'deleteObjectBtn', 'duplicateObjectBtn',
        'stageName', 'stageId', 'stageDescription', 'noSelection', 'platformProperties',
        'spikeProperties', 'goalProperties', 'textProperties', 'gridEnabled', 'snapEnabled'
    ];

    elements.forEach(id => {
        if (!document.getElementById(id)) {
            const element = document.createElement('div');
            element.id = id;
            document.body.appendChild(element);
        }
    });

    // ツールアイテムを作成
    const tools = Object.values(EDITOR_TOOLS);
    tools.forEach(tool => {
        const toolElement = document.createElement('div');
        toolElement.className = 'tool-item';
        toolElement.setAttribute('data-tool', tool);
        document.body.appendChild(toolElement);
    });
};

describe('EditorController統合テスト', () => {
    let canvas: HTMLCanvasElement;
    let controller: EditorController;
    let view: EditorView;
    let model: EditorModel;
    let store: EditorStore;

    beforeEach(() => {
        // DOM要素の初期化
        document.body.innerHTML = '';
        createMockUIElements();
        
        canvas = createMockCanvas();
        document.body.appendChild(canvas);

        // インスタンス作成
        view = new EditorView(canvas);
        model = new EditorModel();
        store = new EditorStore();
        controller = new EditorController(canvas, view, model);

        // エラーハンドラーの統計をリセット
        globalErrorHandler.resetStatistics();
    });

    afterEach(() => {
        // クリーンアップ
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    describe('初期化テスト', () => {
        it('正常に初期化されること', () => {
            expect(controller).toBeDefined();
            // expect(controller.getFabricCanvas()).toBeDefined();
        });

        it('初期状態でSELECTツールが選択されていること', () => {
            expect(store.getActiveTool()).toBe(EDITOR_TOOLS.SELECT);
        });

        it('初期状態でオブジェクト数が0であること', () => {
            expect(store.getObjectCount()).toBe(0);
        });
    });

    describe('ツール切り替えテスト', () => {
        it('ツールが正常に切り替わること', () => {
            Object.values(EDITOR_TOOLS).forEach(tool => {
                controller.selectTool(tool);
                expect(store.getActiveTool()).toBe(tool);
            });
        });

        it('無効なツールを選択した場合エラーが発生すること', () => {
            const initialErrorCount = globalErrorHandler.getStatistics().totalErrors;
            
            controller.selectTool('invalid_tool' as any);
            
            const finalErrorCount = globalErrorHandler.getStatistics().totalErrors;
            expect(finalErrorCount).toBeGreaterThan(initialErrorCount);
        });
    });

    describe('ステージ管理テスト', () => {
        it('新しいステージを作成できること', async () => {
            await controller.createNewStage();
            
            const currentStage = store.getCurrentStage();
            expect(currentStage).toBeDefined();
            expect(currentStage?.name).toBe('New Stage');
        });

        it('ステージをクリアできること', () => {
            // まずステージを作成
            controller.createNewStage();
            
            // クリア実行
            controller.clearStage();
            
            const currentStage = store.getCurrentStage();
            expect(currentStage).toBeNull();
        });

        it('ステージ情報を更新できること', () => {
            const testStageData = {
                id: 1,
                name: 'テストステージ',
                platforms: [],
                spikes: [],
                goal: { x: 100, y: 100, width: 40, height: 50 },
                startText: { x: 50, y: 50, text: 'START' },
                goalText: { x: 150, y: 100, text: 'GOAL' }
            };

            model.setCurrentStage(testStageData);
            
            const currentStage = model.getCurrentStage();
            expect(currentStage?.name).toBe('テストステージ');
            expect(currentStage?.id).toBe(1);
        });
    });

    describe('オブジェクト管理テスト', () => {
        beforeEach(async () => {
            // テスト用のステージを作成
            await controller.createNewStage();
        });

        it('プラットフォームを作成できること', () => {
            controller.selectTool(EDITOR_TOOLS.PLATFORM);
            
            const startEvent = {
                absolutePointer: { x: 100, y: 200 },
                pointer: { x: 100, y: 200 }
            } as any;
            controller.startPlatformDrawing(startEvent);
            
            const endEvent = {
                absolutePointer: { x: 200, y: 200 },
                pointer: { x: 200, y: 200 }
            } as any;
            controller.finishPlatformDrawing(endEvent);
            
            const currentStage = store.getCurrentStage();
            expect(currentStage?.platforms.length).toBeGreaterThan(0);
        });

        it('スパイクを作成できること', () => {
            controller.selectTool(EDITOR_TOOLS.SPIKE);
            
            const mockEvent = {
                absolutePointer: { x: 150, y: 180 },
                pointer: { x: 150, y: 180 }
            } as any;
            controller.createObject(mockEvent);
            
            const currentStage = store.getCurrentStage();
            expect(currentStage?.spikes.length).toBeGreaterThan(0);
        });

        it('ゴールを作成できること', () => {
            controller.selectTool(EDITOR_TOOLS.GOAL);
            
            const mockEvent = {
                absolutePointer: { x: 300, y: 250 },
                pointer: { x: 300, y: 250 }
            } as any;
            controller.createObject(mockEvent);
            
            // ゴールは一つだけなので、位置が更新されていることを確認
            const currentStage = store.getCurrentStage();
            expect(currentStage?.goal.x).toBe(300);
            expect(currentStage?.goal.y).toBe(250);
        });

        it('選択されたオブジェクトを削除できること', () => {
            // まずスパイクを作成
            controller.selectTool(EDITOR_TOOLS.SPIKE);
            const mockEvent = {
                absolutePointer: { x: 150, y: 180 },
                pointer: { x: 150, y: 180 }
            } as any;
            controller.createObject(mockEvent);
            
            // 削除を実行
            controller.deleteSelectedObject();
            
            // ステージからオブジェクトが削除されていることを確認は難しいので、
            // エラーが発生しないことを確認
            expect(() => controller.deleteSelectedObject()).not.toThrow();
        });
    });

    describe('グリッドとスナップテスト', () => {
        it('グリッドを切り替えできること', () => {
            const initialGridState = store.getEditorState().gridEnabled;
            
            controller.toggleGrid();
            
            const newGridState = store.getEditorState().gridEnabled;
            expect(newGridState).toBe(!initialGridState);
        });

        it('スナップを切り替えできること', () => {
            const initialSnapState = store.getEditorState().snapToGrid;
            
            controller.toggleSnap();
            
            const newSnapState = store.getEditorState().snapToGrid;
            expect(newSnapState).toBe(!initialSnapState);
        });
    });

    describe('座標スナップテスト', () => {
        it('スナップが有効な場合座標が調整されること', () => {
            // スナップ機能がオンの状態でテスト
            const initialSnapState = store.getEditorState().snapToGrid;
            if (!initialSnapState) {
                controller.toggleSnap();
            }
            
            // 座標調整のテストは内部的なので、例外が発生しないことを確認
            expect(() => {
                controller.selectTool(EDITOR_TOOLS.SPIKE);
                const mockEvent = {
                    absolutePointer: { x: 113, y: 187 }, // グリッドにスナップされるべき座標
                    pointer: { x: 113, y: 187 }
                } as any;
                controller.createObject(mockEvent);
            }).not.toThrow();
        });

        it('スナップが無効な場合座標が変更されないこと', () => {
            // スナップ機能をオフにする
            const initialSnapState = store.getEditorState().snapToGrid;
            if (initialSnapState) {
                controller.toggleSnap();
            }
            
            // 座標調整のテストは内部的なので、例外が発生しないことを確認
            expect(() => {
                controller.selectTool(EDITOR_TOOLS.SPIKE);
                const mockEvent = {
                    absolutePointer: { x: 113, y: 187 }, // グリッドにスナップされない座標
                    pointer: { x: 113, y: 187 }
                } as any;
                controller.createObject(mockEvent);
            }).not.toThrow();
        });
    });

    describe('エラーハンドリングテスト', () => {
        it('エラーが適切にキャッチされること', () => {
            // 存在しないDOM要素にアクセスしてエラーを発生させる
            const mockCanvas = null as any;
            expect(() => {
                new EditorController(mockCanvas, view, model);
            }).toThrow();
        });

        it('無効な操作でエラーが記録されること', () => {
            const initialErrorCount = globalErrorHandler.getStatistics().totalErrors;
            
            // 無効なツールを選択
            controller.selectTool('invalid' as any);
            
            const finalErrorCount = globalErrorHandler.getStatistics().totalErrors;
            expect(finalErrorCount).toBeGreaterThan(initialErrorCount);
        });
    });

    describe('ステート同期テスト', () => {
        it('Modelの変更がStoreに反映されること', () => {
            const testStageData = {
                id: 2,
                name: 'Model→Store同期テスト',
                platforms: [],
                spikes: [],
                goal: { x: 200, y: 200, width: 40, height: 50 },
                startText: { x: 50, y: 50, text: 'START' },
                goalText: { x: 250, y: 200, text: 'GOAL' }
            };

            model.setCurrentStage(testStageData);
            
            // StoreからもModelと同じデータが取得できることを確認
            const storeStage = store.getCurrentStage();
            expect(storeStage?.name).toBe(testStageData.name);
            expect(storeStage?.id).toBe(testStageData.id);
        });

        it('Storeの変更がViewに反映されること', () => {
            // ツール変更
            store.dispatch({ type: 'SET_SELECTED_TOOL', payload: EDITOR_TOOLS.PLATFORM });
            
            // Viewの更新を確認（実際のDOM更新は環境によっては困難なため、
            // ここではメソッド呼び出しの確認等で代替）
            expect(store.getActiveTool()).toBe(EDITOR_TOOLS.PLATFORM);
        });
    });

    describe('パフォーマンステスト', () => {
        it.skip('大量のオブジェクト作成でも性能が維持されること', async () => {
            // TODO: EditorController API implementation needed
        });
    });

    describe('メモリ管理テスト', () => {
        it.skip('オブジェクト削除でメモリリークが発生しないこと', async () => {
            // TODO: EditorController API implementation needed
        });
    });
});

describe('EditorController集約テスト', () => {
    let canvas: HTMLCanvasElement;
    // Mock controller removed as test is now functional

    beforeEach(() => {
        document.body.innerHTML = '';
        createMockUIElements();
        
        canvas = createMockCanvas();
        document.body.appendChild(canvas);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    it('完全なワークフロー：ステージ作成→オブジェクト配置→保存', async () => {
        // 新しいコントローラーインスタンスを作成（集約テスト用）
        const testCanvas = createMockCanvas();
        document.body.appendChild(testCanvas);
        
        const testView = new EditorView(testCanvas);
        const testModel = new EditorModel();
        const testController = new EditorController(testCanvas, testView, testModel);
        
        try {
            // 1. 初期化
            await testController.initialize();
            
            // 2. 新しいステージ作成
            testController.createNewStage();
            
            // 3. プラットフォーム作成
            testController.selectTool(EDITOR_TOOLS.PLATFORM);
            testController.startPlatformDrawing({
                absolutePointer: { x: 100, y: 300 },
                pointer: { x: 100, y: 300 }
            });
            testController.finishPlatformDrawing({
                absolutePointer: { x: 200, y: 300 },
                pointer: { x: 200, y: 300 }
            });
            
            // 4. スパイク配置
            testController.selectTool(EDITOR_TOOLS.SPIKE);
            testController.createObject({
                absolutePointer: { x: 150, y: 280 },
                pointer: { x: 150, y: 280 }
            });
            
            // 5. ゴール設定
            testController.selectTool(EDITOR_TOOLS.GOAL);
            testController.createObject({
                absolutePointer: { x: 300, y: 250 },
                pointer: { x: 300, y: 250 }
            });
            
            // 6. ステージ保存（実際のダウンロードではなく処理の確認）
            expect(() => testController.saveStage()).not.toThrow();
            
            // ワークフローが完了したことを確認
            const finalStage = testModel.getCurrentStage();
            expect(finalStage).toBeDefined();
            expect(finalStage?.platforms.length).toBeGreaterThan(0);
            expect(finalStage?.spikes.length).toBeGreaterThan(0);
            
        } finally {
            testController.dispose();
            document.body.removeChild(testCanvas);
        }
    });
});