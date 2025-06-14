import { EditorRenderSystem, type EditorCallbacks } from './systems/EditorRenderSystem.js';
import { StageLoader, type StageData } from './core/StageLoader.js';

class StageEditor {
    private editorSystem!: EditorRenderSystem;
    private stageLoader: StageLoader;
    private currentStage: StageData | null = null;

    // UI Elements
    private canvas: HTMLCanvasElement;
    private toolItems!: NodeListOf<Element>;
    private mouseCoords!: HTMLElement;
    private objectCount!: HTMLElement;
    private currentToolDisplay!: HTMLElement;
    private deleteBtn!: HTMLButtonElement;
    private duplicateBtn!: HTMLButtonElement;

    // Stage Info Elements
    private stageNameInput!: HTMLInputElement;
    private stageIdInput!: HTMLInputElement;
    private stageDescInput!: HTMLTextAreaElement;

    // Object Property Elements
    private noSelectionDiv!: HTMLElement;
    private platformPropsDiv!: HTMLElement;
    private spikePropsDiv!: HTMLElement;
    private goalPropsDiv!: HTMLElement;
    private textPropsDiv!: HTMLElement;

    // Settings Elements
    private gridEnabledCheckbox!: HTMLInputElement;
    private snapEnabledCheckbox!: HTMLInputElement;

    constructor() {
        this.canvas = document.getElementById('editorCanvas') as HTMLCanvasElement;
        this.stageLoader = new StageLoader();
        
        this.initializeUI();
        this.setupEditorSystem();
        this.setupEventListeners();
        this.updateUI();
    }

    private initializeUI(): void {
        // Tool palette
        this.toolItems = document.querySelectorAll('.tool-item');
        this.mouseCoords = document.getElementById('mouseCoords')!;
        this.objectCount = document.getElementById('objectCount')!;
        this.currentToolDisplay = document.getElementById('currentTool')!;
        this.deleteBtn = document.getElementById('deleteObjectBtn') as HTMLButtonElement;
        this.duplicateBtn = document.getElementById('duplicateObjectBtn') as HTMLButtonElement;

        // Stage info
        this.stageNameInput = document.getElementById('stageName') as HTMLInputElement;
        this.stageIdInput = document.getElementById('stageId') as HTMLInputElement;
        this.stageDescInput = document.getElementById('stageDescription') as HTMLTextAreaElement;

        // Object properties
        this.noSelectionDiv = document.getElementById('noSelection')!;
        this.platformPropsDiv = document.getElementById('platformProperties')!;
        this.spikePropsDiv = document.getElementById('spikeProperties')!;
        this.goalPropsDiv = document.getElementById('goalProperties')!;
        this.textPropsDiv = document.getElementById('textProperties')!;

        // Settings
        this.gridEnabledCheckbox = document.getElementById('gridEnabled') as HTMLInputElement;
        this.snapEnabledCheckbox = document.getElementById('snapEnabled') as HTMLInputElement;
    }

    private setupEditorSystem(): void {
        const callbacks: EditorCallbacks = {
            onObjectSelected: (object) => this.handleObjectSelection(object),
            onObjectModified: () => this.handleObjectModified(),
            onStageModified: (stageData) => this.handleStageModified(stageData)
        };

        this.editorSystem = new EditorRenderSystem(this.canvas, callbacks);
        
        // Initialize with an empty stage
        this.createNewStage();
    }

