import * as fabric from 'fabric';
import type { StageData, Platform, Spike, Goal, TextElement } from '../core/StageLoader.js';
import {
    ERROR_CODES,
    ERROR_TYPES,
    EditorError,
    isFabricObjectWithData,
    isPlatformObject,
    isSpikeObject,
    isGoalObject,
    isTextObject
} from '../types/EditorTypes.js';
import { DebugHelper } from '../utils/EditorUtils.js';
import type {
    IStageDataConverter,
    IRenderAdapter,
    IObjectDrawer
} from './IRenderAdapter.js';

/**
 * StageDataConverter - Handles Stage Data ↔ Canvas Object conversion
 * 
 * Responsibilities:
 * - Convert StageData to editable canvas objects
 * - Extract StageData from canvas objects
 * - Individual object data transformations
 * - Data validation and type checking
 * 
 * This class follows Single Responsibility Principle by handling only data conversion.
 */
export class StageDataConverter implements IStageDataConverter {
    private adapter: IRenderAdapter;
    private objectDrawer: IObjectDrawer;
    private currentStageData: StageData | null = null;

    constructor(adapter: IRenderAdapter, objectDrawer: IObjectDrawer) {
        this.adapter = adapter;
        this.objectDrawer = objectDrawer;
    }

    /**
     * Load stage data and convert to editable canvas objects
     */
    loadStageForEditing(stageData: StageData): void {
        try {
            this.currentStageData = stageData;
            this.adapter.clearCanvas();
            
            // Render grid first (as background)
            this.adapter.renderGrid(this.adapter.getEditorState().gridEnabled);
            
            // Convert and add all stage objects
            this.loadPlatforms(stageData.platforms);
            this.loadSpikes(stageData.spikes);
            this.loadGoal(stageData.goal);
            this.loadTextElements(stageData);
            
            this.adapter.renderAll();
            
            DebugHelper.log('Stage loaded for editing', { 
                stageId: stageData.id,
                platformCount: stageData.platforms.length,
                spikeCount: stageData.spikes.length
            });
        } catch (error) {
            throw new EditorError(
                'Failed to load stage for editing',
                ERROR_CODES.STAGE_LOAD_FAILED,
                ERROR_TYPES.EDITOR,
                { stageData, error }
            );
        }
    }

    /**
     * Extract stage data from current canvas objects
     */
    exportStageData(): StageData {
        try {
            const canvasObjects = this.getEditableObjects();
            
            const platforms: Platform[] = [];
            const spikes: Spike[] = [];
            let goal: Goal = { x: 0, y: 0, width: 40, height: 50 }; // Default goal
            const texts: TextElement[] = [];

            // Process each canvas object
            for (const obj of canvasObjects) {
                const platformData = this.extractPlatformData(obj);
                if (platformData) {
                    platforms.push(platformData);
                    continue;
                }

                const spikeData = this.extractSpikeData(obj);
                if (spikeData) {
                    spikes.push(spikeData);
                    continue;
                }

                const goalData = this.extractGoalData(obj);
                if (goalData) {
                    goal = goalData;
                    continue;
                }

                const textData = this.extractTextData(obj);
                if (textData) {
                    texts.push(textData);
                    continue;
                }
            }

            const stageData: StageData = {
                id: this.currentStageData?.id || 1,
                name: this.currentStageData?.name || 'New Stage',
                platforms,
                spikes,
                goal,
                startText: texts[0] || { x: 50, y: 450, text: 'START' },
                goalText: texts[1] || { x: goal.x + 20, y: goal.y - 20, text: 'GOAL' },
                // Include additional text elements if any
                ...(texts.length > 2 && {
                    leftEdgeMessage: texts[2],
                    leftEdgeSubMessage: texts[3]
                })
            };

            DebugHelper.log('Stage data exported', {
                platformCount: platforms.length,
                spikeCount: spikes.length,
                textCount: texts.length
            });

            return stageData;
        } catch (error) {
            throw new EditorError(
                'Failed to export stage data',
                ERROR_CODES.STAGE_EXPORT_FAILED,
                ERROR_TYPES.EDITOR,
                { error }
            );
        }
    }

    /**
     * Convert platform data to canvas object
     */
    convertPlatformToCanvasObject(platform: Platform): unknown {
        try {
            const start = { x: platform.x1, y: platform.y1 };
            const end = { x: platform.x2, y: platform.y2 };
            
            const platformObject = this.objectDrawer.createPlatform(start, end);
            this.objectDrawer.applyPlatformStyle(platformObject);
            
            return platformObject;
        } catch (error) {
            throw new EditorError(
                'Failed to convert platform to canvas object',
                ERROR_CODES.OBJECT_CREATION_FAILED,
                ERROR_TYPES.FABRIC,
                { platform, error }
            );
        }
    }

    /**
     * Convert spike data to canvas object
     */
    convertSpikeToCanvasObject(spike: Spike): unknown {
        try {
            const position = { x: spike.x, y: spike.y };
            const size = { width: spike.width, height: spike.height };
            
            const spikeObject = this.objectDrawer.createSpike(position, size);
            this.objectDrawer.applySpikeStyle(spikeObject);
            
            return spikeObject;
        } catch (error) {
            throw new EditorError(
                'Failed to convert spike to canvas object',
                ERROR_CODES.OBJECT_CREATION_FAILED,
                ERROR_TYPES.FABRIC,
                { spike, error }
            );
        }
    }

