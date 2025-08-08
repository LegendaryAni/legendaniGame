// --- 語言管理 ---
const i18n = {
    zh: {
        startGame: '開始遊戲',
        difficulty: '難度調整',
        soundSettings: '音效設定',
        switchTheme: '切換主題',
        currentTheme: '當前主題：{theme}',
        turnIndicator: '現在輪到：{player}',
        winMessage: '玩家 {winner} 贏了！',
        drawMessage: '平手！',
        hint: '提示',
        restart: '重新開始',
        backToMenu: '返回主介面',
        difficultySet: '難度設為：{level}',
        tutorial: [
            '<b>【規則1】</b>歡迎！點擊棋盤即可落子。',
            '<b>【規則2】</b>雙方輪流下棋。你的棋子是 "X"，對手是 "O"。',
            '<b>【重要規則】</b>每人場上最多只能有3個棋子！當你下第4個棋子時，你最早放的第1個棋子將會消失。',
            '<b>【勝利條件】</b>讓你的3個棋子連成一線即可獲勝！',
            '教學結束！祝你好運！'
        ],
        skipTutorial: '跳過教學',
        startPlaying: '開始遊戲',
        nextStep: '下一步',
        aiThinking: 'AI 思考中...',
        gameOver: '遊戲結束！',
        playAgain: '再來一局',
        hintSuggestion: '建議：放置棋子在格子 {index}',
        noHint: '沒有明顯的最佳移動，隨機選擇吧！',
        tutorialReset: '教學已重設。'
    },
    en: {
        startGame: 'Start Game',
        difficulty: 'Adjust Difficulty',
        soundSettings: 'Sound Settings',
        switchTheme: 'Switch Theme',
        currentTheme: 'Current Theme: {theme}',
        turnIndicator: 'Now it’s: {player}',
        winMessage: 'Player {winner} wins!',
        drawMessage: 'It’s a draw!',
        hint: 'Hint',
        restart: 'Restart',
        backToMenu: 'Back to Menu',
        difficultySet: 'Difficulty set to: {level}',
        tutorial: [
            '<b>[Rule 1]</b> Welcome! Click the board to place your piece.',
            '<b>[Rule 2]</b> Players take turns. Your piece is "X", opponent is "O".',
            '<b>[Key Rule]</b> Each player can have up to 3 pieces on the board! When you place a 4th piece, the earliest one disappears!',
            '<b>[Win Condition]</b> Get 3 of your pieces in a row to win!',
            'Tutorial complete! Good luck!'
        ],
        skipTutorial: 'Skip Tutorial',
        startPlaying: 'Start Playing',
        nextStep: 'Next',
        aiThinking: 'AI is thinking...',
        gameOver: 'Game Over!',
        playAgain: 'Play Again',
        hintSuggestion: 'Suggestion: Place piece at cell {index}',
        noHint: 'No obvious best move, choose randomly!',
        tutorialReset: 'Tutorial has been reset.'
    }
};
let currentLang = 'zh';

function t(key, params = {}) {
    let text = i18n[currentLang][key] || key;
    for (const [param, value] of Object.entries(params)) {
        text = text.replace(`{${param}}`, value);
    }
    return text;
}

// --- 遊戲狀態與設定 ---
let gameState = {
    mode: 'single',
    difficulty: 'normal',
    currentPlayer: 'X',
    board: Array(9).fill(''),
    xPositions: [],
    oPositions: [],
    playerScore: 0,
    opponentScore: 0,
    isGameOver: false,
    animationsOn: true,
    volume: 0.5,
    gameCount: 0,
    startTime: null
};
const themes = { 
    default: t('currentTheme', { theme: '預設藍色' }), 
    dark: t('currentTheme', { theme: '黑暗模式' }), 
    pixel: t('currentTheme', { theme: '像素風格' }), 
    tech: t('currentTheme', { theme: '未來科技' }) 
};
let currentTheme = 'default';
const WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

// --- 音效管理 ---
const sounds = {};
function initializeSounds() {
    const soundFiles = {
        press: '/legendaniGame/assets/sounds/button01a.mp3', // 按鈕按下
        release: '/legendaniGame/assets/sounds/button01b.mp3', // 按鈕釋放
        place: '/legendaniGame/assets/sounds/coin01.mp3', // 放置棋子
        win: '/legendaniGame/assets/sounds/correct_answer1.mp3', // 勝利
        lose: '/legendaniGame/assets/sounds/powerdown01.mp3', // 失敗
        draw: '/legendaniGame/assets/sounds/blip01.mp3' // 平局
    };
    for (const [key, path] of Object.entries(soundFiles)) {
        try {
            sounds[key] = new Audio(path);
            sounds[key].preload = 'auto'; // 預載音效以提高性能
        } catch (e) {
            logError(`音效檔案 ${path} 載入失敗: ${e.message}`, e);
            sounds[key] = null; // 設置為 null 以禁用該音效
        }
    }
}
function playSound(sound) {
    if (!sound || !gameState.volume) return;
    try {
        const s = sound.cloneNode();
        s.volume = gameState.volume;
        s.play().catch(e => logError(`音效播放失敗: ${e.message}`, e));
    } catch (e) {
        logError(`音效處理錯誤: ${e.message}`, e);
    }
}