    private setupEventListeners(): void {
        // Tool selection
        this.toolItems.forEach(item => {
            item.addEventListener('click', () => {
                const tool = item.getAttribute('data-tool') as any;
                this.selectTool(tool);
            });
        });

        // Toolbar buttons
        document.getElementById('newStageBtn')?.addEventListener('click', () => this.createNewStage());
        document.getElementById('loadStageBtn')?.addEventListener('click', () => this.loadStage());
        document.getElementById('saveStageBtn')?.addEventListener('click', () => this.saveStage());
        document.getElementById('testStageBtn')?.addEventListener('click', () => this.testStage());
        document.getElementById('clearStageBtn')?.addEventListener('click', () => this.clearStage());
        document.getElementById('toggleGridBtn')?.addEventListener('click', () => this.toggleGrid());
        document.getElementById('toggleSnapBtn')?.addEventListener('click', () => this.toggleSnap());

        // Object actions
        this.deleteBtn.addEventListener('click', () => this.deleteSelectedObject());
        this.duplicateBtn.addEventListener('click', () => this.duplicateSelectedObject());

        // Settings
        this.gridEnabledCheckbox.addEventListener('change', () => {
            this.editorSystem.toggleGrid();
        });
        
        this.snapEnabledCheckbox.addEventListener('change', () => {
            this.editorSystem.toggleSnapToGrid();
        });

        // Stage info changes
        this.stageNameInput.addEventListener('input', () => this.updateStageInfo());
        this.stageIdInput.addEventListener('input', () => this.updateStageInfo());
        this.stageDescInput.addEventListener('input', () => this.updateStageInfo());

        // Mouse tracking
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.round(e.clientX - rect.left);
            const y = Math.round(e.clientY - rect.top);
            this.mouseCoords.textContent = `${x}, ${y}`;
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    private selectTool(tool: string): void {
        // Update UI
        this.toolItems.forEach(item => item.classList.remove('active'));
        document.querySelector(`[data-tool="${tool}"]`)?.classList.add('active');
        
        // Update editor system
        this.editorSystem.setSelectedTool(tool as any);
        this.currentToolDisplay.textContent = tool.charAt(0).toUpperCase() + tool.slice(1);
    }

    private handleObjectSelection(object: any): void {
        // Update action buttons
        this.deleteBtn.disabled = !object;
        this.duplicateBtn.disabled = !object;

        // Show/hide property panels
        this.hideAllPropertyPanels();
        
        if (!object) {
            this.noSelectionDiv.style.display = 'block';
            return;
        }

        const objectType = object.data?.type;
        switch (objectType) {
            case 'platform':
                this.platformPropsDiv.style.display = 'block';
                this.loadPlatformProperties(object);
                break;
            case 'spike':
                this.spikePropsDiv.style.display = 'block';
                this.loadSpikeProperties(object);
                break;
            case 'goal':
                this.goalPropsDiv.style.display = 'block';
                this.loadGoalProperties(object);
                break;
            case 'text':
                this.textPropsDiv.style.display = 'block';
                this.loadTextProperties(object);
                break;
        }
    }

    private hideAllPropertyPanels(): void {
        this.noSelectionDiv.style.display = 'none';
        this.platformPropsDiv.style.display = 'none';
        this.spikePropsDiv.style.display = 'none';
        this.goalPropsDiv.style.display = 'none';
        this.textPropsDiv.style.display = 'none';
    }

    private loadPlatformProperties(platform: any): void {
        const length = Math.sqrt(
            Math.pow(platform.x2 - platform.x1, 2) + 
            Math.pow(platform.y2 - platform.y1, 2)
        );
        const angle = Math.atan2(platform.y2 - platform.y1, platform.x2 - platform.x1) * 180 / Math.PI;
        
        (document.getElementById('platformLength') as HTMLInputElement).value = Math.round(length).toString();
        (document.getElementById('platformAngle') as HTMLInputElement).value = angle.toFixed(1);
    }

    private loadSpikeProperties(spike: any): void {
        (document.getElementById('spikeSize') as HTMLInputElement).value = spike.width?.toString() || '15';
    }

    private loadGoalProperties(goal: any): void {
        (document.getElementById('goalWidth') as HTMLInputElement).value = goal.width?.toString() || '40';
        (document.getElementById('goalHeight') as HTMLInputElement).value = goal.height?.toString() || '50';
    }

    private loadTextProperties(text: any): void {
        (document.getElementById('textContent') as HTMLInputElement).value = text.text || '';
        (document.getElementById('textSize') as HTMLInputElement).value = text.fontSize?.toString() || '16';
    }

    private handleObjectModified(): void {
        this.updateObjectCount();
        // Properties will be updated when object is selected again
    }

    private handleStageModified(stageData: StageData): void {
        this.currentStage = stageData;
        this.updateObjectCount();
    }

    private updateObjectCount(): void {
        const stageData = this.editorSystem.exportStageData();
        const count = stageData.platforms.length + stageData.spikes.length + 1; // +1 for goal
        this.objectCount.textContent = count.toString();
    }

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
    }

