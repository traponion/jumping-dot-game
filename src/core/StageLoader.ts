/**
 * @fileoverview Stage data loading and management system
 * @module core/StageLoader
 * @description Domain Layer - Stage data loading with JSON support and fallback mechanisms
 */

/**
 * Platform interface representing a static platform in the game
 * @interface Platform
 * @property {number} x1 - Starting x coordinate
 * @property {number} y1 - Starting y coordinate
 * @property {number} x2 - Ending x coordinate
 * @property {number} y2 - Ending y coordinate
 */
export interface Platform {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

/**
 * Moving platform interface extending static platform with movement properties
 * @interface MovingPlatform
 * @extends Platform
 * @property {number} startX - Starting x position for movement
 * @property {number} endX - Ending x position for movement
 * @property {number} speed - Movement speed in pixels per frame
 * @property {number} direction - Movement direction (1 or -1)
 */
export interface MovingPlatform extends Platform {
    startX: number;
    endX: number;
    speed: number;
    direction: number;
}

/**
 * Spike interface representing a dangerous spike obstacle
 * @interface Spike
 * @property {number} x - X coordinate of spike
 * @property {number} y - Y coordinate of spike
 * @property {number} width - Width of spike hitbox
 * @property {number} height - Height of spike hitbox
 */
export interface Spike {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Hole interface representing a pit or gap in the stage
 * @interface Hole
 * @property {number} x1 - Starting x coordinate of hole
 * @property {number} x2 - Ending x coordinate of hole
 */
export interface Hole {
    x1: number;
    x2: number;
}

/**
 * Goal interface representing the target area to reach
 * @interface Goal
 * @property {number} x - X coordinate of goal
 * @property {number} y - Y coordinate of goal
 * @property {number} width - Width of goal area
 * @property {number} height - Height of goal area
 */
export interface Goal {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Text element interface for stage UI text
 * @interface TextElement
 * @property {number} x - X coordinate for text display
 * @property {number} y - Y coordinate for text display
 * @property {string} text - Text content to display
 */
export interface TextElement {
    x: number;
    y: number;
    text: string;
}

/**
 * Complete stage data interface containing all stage elements
 * @interface StageData
 * @property {number} id - Unique stage identifier
 * @property {string} name - Human-readable stage name
 * @property {number} [timeLimit] - Optional time limit in seconds for this stage
 * @property {Platform[]} platforms - Array of static platforms
 * @property {MovingPlatform[]} [movingPlatforms] - Optional array of moving platforms
 * @property {Hole[]} [holes] - Optional array of holes/pits
 * @property {Spike[]} spikes - Array of spike obstacles
 * @property {Spike[]} [movingSpikes] - Optional array of moving spikes
 * @property {Goal} goal - Goal area to reach
 * @property {TextElement} startText - Text shown at stage start
 * @property {TextElement} goalText - Text shown at goal
 * @property {TextElement} [leftEdgeMessage] - Optional message at left edge
 * @property {TextElement} [leftEdgeSubMessage] - Optional sub-message at left edge
 */
export interface StageData {
    id: number;
    name: string;
    timeLimit?: number; // Optional time limit in seconds for this stage
    platforms: Platform[];
    movingPlatforms?: MovingPlatform[];
    holes?: Hole[];
    spikes: Spike[];
    movingSpikes?: Spike[];
    goal: Goal;
    startText: TextElement;
    goalText: TextElement;
    leftEdgeMessage?: TextElement;
    leftEdgeSubMessage?: TextElement;
}

/**
 * Stage data loader with caching and fallback mechanisms
 * @class StageLoader
 * @description Handles loading stage data from JSON files with validation and error recovery
 */
export class StageLoader {
    /** @private {Map<number, StageData>} Cached stage data for performance */
    private cache: Map<number, StageData>;

    /**
     * Creates a new StageLoader instance
     * @constructor
     */
    constructor() {
        this.cache = new Map();
    }

    /**
     * Load stage data from JSON file
     * @param stageId - Stage ID to load
     * @returns Stage data
     */
    async loadStage(stageId: number): Promise<StageData> {
        // Check cache first
        const cachedStage = this.cache.get(stageId);
        if (cachedStage) {
            return cachedStage;
        }

        try {
            // Use Vite's BASE_URL to resolve correct path for both local and production environments
            const baseUrl = import.meta.env.BASE_URL;
            const stageUrl = `${baseUrl}stages/stage${stageId}.json`;
            const response = await fetch(stageUrl);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const stageData: StageData = await response.json();
            this.validateStage(stageData);

            // Cache the validated stage data
            this.cache.set(stageId, stageData);

            return stageData;
        } catch (error) {
            throw new Error(`Failed to load stage ${stageId}: ${(error as Error).message}`);
        }
    }

    /**
     * Load stage with fallback to hardcoded data
     * @param stageId - Stage ID to load
     * @returns Stage data
     */
    async loadStageWithFallback(stageId: number): Promise<StageData> {
        try {
            return await this.loadStage(stageId);
        } catch (error) {
            console.warn(
                `Failed to load stage ${stageId} from JSON, falling back to hardcoded data:`,
                (error as Error).message
            );
            return this.getHardcodedStage(stageId);
        }
    }