    /**
     * Convert goal data to canvas object
     */
    convertGoalToCanvasObject(goal: Goal): unknown {
        try {
            const position = { x: goal.x, y: goal.y };
            const size = { width: goal.width, height: goal.height };
            
            const goalObject = this.objectDrawer.createGoal(position, size);
            this.objectDrawer.applyGoalStyle(goalObject);
            
            return goalObject;
        } catch (error) {
            throw new EditorError(
                'Failed to convert goal to canvas object',
                ERROR_CODES.OBJECT_CREATION_FAILED,
                ERROR_TYPES.FABRIC,
                { goal, error }
            );
        }
    }

    /**
     * Convert text data to canvas object
     */
    convertTextToCanvasObject(text: TextElement): unknown {
        try {
            const position = { x: text.x, y: text.y };
            
            const textObject = this.objectDrawer.createText(position, text.text);
            this.objectDrawer.applyTextStyle(textObject);
            
            return textObject;
        } catch (error) {
            throw new EditorError(
                'Failed to convert text to canvas object',
                ERROR_CODES.OBJECT_CREATION_FAILED,
                ERROR_TYPES.FABRIC,
                { text, error }
            );
        }
    }

    /**
     * Extract platform data from canvas object
     */
    extractPlatformData(canvasObject: unknown): Platform | null {
        if (!this.isFabricObject(canvasObject)) {
            return null;
        }

        if (!isFabricObjectWithData(canvasObject) || !isPlatformObject(canvasObject)) {
            return null;
        }

        try {
            // Now canvasObject is properly typed as fabric.Object
            const bounds = this.objectDrawer.getObjectBounds(canvasObject);
            return {
                x1: bounds.x,
                y1: bounds.y,
                x2: bounds.x + bounds.width,
                y2: bounds.y + bounds.height
            };
        } catch (error) {
            DebugHelper.log('Failed to extract platform data', { canvasObject, error });
            return null;
        }
    }

    /**
     * Extract spike data from canvas object
     */
    extractSpikeData(canvasObject: unknown): Spike | null {
        if (!this.isFabricObject(canvasObject)) {
            return null;
        }

        if (!isFabricObjectWithData(canvasObject) || !isSpikeObject(canvasObject)) {
            return null;
        }

        try {
            const bounds = this.objectDrawer.getObjectBounds(canvasObject);
            return {
                x: bounds.x + bounds.width / 2, // Center point
                y: bounds.y + bounds.height,    // Bottom point
                width: bounds.width,
                height: bounds.height
            };
        } catch (error) {
            DebugHelper.log('Failed to extract spike data', { canvasObject, error });
            return null;
        }
    }

    /**
     * Extract goal data from canvas object
     */
    extractGoalData(canvasObject: unknown): Goal | null {
        if (!this.isFabricObject(canvasObject)) {
            return null;
        }

        if (!isFabricObjectWithData(canvasObject) || !isGoalObject(canvasObject)) {
            return null;
        }

        try {
            const bounds = this.objectDrawer.getObjectBounds(canvasObject);
            return {
                x: bounds.x,
                y: bounds.y,
                width: bounds.width,
                height: bounds.height
            };
        } catch (error) {
            DebugHelper.log('Failed to extract goal data', { canvasObject, error });
            return null;
        }
    }

    /**
     * Extract text data from canvas object
     */
    extractTextData(canvasObject: unknown): TextElement | null {
        if (!this.isFabricObject(canvasObject)) {
            return null;
        }

        if (!isFabricObjectWithData(canvasObject) || !isTextObject(canvasObject)) {
            return null;
        }

        try {
            const bounds = this.objectDrawer.getObjectBounds(canvasObject);
            // This would need access to the actual text content
            // For now, returning placeholder
            return {
                x: bounds.x,
                y: bounds.y,
                text: 'TEXT' // Would need to extract actual text from object
            };
        } catch (error) {
            DebugHelper.log('Failed to extract text data', { canvasObject, error });
            return null;
        }
    }

    /**
     * Load platform objects to canvas
     */
    private loadPlatforms(platforms: Platform[]): void {
        for (const platform of platforms) {
            try {
                this.convertPlatformToCanvasObject(platform);
            } catch (error) {
                DebugHelper.log('Failed to load platform', { platform, error });
            }
        }
    }

    /**
     * Load spike objects to canvas
     */
    private loadSpikes(spikes: Spike[]): void {
        for (const spike of spikes) {
            try {
                this.convertSpikeToCanvasObject(spike);
            } catch (error) {
                DebugHelper.log('Failed to load spike', { spike, error });
            }
        }
    }

    /**
     * Load goal object to canvas
     */
    private loadGoal(goal: Goal): void {
        try {
            this.convertGoalToCanvasObject(goal);
        } catch (error) {
            DebugHelper.log('Failed to load goal', { goal, error });
        }
    }

    /**
     * Load text elements to canvas
     */
    private loadTextElements(stageData: StageData): void {
        const textElements = [
            stageData.startText,
            stageData.goalText,
            stageData.leftEdgeMessage,
            stageData.leftEdgeSubMessage
        ].filter(Boolean) as TextElement[];

        for (const textElement of textElements) {
            try {
                this.convertTextToCanvasObject(textElement);
            } catch (error) {
                DebugHelper.log('Failed to load text element', { textElement, error });
            }
        }
    }

    /**
     * Get all editable objects from canvas (excluding grid)
     */
    private getEditableObjects(): any[] {
        // Get editable objects from the adapter (excluding grid objects)
        if (this.adapter && 'getEditableObjects' in this.adapter) {
            return (this.adapter as any).getEditableObjects();
        }
        
        // Fallback for adapters that don't implement getEditableObjects
        DebugHelper.log('Warning: Adapter does not implement getEditableObjects, returning empty array');
        return [];
    }

    /**
     * Type guard to check if object is a Fabric.js object
     */
    private isFabricObject(obj: unknown): obj is fabric.Object {
        return obj instanceof fabric.Object;
    }
}