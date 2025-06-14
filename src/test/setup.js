// Mock Canvas API for testing
global.HTMLCanvasElement.prototype.getContext = () => ({
    fillRect: () => {},
    clearRect: () => {},
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: '',
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    fillText: () => {},
    strokeRect: () => {},
    ellipse: () => {},
    closePath: () => {}
});

// Mock performance.now for consistent testing
global.performance = {
    now: () => Date.now()
};

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback) => {
    return setTimeout(callback, 16);
};

global.cancelAnimationFrame = (id) => {
    clearTimeout(id);
};

// Create DOM elements required by Game class
const createGameDOM = () => {
    // Only create if not already exists
    if (!document.getElementById('gameCanvas')) {
        // Game canvas
        const canvas = document.createElement('canvas');
        canvas.id = 'gameCanvas';
        canvas.width = 800;
        canvas.height = 600;
        document.body.appendChild(canvas);

        // Game status element
        const gameStatus = document.createElement('div');
        gameStatus.id = 'gameStatus';
        gameStatus.textContent = 'Test Status';
        document.body.appendChild(gameStatus);

        // Timer display
        const timer = document.createElement('div');
        timer.id = 'timer';
        timer.textContent = 'Time: 10';
        document.body.appendChild(timer);

        // Score display
        const score = document.createElement('div');
        score.id = 'score';
        score.textContent = 'Score: 0';
        document.body.appendChild(score);

        // UI elements for HTML/CSS UI
        const gameUI = document.createElement('div');
        gameUI.id = 'gameUI';
        gameUI.className = 'game-ui';
        
        const startScreen = document.createElement('div');
        startScreen.id = 'startScreen';
        startScreen.className = 'start-screen';
        startScreen.textContent = 'Press SPACE to Start';
        gameUI.appendChild(startScreen);
        
        const gameOverScreen = document.createElement('div');
        gameOverScreen.id = 'gameOverScreen';
        gameOverScreen.className = 'game-over-screen hidden';
        gameOverScreen.textContent = 'Game Over';
        gameUI.appendChild(gameOverScreen);
        
        document.body.appendChild(gameUI);
    }
};

// Create DOM elements when setup runs
createGameDOM();
