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
    validateStage(stageData: unknown): asserts stageData is StageData {
        const requiredFields = [
            'id',
            'name',
            'platforms',
            'spikes',
            'goal',
            'startText',
            'goalText'
        ];

        for (const field of requiredFields) {
            if (!(field in stageData)) {
                throw new Error(`Invalid stage data: missing ${field}`);
            }
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
        const goal = stageData.goal;
        if (
            typeof goal.x !== 'number' ||
            typeof goal.y !== 'number' ||
            typeof goal.width !== 'number' ||
            typeof goal.height !== 'number'
        ) {
            throw new Error('Invalid stage data: goal missing properties');
        }

        // Validate text elements
        const textFields = ['startText', 'goalText'];
        for (const field of textFields) {
            const textObj = stageData[field];
            if (
                typeof textObj.x !== 'number' ||
                typeof textObj.y !== 'number' ||
                typeof textObj.text !== 'string'
            ) {
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
        switch (stageId) {
            case 1:
                return this.createHardcodedStage1();
            case 2:
                return this.createHardcodedStage2();
            default:
                return this.createHardcodedStage1();
        }
    }

    private createHardcodedStage1(): StageData {
        return {
            id: 1,
            name: 'Stage 1',
            platforms: [
                // Ground sections with proper clearable gaps
                { x1: -500, y1: 500, x2: 350, y2: 500 },
                { x1: 450, y1: 500, x2: 750, y2: 500 },
                { x1: 850, y1: 500, x2: 1150, y2: 500 },
                { x1: 1250, y1: 480, x2: 1550, y2: 480 },
                { x1: 1650, y1: 460, x2: 1950, y2: 460 },
                { x1: 2050, y1: 440, x2: 2350, y2: 440 },

                // Floating platforms for safe landing
                { x1: 375, y1: 420, x2: 425, y2: 420 },
                { x1: 775, y1: 400, x2: 825, y2: 400 },
                { x1: 1175, y1: 400, x2: 1225, y2: 400 },
                { x1: 1575, y1: 380, x2: 1625, y2: 380 },
                { x1: 1975, y1: 360, x2: 2025, y2: 360 }
            ],

            movingPlatforms: [], // No moving platforms in stage 1

            holes: [
                // Smaller, jumpable gaps
                { x1: 350, x2: 450 },
                { x1: 750, x2: 850 },
                { x1: 1150, x2: 1250 },
                { x1: 1550, x2: 1650 },
                { x1: 1950, x2: 2050 }
            ],

            spikes: [
                // Fewer, more strategic spikes
                { x: 500, y: 480, width: 15, height: 15 },
                { x: 900, y: 480, width: 15, height: 15 },
                { x: 1700, y: 440, width: 15, height: 15 }
            ],

            movingSpikes: [], // No moving spikes in stage 1

            goal: {
                x: 2400,
                y: 390,
                width: 40,
                height: 50
            },

            startText: {
                x: 50,
                y: 450,
                text: 'STAGE 1'
            },

            goalText: {
                x: 2420,
                y: 370,
                text: 'GOAL'
            },

            leftEdgeMessage: {
                x: -400,
                y: 450,
                text: 'NOTHING HERE'
            },

            leftEdgeSubMessage: {
                x: -400,
                y: 470,
                text: 'GO RIGHT →'
            }
        };
    }

    private createHardcodedStage2(): StageData {
        return {
            id: 2,
            name: 'Stage 2',
            platforms: [
                // Ground sections with bigger gaps for moving platforms
                { x1: -500, y1: 500, x2: 300, y2: 500 },
                { x1: 500, y1: 500, x2: 700, y2: 500 },
                { x1: 900, y1: 500, x2: 1100, y2: 500 },
                { x1: 1300, y1: 480, x2: 1500, y2: 480 },
                { x1: 1700, y1: 460, x2: 1900, y2: 460 },
                { x1: 2100, y1: 440, x2: 2350, y2: 440 },

                // Some fixed floating platforms
                { x1: 1150, y1: 400, x2: 1250, y2: 400 },
                { x1: 1950, y1: 360, x2: 2050, y2: 360 }
            ],

            movingPlatforms: [
                // Moving platforms (placeholders for now)
                {
                    x1: 350,
                    y1: 450,
                    x2: 450,
                    y2: 450,
                    startX: 350,
                    endX: 450,
                    speed: 1,
                    direction: 1
                },
                {
                    x1: 750,
                    y1: 430,
                    x2: 850,
                    y2: 430,
                    startX: 750,
                    endX: 850,
                    speed: 1.5,
                    direction: -1
                }
            ],

            holes: [
                // Bigger gaps requiring moving platforms
                { x1: 300, x2: 500 },
                { x1: 700, x2: 900 },
                { x1: 1100, x2: 1300 },
                { x1: 1500, x2: 1700 },
                { x1: 1900, x2: 2100 }
            ],

            spikes: [
                { x: 550, y: 480, width: 15, height: 15 },
                { x: 950, y: 480, width: 15, height: 15 },
                { x: 1350, y: 460, width: 15, height: 15 },
                { x: 1750, y: 440, width: 15, height: 15 }
            ],

            movingSpikes: [], // No moving spikes yet

            goal: {
                x: 2400,
                y: 390,
                width: 40,
                height: 50
            },

            startText: {
                x: 50,
                y: 450,
                text: 'STAGE 2'
            },

            goalText: {
                x: 2420,
                y: 370,
                text: 'GOAL'
            },

            leftEdgeMessage: {
                x: -400,
                y: 450,
                text: 'MOVING PLATFORMS!'
            },

            leftEdgeSubMessage: {
                x: -400,
                y: 470,
                text: 'TIMING IS KEY →'
            }
        };
    }
}
