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
        press: './assets/sounds/button01a.mp3', // 按鈕按下
        release: './assets/sounds/button01b.mp3', // 按鈕釋放
        place: './assets/sounds/coin01.mp3', // 放置棋子
        win: './assets/sounds/correct_answer1.mp3', // 勝利
        lose: './assets/sounds/powerdown01.mp3', // 失敗
        draw: './assets/sounds/blip01.mp3' // 平局
    };
    for (const [key, path] of Object.entries(soundFiles)) {
        try {
            sounds[key] = new Audio(path);
            sounds[key].preload = 'auto'; // 預載音效以提高性能
        } catch (e) {
            logError(`音效檔案 ${path} 載入失敗:`, e);
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

function endGame(winner, combo = null) {
    gameState.isGameOver = true;
    if (doc.game.board) {
        doc.game.board.classList.add('locked');
        document.querySelectorAll('.cell').forEach(cell => cell.onclick = null);
    }
    let modalText = '';
    if (winner === 'draw') {
        playSound(sounds.draw);
        modalText = t('drawMessage');
        if (doc.game.turnIndicator) doc.game.turnIndicator.innerText = t('gameOver');
    } else {
        if (winner === 'X' || (gameState.mode === 'two' && winner === 'O')) {
            playSound(sounds.win);
            launchConfetti();
        } else {
            playSound(sounds.lose);
        }
        modalText = t('winMessage', { winner });
        if (doc.game.turnIndicator) doc.game.turnIndicator.innerText = t('gameOver');
        if (winner === 'X') gameState.playerScore++;
        else gameState.opponentScore++;
        updateScoreboard();
        drawWinningLine(winner, combo);
        if (doc.game.board) doc.game.board.classList.add('shake');
    }
    setTimeout(() => showEndGameModal(modalText), 700);
}

// --- AI 邏輯 ---
function aiMove() {
    switch (gameState.difficulty) {
        case 'easy': randomMove(); break;
        case 'normal': case 'hard': smartMove('O', 'X'); break;
        case 'hell': hellMove('O', 'X'); break;
        default: randomMove();
    }
}
function randomMove() {
    const empty = gameState.board.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
    if (empty.length > 0) {
        if (Math.random() < 0.2) {
            smartMove('O', 'X');
        } else {
            makeMove(empty[Math.floor(Math.random() * empty.length)]);
        }
    }
}
function smartMove(aiPlayer, humanPlayer) {
    const winningMove = findBestMove(aiPlayer);
    if (winningMove !== null) {
        makeMove(winningMove);
        return;
    }
    const blockingMove = findBestMove(humanPlayer);
    if (blockingMove !== null) {
        makeMove(blockingMove);
        return;
    }
    randomMove();
}
function hellMove(aiPlayer, humanPlayer) {
    const bestMove = minimax(aiPlayer, humanPlayer, 2).move;
    if (bestMove !== null) {
        makeMove(bestMove);
        return;
    }
    smartMove(aiPlayer, humanPlayer);
}
function findBestMove(player) {
    for (let i = 0; i < 9; i++) {
        if (gameState.board[i] === '') {
            gameState.board[i] = player;
            if (isWinner(player)) {
                gameState.board[i] = '';
                return i;
            }
            gameState.board[i] = '';
        }
    }
    return null;
}
function isWinner(player) {
    return WINS.some(combo => combo.every(index => gameState.board[index] === player));
}
function minimax(aiPlayer, humanPlayer, depth) {
    let bestMove = null;
    let bestScore = -Infinity;
    const empty = gameState.board.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
    for (let move of empty) {
        gameState.board[move] = aiPlayer;
        const score = evaluateBoard(aiPlayer, humanPlayer, depth - 1);
        gameState.board[move] = '';
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    return { move: bestMove, score: bestScore };
}
function evaluateBoard(aiPlayer, genPlayer, depth) {
    if (isWinner(aiPlayer)) return 10 + depth;
    if (isWinner(humanPlayer)) return -10 - depth;
    if (!gameState.board.includes('')) return 0;
    if (depth <= 0) return 0;
    let score = 0;
    for (let move of gameState.board.map((val, idx) => val === '' ? idx : null).filter(val => val !== null)) {
        gameState.board[move] = aiPlayer;
        score += evaluateBoard(aiPlayer, humanPlayer, depth - 1) * 0.5;
        gameState.board[move] = '';
        gameState.board[move] = humanPlayer;
        score -= evaluateBoard(aiPlayer, humanPlayer, depth - 1) * 0.5;
        gameState.board[move] = '';
    }
    return score;
}

// --- 提示功能 ---
function showHint() {
    if (gameState.isGameOver || gameState.currentPlayer !== 'X') return;
    const bestMove = findBestMove('X');
    if (bestMove !== null) {
        showModal(t('hintSuggestion', { index: bestMove + 1 }));
        const cell = document.querySelector(`.cell[data-index='${bestMove}']`);
        if (cell) cell.classList.add('hint');
        setTimeout(() => cell.classList.remove('hint'), 2000);
    } else {
        showModal(t('noHint'));
    }
}

// --- 畫面渲染 & UI 更新 ---
function updateTurnIndicator() {
    if (doc.game.turnIndicator) doc.game.turnIndicator.innerText = t('turnIndicator', { player: gameState.currentPlayer });
}
function updateScoreboard() {
    if (doc.game.scoreboard) {
        const opponent = gameState.mode === 'single' ? 'AI' : t('playerO', { player: 'O' });
        doc.game.scoreboard.innerText = `你: ${gameState.playerScore} | ${opponent}: ${gameState.opponentScore} | 局數: ${gameState.gameCount}`;
    }
}
function drawWinningLine(winner, combo) {
    if (!doc.game.board) return;
    const winningLine = document.createElement('div');
    winningLine.className = `winning-line win-combo-${WINS.indexOf(combo)} ${winner === 'X' ? 'x-win-line' : 'o-win-line'}`;
    doc.game.board.appendChild(winningLine);
    combo.forEach(index => {
        const cell = document.querySelector(`.cell[data-index='${index}']`);
        if (cell) cell.classList.add('winning');
    });
}

// --- 勝利粒子效果 ---
function launchConfetti() {
    if (!gameState.animationsOn) return;
    const colors = ['#00ffff', '#ff00ff', '#ffff00', '#fff'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        doc.body.appendChild(confetti);
        setTimeout(() => { confetti.remove(); }, 2000);
    }
}

// --- Modal 彈出視窗 ---
function showModal(text, buttons = { [t('ok')]: closeModal }) {
    if (!doc.modal.container) return;
    doc.modal.text.innerHTML = text;
    doc.modal.buttons.innerHTML = '';
    for (const btnText in buttons) {
        const btn = document.createElement('button');
        btn.innerText = btnText;
        btn.onclick = buttons[btnText];
        doc.modal.buttons.appendChild(btn);
    }
    doc.modal.container.classList.add('visible');
}
function closeModal() {
    if (doc.modal.container) doc.modal.container.classList.remove('visible');
}
function showEndGameModal(text) {
    showModal(text, {
        [t('playAgain')]: () => { closeModal(); resetGame(); },
        [t('backToMenu')]: () => { closeModal(); backToMenu(); }
    });
}

// --- 教學系統 ---
let tutorialStep = 0;
function startTutorial() {
    tutorialStep = parseInt(localStorage.getItem('tutorialStep') || '0');
    showNextTutorialStep();
}
function showNextTutorialStep() {
    if (localStorage.getItem('seenTutorial') === 'true') return;
    if (tutorialStep < i18n[currentLang].tutorial.length) {
        let buttons = { [t('nextStep')]: showNextTutorialStep };
        if (tutorialStep === 0) buttons[t('skipTutorial')] = () => { localStorage.setItem('seenTutorial', 'true'); closeModal(); };
        if (tutorialStep === i18n[currentLang].tutorial.length - 1) buttons = { [t('startPlaying')]: () => { localStorage.setItem('seenTutorial', 'true'); closeModal(); } };
        showModal(i18n[currentLang].tutorial[tutorialStep], buttons);
        localStorage.setItem('tutorialStep', tutorialStep);
        tutorialStep++;
    }
}
function resetTutorial() {
    localStorage.removeItem('seenTutorial');
    localStorage.removeItem('tutorialStep');
    showModal(t('tutorialReset'));
}

// --- 存檔 & 讀檔 ---
function saveSettings() {
    const settings = {
        theme: currentTheme,
        difficulty: gameState.difficulty,
        volume: gameState.volume,
        animationsOn: gameState.animationsOn,
        language: currentLang
    };
    localStorage.setItem('ticTacToeSettings', JSON.stringify(settings));
}
function saveGameStats() {
    const stats = {
        gameCount: gameState.gameCount,
        totalTime: gameState.startTime ? (Date.now() - gameState.startTime) / 1000 : 0
    };
    localStorage.setItem('gameStats', JSON.stringify(stats));
}
function loadSettings() {
    try {
        const settings = JSON.parse(localStorage.getItem('ticTacToeSettings'));
        if (settings) {
            currentTheme = themes[settings.theme] ? settings.theme : 'default';
            gameState.difficulty = settings.difficulty || 'normal';
            gameState.volume = settings.volume !== undefined ? settings.volume : 0.5;
            gameState.animationsOn = settings.animationsOn !== undefined ? settings.animationsOn : true;
            currentLang = settings.language || 'zh';
        }
    } catch (e) {
        logError("讀取設定失敗:", e);
    }
    if (doc.settings.volume) doc.settings.volume.value = gameState.volume * 100;
    if (doc.settings.volumeValue) doc.settings.volumeValue.innerText = `${Math.round(gameState.volume * 100)}%`;
    if (doc.settings.animations) doc.settings.animations.checked = gameState.animationsOn;
    applyTheme();
    updateUIText();
}
function updateUIText() {
    if (doc.themeText) doc.themeText.innerText = themes[currentTheme];
    if (doc.views.main) {
        const buttons = {
            'start-game': t('startGame'),
            'difficulty-settings': t('difficulty'),
            'sound-settings-btn': t('soundSettings'),
            'reset-tutorial': t('resetTutorial')
        };
        for (const [id, text] of Object.entries(buttons)) {
            const btn = doc.views.main.querySelector(`#${id}`);
            if (btn) btn.innerText = text;
            else logError(`無法找到主選單按鈕 #${id}，無法更新文字`);
        }
    }
    if (doc.views.game) {
        const buttons = {
            'hint': t('hint'),
            'restart': t('restart'),
            'back-to-menu': t('backToMenu')
        };
        for (const [id, text] of Object.entries(buttons)) {
            const btn = doc.views.game.querySelector(`#${id}`);
            if (btn) btn.innerText = text;
            else logError(`無法找到遊戲介面按鈕 #${id}，無法更新文字`);
        }
    }
}

// --- 遊戲初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    Object.assign(doc, {
        body: document.body,
        themeText: document.getElementById('current-theme'),
        views: {
            main: document.getElementById('main-menu'),
            mode: document.getElementById('mode-selection'),
            difficulty: document.getElementById('difficulty'),
            settings: document.getElementById('sound-settings'),
            game: document.getElementById('game')
        },
        game: {
            board: document.getElementById('board'),
            scoreboard: document.getElementById('scoreboard'),
            turnIndicator: document.getElementById('turn-indicator')
        },
        modal: {
            container: document.getElementById('modal'),
            content: document.getElementById('modal-content'),
            text: document.getElementById('modal-text'),
            buttons: document.getElementById('modal-buttons')
        },
        settings: {
            volume: document.getElementById('volume'),
            volumeValue: document.getElementById('volume-value'),
            animations: document.getElementById('animations-on'),
            themeSelector: document.getElementById('theme-selector')
        }
    });
    if (!doc.body || !doc.views.main || !doc.game.board) {
        logError('初始化失敗：缺少必要的 DOM 元素');
        return;
    }
    initializeSounds();
    loadSettings();
    showElement('main');
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('mousedown', () => { playSound(sounds.press); btn.classList.add('pressed'); });
        btn.addEventListener('mouseup', () => { playSound(sounds.release); btn.classList.remove('pressed'); });
        btn.addEventListener('mouseleave', () => btn.classList.remove('pressed'));
    });
    if (doc.settings.volume) doc.settings.volume.addEventListener('input', adjustVolume);
    if (doc.settings.animations) doc.settings.animations.addEventListener('change', toggleAnimations);
    if (doc.settings.themeSelector) doc.settings.themeSelector.addEventListener('change', (e) => switchTheme(e.target.value));
    const startGameBtn = document.getElementById('start-game');
    const difficultyBtn = document.getElementById('difficulty-settings');
    const soundSettingsBtn = document.getElementById('sound-settings-btn');
    const singlePlayerBtn = document.getElementById('single-player');
    const twoPlayerBtn = document.getElementById('two-player');
    const resetTutorialBtn = document.getElementById('reset-tutorial');
    const hintBtn = document.getElementById('hint');
    const restartBtn = document.getElementById('restart');
    const backToMenuBtn = document.getElementById('back-to-menu');
    if (startGameBtn) startGameBtn.addEventListener('click', showModeSelection);
    else logError('無法找到開始遊戲按鈕');
    if (difficultyBtn) difficultyBtn.addEventListener('click', showDifficulty);
    else logError('無法找到難度設定按鈕');
    if (soundSettingsBtn) soundSettingsBtn.addEventListener('click', showSoundSettings);
    else logError('無法找到音效設定按鈕');
    if (singlePlayerBtn) singlePlayerBtn.addEventListener('click', startSinglePlayer);
    else logError('無法找到單人模式按鈕');
    if (twoPlayerBtn) twoPlayerBtn.addEventListener('click', startTwoPlayer);
    else logError('無法找到雙人模式按鈕');
    if (resetTutorialBtn) resetTutorialBtn.addEventListener('click', resetTutorial);
    else logError('無法找到重設教學按鈕');
    if (hintBtn) hintBtn.addEventListener('click', showHint);
    else logError('無法找到提示按鈕');
    if (restartBtn) restartBtn.addEventListener('click', resetGame);
    else logError('無法找到重新開始按鈕');
    if (backToMenuBtn) backToMenuBtn.addEventListener('click', backToMenu);
    else logError('無法找到返回主選單按鈕');
});