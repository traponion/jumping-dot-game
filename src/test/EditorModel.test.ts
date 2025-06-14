// EditorModel単体テスト（拡張版）
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EditorModel, type ModelChangeListener } from '../models/EditorModel.js';
import { EDITOR_TOOLS } from '../types/EditorTypes.js';
import type { StageData } from '../core/StageLoader.js';

describe('EditorModel', () => {
    let model: EditorModel;
    let mockListener: ModelChangeListener;

    beforeEach(() => {
        model = new EditorModel();
        mockListener = {
            onStageDataChanged: vi.fn(),
            onEditorStateChanged: vi.fn(),
            onValidationError: vi.fn()
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('初期状態', () => {
        it('初期状態でステージがnullであること', () => {
            expect(model.getCurrentStage()).toBeNull();
        });

        it('初期状態でオブジェクト数が0であること', () => {
            expect(model.getObjectCount()).toBe(0);
        });

        it('デフォルトのエディター状態が設定されていること', () => {
            const editorState = model.getEditorState();
            expect(editorState.selectedTool).toBe(EDITOR_TOOLS.SELECT);
            expect(editorState.selectedObject).toBeNull();
            expect(editorState.isDrawing).toBe(false);
            expect(editorState.gridEnabled).toBe(true);
            expect(editorState.snapToGrid).toBe(true);
        });

        it('初期状態で変更されていないこと', () => {
            expect(model.isStageModified()).toBe(false);
        });

        it('初期状態で保存時刻がnullであること', () => {
            expect(model.getLastSavedTime()).toBeNull();
        });
    });

    describe('ステージデータ管理', () => {
        const validStageData: StageData = {
            id: 1,
            name: 'テストステージ',
            platforms: [
                { x1: 0, y1: 100, x2: 200, y2: 100 }
            ],
            spikes: [
                { x: 150, y: 80, width: 15, height: 15 }
            ],
            goal: { x: 300, y: 50, width: 40, height: 50 },
            startText: { x: 50, y: 50, text: 'START' },
            goalText: { x: 350, y: 50, text: 'GOAL' }
        };

        it('有効なステージデータを設定できること', () => {
            model.setCurrentStage(validStageData);
            const currentStage = model.getCurrentStage();
            
            expect(currentStage).not.toBeNull();
            expect(currentStage?.name).toBe('テストステージ');
            expect(currentStage?.platforms.length).toBe(1);
        });

        it('ステージ設定後にオブジェクト数が更新されること', () => {
            model.setCurrentStage(validStageData);
            // platforms(1) + spikes(1) + goal(1) = 3
            expect(model.getObjectCount()).toBe(3);
        });

        it('無効なステージデータは拒否されること', () => {
            const invalidStageData = {
                id: 'invalid', // 数値ではない
                name: '',      // 空文字
                platforms: [],
                spikes: [],
                goal: { x: 100, y: 100 }
            } as any;

            model.addChangeListener(mockListener);
            model.setCurrentStage(invalidStageData);
            
            // 無効なデータの場合、ステージは設定されない
            expect(model.getCurrentStage()).toBeNull();
            expect(mockListener.onValidationError).toHaveBeenCalled();
        });

        it('ステージデータがイミュータブルにコピーされること', () => {
            model.setCurrentStage(validStageData);
            const currentStage = model.getCurrentStage();
            
            // 元のオブジェクトとは異なるインスタンスであること
            expect(currentStage).not.toBe(validStageData);
            // しかし内容は同じであること
            expect(currentStage?.name).toBe(validStageData.name);
        });
    });

    describe('変更通知システム', () => {
        const testStageData: StageData = {
            id: 1,
            name: 'NotificationTest',
            platforms: [],
            spikes: [],
            goal: { x: 100, y: 100, width: 40, height: 50 },
            startText: { x: 50, y: 50, text: 'START' },
            goalText: { x: 150, y: 100, text: 'GOAL' }
        };

        it('リスナーを追加できること', () => {
            expect(() => {
                model.addChangeListener(mockListener);
            }).not.toThrow();
        });

        it('リスナーを削除できること', () => {
            model.addChangeListener(mockListener);
            expect(() => {
                model.removeChangeListener(mockListener);
            }).not.toThrow();
        });

        it('ステージデータ変更時にリスナーが呼ばれること', () => {
            model.addChangeListener(mockListener);
            model.setCurrentStage(testStageData);
            
            expect(mockListener.onStageDataChanged).toHaveBeenCalledWith(testStageData);
        });

        it('エディター状態変更時にリスナーが呼ばれること', () => {
            model.addChangeListener(mockListener);
            model.updateEditorState({ selectedTool: EDITOR_TOOLS.PLATFORM });
            
            expect(mockListener.onEditorStateChanged).toHaveBeenCalled();
        });

        it('バリデーションエラー時にリスナーが呼ばれること', () => {
            model.addChangeListener(mockListener);
            
            const invalidData = { id: 'invalid' } as any;
            model.setCurrentStage(invalidData);
            
            expect(mockListener.onValidationError).toHaveBeenCalled();
        });
    });

    describe('詳細バリデーション', () => {
        it('正常なステージデータのバリデーションが通ること', () => {
            const validData: StageData = {
                id: 1,
                name: 'ValidStage',
                platforms: [],
                spikes: [],
                goal: { x: 100, y: 100, width: 40, height: 50 },
                startText: { x: 50, y: 50, text: 'START' },
                goalText: { x: 150, y: 100, text: 'GOAL' }
            };

            expect(model.validateStageData(validData)).toBe(true);
        });

        it('必須フィールドが欠けている場合バリデーションが失敗すること', () => {
            const invalidData = {
                id: 1,
                name: 'InvalidStage',
                // platforms, spikes, goalが欠けている
            } as any;

            expect(model.validateStageData(invalidData)).toBe(false);
        });

        it('ステージ名が無効な場合バリデーションが失敗すること', () => {
            const testCases = [
                { name: '', expected: false, description: '空文字' },
                { name: 'a'.repeat(51), expected: false, description: '長すぎる名前' },
                { name: 'Valid-Name_123', expected: true, description: '有効な名前' },
                { name: 'Invalid@Name!', expected: false, description: '無効な文字' }
            ];

            testCases.forEach(({ name, expected }) => {
                const stageData = {
                    id: 1,
                    name,
                    platforms: [],
                    spikes: [],
                    goal: { x: 100, y: 100, width: 40, height: 50 },
                    startText: { x: 50, y: 50, text: 'START' },
                    goalText: { x: 150, y: 100, text: 'GOAL' }
                };

                expect(model.validateStageData(stageData)).toBe(expected);
            });
        });

        it('ステージIDが無効な場合バリデーションが失敗すること', () => {
            const testCases = [
                { id: 0, expected: false, description: '最小値未満' },
                { id: 1, expected: true, description: '最小値' },
                { id: 9999, expected: true, description: '最大値' },
                { id: 10000, expected: false, description: '最大値超過' },
                { id: 1.5, expected: false, description: '小数' },
                { id: 'string', expected: false, description: '文字列' }
            ];

            testCases.forEach(({ id, expected }) => {
                const stageData = {
                    id,
                    name: 'TestStage',
                    platforms: [],
                    spikes: [],
                    goal: { x: 100, y: 100, width: 40, height: 50 },
                    startText: { x: 50, y: 50, text: 'START' },
                    goalText: { x: 150, y: 100, text: 'GOAL' }
                } as any;

                expect(model.validateStageData(stageData)).toBe(expected);
            });
        });

        it('オブジェクト数制限のバリデーションが働くこと', () => {
            const tooManyPlatforms = Array(101).fill({ x1: 0, y1: 0, x2: 100, y2: 0 });
            const tooManySpikes = Array(51).fill({ x: 50, y: 50 });

            const stageWithTooManyPlatforms = {
                id: 1,
                name: 'TooManyPlatforms',
                platforms: tooManyPlatforms,
                spikes: [],
                goal: { x: 100, y: 100, width: 40, height: 50 },
                startText: { x: 50, y: 50, text: 'START' },
                goalText: { x: 150, y: 100, text: 'GOAL' }
            };

            const stageWithTooManySpikes = {
                id: 2,
                name: 'TooManySpikes',
                platforms: [],
                spikes: tooManySpikes,
                goal: { x: 100, y: 100, width: 40, height: 50 },
                startText: { x: 50, y: 50, text: 'START' },
                goalText: { x: 150, y: 100, text: 'GOAL' }
            };

            expect(model.validateStageData(stageWithTooManyPlatforms)).toBe(false);
            expect(model.validateStageData(stageWithTooManySpikes)).toBe(false);
        });

        it('座標値の範囲バリデーションが働くこと', () => {
            const extremeCoordinate = 10000;
            
            const stageWithExtremeCoords = {
                id: 1,
                name: 'ExtremeCoords',
                platforms: [{ x1: 0, y1: 0, x2: extremeCoordinate, y2: extremeCoordinate }],
                spikes: [{ x: extremeCoordinate, y: extremeCoordinate, width: 15, height: 15 }],
                goal: { x: extremeCoordinate, y: extremeCoordinate, width: 40, height: 50 },
                startText: { x: 50, y: 50, text: 'START' },
                goalText: { x: 150, y: 100, text: 'GOAL' }
            };

            expect(model.validateStageData(stageWithExtremeCoords)).toBe(false);
        });
    });

    describe('エディター状態管理', () => {
        it('エディター状態を更新できること', () => {
            const updates = {
                selectedTool: EDITOR_TOOLS.PLATFORM,
                gridEnabled: false
            };

            model.updateEditorState(updates);
            const newState = model.getEditorState();

            expect(newState.selectedTool).toBe(EDITOR_TOOLS.PLATFORM);
            expect(newState.gridEnabled).toBe(false);
            // 他のプロパティは変更されていない
            expect(newState.snapToGrid).toBe(true);
        });

        it('エディター状態がイミュータブルに返されること', () => {
            const state1 = model.getEditorState();
            const state2 = model.getEditorState();
            
            expect(state1).not.toBe(state2); // 異なるインスタンス
            expect(state1).toEqual(state2);  // しかし内容は同じ
        });

        it('部分的な更新が正しく動作すること', () => {
            model.updateEditorState({ selectedTool: EDITOR_TOOLS.SPIKE });
            model.updateEditorState({ isDrawing: true });
            
            const state = model.getEditorState();
            expect(state.selectedTool).toBe(EDITOR_TOOLS.SPIKE);
            expect(state.isDrawing).toBe(true);
            expect(state.gridEnabled).toBe(true); // 初期値のまま
        });
    });

    describe('JSON エクスポート/インポート', () => {
        const testStageData: StageData = {
            id: 2,
            name: 'ExportTest',
            platforms: [{ x1: 0, y1: 100, x2: 100, y2: 100 }],
            spikes: [{ x: 50, y: 80, width: 15, height: 15 }],
            goal: { x: 200, y: 50, width: 40, height: 50 },
            startText: { x: 25, y: 50, text: 'START' },
            goalText: { x: 225, y: 50, text: 'GOAL' }
        };

        it('ステージデータをJSONとしてエクスポートできること', () => {
            model.setCurrentStage(testStageData);
            const jsonString = model.exportStageAsJson();
            
            expect(jsonString).toBeTruthy();
            
            const parsedData = JSON.parse(jsonString);
            expect(parsedData.name).toBe('ExportTest');
            expect(parsedData.exportedAt).toBeTruthy();
            expect(parsedData.editorVersion).toBeTruthy();
        });

        it('JSONからステージデータをインポートできること', () => {
            model.setCurrentStage(testStageData);
            const jsonString = model.exportStageAsJson();
            
            const importedData = model.importStageFromJson(jsonString);
            
            expect(importedData.name).toBe('ExportTest');
            expect(importedData.id).toBe(2);
            expect(importedData.platforms.length).toBe(1);
            expect(importedData.spikes.length).toBe(1);
        });

        it('エクスポート/インポートでデータが保持されること', () => {
            model.setCurrentStage(testStageData);
            const exported = model.exportStageAsJson();
            const imported = model.importStageFromJson(exported);
            
            // 基本プロパティの確認
            expect(imported.id).toBe(testStageData.id);
            expect(imported.name).toBe(testStageData.name);
            
            // 配列の長さの確認
            expect(imported.platforms.length).toBe(testStageData.platforms.length);
            expect(imported.spikes.length).toBe(testStageData.spikes.length);
            
            // 座標の確認
            expect(imported.goal.x).toBe(testStageData.goal.x);
            expect(imported.goal.y).toBe(testStageData.goal.y);
        });

        it('無効なJSONのインポートでエラーが発生すること', () => {
            const invalidJsonCases = [
                '{ invalid json }',
                '{ "name": }',
                '',
                'null',
                '[]'
            ];

            invalidJsonCases.forEach(invalidJson => {
                expect(() => {
                    model.importStageFromJson(invalidJson);
                }).toThrow();
            });
        });

        it('エクスポートメタデータが正しく付与されること', () => {
            model.setCurrentStage(testStageData);
            const jsonString = model.exportStageAsJson();
            const parsedData = JSON.parse(jsonString);
            
            expect(parsedData.exportedAt).toBeDefined();
            expect(parsedData.editorVersion).toBe('1.0.0');
            expect(new Date(parsedData.exportedAt)).toBeInstanceOf(Date);
        });

        it('インポート時にメタデータが除去されること', () => {
            const dataWithMeta = {
                ...testStageData,
                exportedAt: new Date().toISOString(),
                editorVersion: '1.0.0'
            };
            
            const jsonString = JSON.stringify(dataWithMeta);
            const imported = model.importStageFromJson(jsonString);
            
            expect('exportedAt' in imported).toBe(false);
            expect('editorVersion' in imported).toBe(false);
        });
    });

    describe('変更状態管理', () => {
        const testStageData: StageData = {
            id: 1,
            name: 'ModificationTest',
            platforms: [],
            spikes: [],
            goal: { x: 100, y: 100, width: 40, height: 50 },
            startText: { x: 50, y: 50, text: 'START' },
            goalText: { x: 150, y: 100, text: 'GOAL' }
        };

        it('ステージ設定後は未変更状態であること', () => {
            model.setCurrentStage(testStageData);
            expect(model.isStageModified()).toBe(false);
        });

        it('変更マークを設定できること', () => {
            model.setCurrentStage(testStageData);
            model.markAsModified();
            expect(model.isStageModified()).toBe(true);
        });

        it('保存マークを設定できること', () => {
            model.setCurrentStage(testStageData);
            model.markAsModified();
            model.markAsSaved();
            
            expect(model.isStageModified()).toBe(false);
            expect(model.getLastSavedTime()).toBeInstanceOf(Date);
        });
    });

    describe('ステージ統計', () => {
        const complexStageData: StageData = {
            id: 1,
            name: 'StatisticsTest',
            platforms: [
                { x1: 0, y1: 100, x2: 100, y2: 100 },
                { x1: 200, y1: 150, x2: 300, y2: 150 }
            ],
            spikes: [
                { x: 50, y: 80, width: 15, height: 15 },
                { x: 150, y: 80, width: 15, height: 15 },
                { x: 250, y: 130, width: 15, height: 15 }
            ],
            goal: { x: 400, y: 100, width: 40, height: 50 },
            startText: { x: 25, y: 75, text: 'START' },
            goalText: { x: 425, y: 75, text: 'GOAL' }
        };

        it('ステージ統計を取得できること', () => {
            model.setCurrentStage(complexStageData);
            const stats = model.getStageStatistics();
            
            expect(stats).not.toBeNull();
            expect(stats?.platformCount).toBe(2);
            expect(stats?.spikeCount).toBe(3);
            expect(stats?.totalLength).toBeGreaterThan(0);
            expect(stats?.boundingBox.width).toBeGreaterThan(0);
            expect(stats?.boundingBox.height).toBeGreaterThan(0);
        });

        it('空のステージでは統計がnullであること', () => {
            const stats = model.getStageStatistics();
            expect(stats).toBeNull();
        });

        it('バウンディングボックスが正しく計算されること', () => {
            model.setCurrentStage(complexStageData);
            const stats = model.getStageStatistics();
            
            // 最小X: 0, 最大X: 425, 最小Y: 75, 最大Y: 150
            expect(stats?.boundingBox.width).toBe(425);
            expect(stats?.boundingBox.height).toBe(75);
        });
    });

    describe('ステージ複製', () => {
        const originalStageData: StageData = {
            id: 1,
            name: 'Original',
            platforms: [{ x1: 0, y1: 100, x2: 100, y2: 100 }],
            spikes: [{ x: 50, y: 80, width: 15, height: 15 }],
            goal: { x: 200, y: 50, width: 40, height: 50 },
            startText: { x: 25, y: 75, text: 'START' },
            goalText: { x: 225, y: 25, text: 'GOAL' }
        };

        it('ステージを複製できること', () => {
            model.setCurrentStage(originalStageData);
            const cloned = model.cloneCurrentStage();
            
            expect(cloned).not.toBeNull();
            expect(cloned?.id).not.toBe(originalStageData.id);
            expect(cloned?.name).toBe('Original (Copy)');
        });

        it('カスタムIDと名前で複製できること', () => {
            model.setCurrentStage(originalStageData);
            const cloned = model.cloneCurrentStage(999, 'Custom Clone');
            
            expect(cloned?.id).toBe(999);
            expect(cloned?.name).toBe('Custom Clone');
        });

        it('複製データが元データと独立していること', () => {
            model.setCurrentStage(originalStageData);
            const cloned = model.cloneCurrentStage();
            
            expect(cloned?.platforms).not.toBe(originalStageData.platforms);
            expect(cloned?.spikes).not.toBe(originalStageData.spikes);
            expect(cloned?.goal).not.toBe(originalStageData.goal);
            
            // しかし内容は同じ
            expect(cloned?.platforms[0]).toEqual(originalStageData.platforms[0]);
            expect(cloned?.spikes[0]).toEqual(originalStageData.spikes[0]);
        });

        it('空ステージの複製はnullを返すこと', () => {
            const cloned = model.cloneCurrentStage();
            expect(cloned).toBeNull();
        });
    });

    describe('エラーハンドリング', () => {
        it('エクスポート時のエラーが適切に処理されること', () => {
            // ステージが設定されていない状態でエクスポート
            expect(() => {
                model.exportStageAsJson();
            }).toThrow('No stage data to export');
        });

        it('リスナーでのエラーがキャッチされること', () => {
            const faultyListener: ModelChangeListener = {
                onStageDataChanged: vi.fn(() => { throw new Error('Listener error'); }),
                onEditorStateChanged: vi.fn(),
                onValidationError: vi.fn()
            };
            
            model.addChangeListener(faultyListener);
            
            // エラーが発生してもメイン処理は継続される
            expect(() => {
                model.setCurrentStage({
                    id: 1,
                    name: 'Test',
                    platforms: [],
                    spikes: [],
                    goal: { x: 100, y: 100, width: 40, height: 50 },
                    startText: { x: 50, y: 50, text: 'START' },
                    goalText: { x: 150, y: 100, text: 'GOAL' }
                });
            }).not.toThrow();
            
            expect(model.getCurrentStage()).not.toBeNull();
        });
    });
});