    /**
     * Validate stage data structure and throw error if invalid
     * @param {unknown} stageData - Stage data to validate
     * @throws {Error} If stage data is invalid
     * @returns {asserts stageData is StageData} Type assertion for valid stage data
     */
    validateStage(stageData: unknown): asserts stageData is StageData {
        if (!this.isValidStageData(stageData)) {
            throw new Error('Invalid stage data: must be an object');
        }

        if (!this.hasRequiredFields(stageData)) {
            throw new Error('Invalid stage data: missing required fields');
        }

        // Validate platforms
        if (!Array.isArray(stageData.platforms)) {
            throw new Error('Invalid stage data: platforms must be an array');
        }

        for (const platform of stageData.platforms) {
            if (
                typeof platform.x1 !== 'number' ||
                typeof platform.y1 !== 'number' ||
                typeof platform.x2 !== 'number' ||
                typeof platform.y2 !== 'number'
            ) {
                throw new Error('Invalid platform data: missing coordinates');
            }
        }

        // Validate spikes
        if (!Array.isArray(stageData.spikes)) {
            throw new Error('Invalid stage data: spikes must be an array');
        }

        for (const spike of stageData.spikes) {
            if (
                typeof spike.x !== 'number' ||
                typeof spike.y !== 'number' ||
                typeof spike.width !== 'number' ||
                typeof spike.height !== 'number'
            ) {
                throw new Error('Invalid spike data: missing properties');
            }
        }

        // Validate goal
        if (!this.isValidGoal(stageData.goal)) {
            throw new Error('Invalid stage data: goal missing properties');
        }

        // Validate text elements
        const textFields = ['startText', 'goalText'] as const;
        for (const field of textFields) {
            if (!this.isValidTextElement(stageData[field])) {
                throw new Error(`Invalid stage data: ${field} missing properties`);
            }
        }
    }

    /**
     * Checks if data is a valid stage data object
     * @private
     * @param {unknown} data - Data to check
     * @returns {boolean} True if data is a valid object
     */
    private isValidStageData(data: unknown): data is Record<string, unknown> {
        return typeof data === 'object' && data !== null;
    }

    /**
     * Checks if stage data has all required fields
     * @private
     * @param {Record<string, unknown>} data - Stage data object to check
     * @returns {boolean} True if all required fields are present
     */
    private hasRequiredFields(data: Record<string, unknown>): boolean {
        const requiredFields = [
            'id',
            'name',
            'platforms',
            'spikes',
            'goal',
            'startText',
            'goalText'
        ];

        return requiredFields.every((field) => field in data);
    }

    /**
     * Validates goal object structure
     * @private
     * @param {unknown} goal - Goal object to validate
     * @returns {boolean} True if goal has valid structure
     */
    private isValidGoal(
        goal: unknown
    ): goal is { x: number; y: number; width: number; height: number } {
        return (
            typeof goal === 'object' &&
            goal !== null &&
            typeof (goal as any).x === 'number' &&
            typeof (goal as any).y === 'number' &&
            typeof (goal as any).width === 'number' &&
            typeof (goal as any).height === 'number'
        );
    }

    /**
     * Validates text element object structure
     * @private
     * @param {unknown} textObj - Text element to validate
     * @returns {boolean} True if text element has valid structure
     */
    private isValidTextElement(
        textObj: unknown
    ): textObj is { x: number; y: number; text: string } {
        return (
            typeof textObj === 'object' &&
            textObj !== null &&
            typeof (textObj as any).x === 'number' &&
            typeof (textObj as any).y === 'number' &&
            typeof (textObj as any).text === 'string'
        );
    }

    /**
     * Get hardcoded stage data as fallback
     * @param stageId - Stage ID
     * @returns Hardcoded stage data
     */
    getHardcodedStage(stageId: number): StageData {
        console.warn(`Falling back to hardcoded stage for stageId: ${stageId}`);
        // Always return minimal fallback stage regardless of ID
        return this.createMinimalFallbackStage();
    }

    /**
     * Creates a minimal fallback stage for error recovery
     * @private
     * @returns {StageData} Safe fallback stage with minimal obstacles
     */
    private createMinimalFallbackStage(): StageData {
        console.warn('Creating a minimal fallback stage. Stage data might be incomplete.');
        return {
            id: 0, // ID 0 indicates error/fallback stage
            name: 'Offline Mode',
            timeLimit: 99, // Generous time for error recovery
            platforms: [
                { x1: 0, y1: 500, x2: 800, y2: 500 } // Single safe platform
            ],
            spikes: [], // No spikes for safe error recovery
            goal: { x: 700, y: 450, width: 40, height: 50 },
            startText: { x: 100, y: 450, text: 'Network Error' },
            goalText: { x: 720, y: 430, text: 'GOAL' }
        };
    }
}
