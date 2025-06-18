// Type definitions for stage system
export interface Platform {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface MovingPlatform extends Platform {
    startX: number;
    endX: number;
    speed: number;
    direction: number;
}

export interface Spike {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Hole {
    x1: number;
    x2: number;
}

export interface Goal {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface TextElement {
    x: number;
    y: number;
    text: string;
}

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

export class StageLoader {
    private cache: Map<number, StageData>;

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
            const response = await fetch(`/stages/stage${stageId}.json`);

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
     * Validate stage data structure
     * @param stageData - Stage data to validate
     * @throws If stage data is invalid
     */
    private isValidStageData(data: unknown): data is Record<string, unknown> {
        return typeof data === 'object' && data !== null;
    }

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
     * Get hardcoded stage data as fallback
     * @param stageId - Stage ID
     * @returns Hardcoded stage data
     */
    getHardcodedStage(stageId: number): StageData {
        console.warn(`Falling back to hardcoded stage for stageId: ${stageId}`);
        // Always return minimal fallback stage regardless of ID
        return this.createMinimalFallbackStage();
    }

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