    private async loadStage(): Promise<void> {
        try {
            const stageId = parseInt(prompt('Enter stage ID to load:') || '1');
            const stageData = await this.stageLoader.loadStage(stageId);
            
            this.currentStage = stageData;
            this.editorSystem.loadStageForEditing(stageData);
            this.updateStageInfoUI();
            this.updateUI();
            
            console.log('Stage loaded successfully:', stageData);
        } catch (error) {
            alert('Failed to load stage: ' + error);
        }
    }

    private saveStage(): void {
        if (!this.currentStage) return;

        const stageData = this.editorSystem.exportStageData();
        
        // Update stage info from UI
        stageData.name = this.stageNameInput.value;
        stageData.id = parseInt(this.stageIdInput.value);

        const json = JSON.stringify(stageData, null, 2);
        
        // Create download link
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stage${stageData.id}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('Stage saved:', stageData);
    }

    private testStage(): void {
        if (!this.currentStage) return;

        // Open game in new tab with current stage data
        const stageData = this.editorSystem.exportStageData();
        const json = JSON.stringify(stageData);
        
        // Store in localStorage for the game to pick up
        localStorage.setItem('testStage', json);
        
        // Open game page
        window.open('/index.html?test=true', '_blank');
    }

    private clearStage(): void {
        if (confirm('Are you sure you want to clear all objects?')) {
            this.createNewStage();
        }
    }

    private toggleGrid(): void {
        this.editorSystem.toggleGrid();
        this.gridEnabledCheckbox.checked = !this.gridEnabledCheckbox.checked;
    }

    private toggleSnap(): void {
        this.editorSystem.toggleSnapToGrid();
        this.snapEnabledCheckbox.checked = !this.snapEnabledCheckbox.checked;
    }

    private deleteSelectedObject(): void {
        this.editorSystem.deleteSelectedObject();
    }

    private duplicateSelectedObject(): void {
        // TODO: Implement object duplication
        console.log('Duplicate function not implemented yet');
    }

    private updateStageInfo(): void {
        if (!this.currentStage) return;
        
        this.currentStage.name = this.stageNameInput.value;
        this.currentStage.id = parseInt(this.stageIdInput.value);
    }

    private updateStageInfoUI(): void {
        if (!this.currentStage) return;

        this.stageNameInput.value = this.currentStage.name;
        this.stageIdInput.value = this.currentStage.id.toString();
        this.stageDescInput.value = (this.currentStage as any).description || '';
    }

    private updateUI(): void {
        this.updateObjectCount();
        this.handleObjectSelection(null);
    }

    private handleKeyboard(e: KeyboardEvent): void {
        // Tool shortcuts
        switch (e.key) {
            case '1':
                this.selectTool('select');
                break;
            case '2':
                this.selectTool('platform');
                break;
            case '3':
                this.selectTool('spike');
                break;
            case '4':
                this.selectTool('goal');
                break;
            case '5':
                this.selectTool('text');
                break;
            case 'Delete':
            case 'Backspace':
                this.deleteSelectedObject();
                e.preventDefault();
                break;
            case 'g':
            case 'G':
                if (e.ctrlKey || e.metaKey) {
                    this.toggleGrid();
                    e.preventDefault();
                }
                break;
            case 's':
            case 'S':
                if (e.ctrlKey || e.metaKey) {
                    this.saveStage();
                    e.preventDefault();
                }
                break;
        }
    }
}

// Initialize editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StageEditor();
    console.log('🎮 Stage Editor initialized!');
});