// --- 日誌系統 ---
function logError(message, error) {
    console.error(message, error);
    const logs = JSON.parse(localStorage.getItem('gameLogs') || '[]');
    logs.push({ timestamp: new Date().toISOString(), message, error: error?.message });
    localStorage.setItem('gameLogs', JSON.stringify(logs.slice(-100)));
}

// --- DOM 元素快取 ---
const doc = {};

// --- 介面切換 ---
function showElement(id) {
    if (!doc.views) return;
    for (let key in doc.views) {
        if (doc.views[key]) doc.views[key].style.display = 'none';
    }
    if (doc.views[id]) doc.views[id].style.display = 'flex';
}
const backToMenu = () => showElement('main');
const showModeSelection = () => showElement('mode');
const showDifficulty = () => showElement('difficulty');
const showSoundSettings = () => showElement('settings');

// --- 設定管理 ---
function setDifficulty(level) {
    gameState.difficulty = level;
    saveSettings();
    showModal(t('difficultySet', { level }));
    backToMenu();
}
function switchTheme(value) {
    if (value) currentTheme = value;
    else {
        const themeKeys = Object.keys(themes);
        const currentIndex = themeKeys.indexOf(currentTheme);
        currentTheme = themeKeys[(currentIndex + 1) % themeKeys.length];
    }
    applyTheme();
    saveSettings();
}
function applyTheme() {
    if (!doc.body) return;
    doc.body.className = '';
    doc.body.classList.add(currentTheme);
    if (!gameState.animationsOn) doc.body.classList.add('animations-disabled');
    if (doc.themeText) doc.themeText.innerText = themes[currentTheme];
}
function toggleAnimations() {
    if (!doc.settings || !doc.settings.animations) return;
    gameState.animationsOn = doc.settings.animations.checked;
    doc.body.classList.toggle('animations-disabled', !gameState.animationsOn);
    saveSettings();
}
function adjustVolume() {
    if (!doc.settings || !doc.settings.volume) return;
    gameState.volume = doc.settings.volume.value / 100;
    if (doc.settings.volumeValue) doc.settings.volumeValue.innerText = `${Math.round(gameState.volume * 100)}%`;
    saveSettings();
}
function testSound() { playSound(sounds.press); }

// --- 遊戲核心邏輯 ---
function startGame(mode) {
    gameState.mode = mode;
    gameState.gameCount++;
    gameState.startTime = Date.now();
    showElement('game');
    resetGame();
    if (localStorage.getItem('seenTutorial') !== 'true') startTutorial();
    saveGameStats();
}
const startSinglePlayer = () => startGame('single');
const startTwoPlayer = () => startGame('two');

function resetGame() {
    gameState.isGameOver = false;
    gameState.currentPlayer = 'X';
    gameState.board.fill('');
    gameState.xPositions = [];
    gameState.oPositions = [];
    initBoard();
    updateTurnIndicator();
    updateScoreboard();
}

function initBoard() {
    if (!doc.game || !doc.game.board) return;
    doc.game.board.innerHTML = '';
    doc.game.board.classList.remove('locked', 'shake');
    const winningLine = document.querySelector('.winning-line');
    if (winningLine) winningLine.remove();
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.onclick = () => makeMove(i);
        doc.game.board.appendChild(cell);
    }
}

function makeMove(index) {
    if (gameState.board[index] !== '' || gameState.isGameOver) return;
    const symbolToPlace = gameState.currentPlayer;
    playSound(sounds.place);
    const cell = document.querySelector(`.cell[data-index='${index}']`);
    if (cell) {
        cell.classList.add('placing');
        setTimeout(() => {
            if (cell) cell.innerText = symbolToPlace;
        }, 300);
        setTimeout(() => {
            if (cell) cell.classList.remove('placing');
        }, 600);
    }
    gameState.board[index] = symbolToPlace;
    const positions = symbolToPlace === 'X' ? gameState.xPositions : gameState.oPositions;
    positions.push(index);
    if (positions.length > 3) {
        let oldIndex = positions.shift();
        gameState.board[oldIndex] = '';
        const oldCell = document.querySelector(`.cell[data-index='${oldIndex}']`);
        if (oldCell) oldCell.innerText = '';
    }
    if (checkWinner()) return;
    gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
    updateTurnIndicator();
    if (gameState.mode === 'single' && gameState.currentPlayer === 'O' && !gameState.isGameOver) {
        if (doc.game.board) doc.game.board.classList.add('locked');
        if (doc.game.turnIndicator) doc.game.turnIndicator.innerText = t('aiThinking');
        setTimeout(() => {
            aiMove();
            if (doc.game.board) doc.game.board.classList.remove('locked');
        }, 700);
    }
}

function checkWinner() {
    for (let combo of WINS) {
        const [a, b, c] = combo;
        if (gameState.board[a] && gameState.board[a] === gameState.board[b] && gameState.board[a] === gameState.board[c]) {
            const winner = gameState.board[a];
            endGame(winner, combo);
            return true;
        }
    }
    if (!gameState.board.includes('')) {
        endGame('draw');
        return true;
    }
    return false;
}

function endGame(winner, combo = null)