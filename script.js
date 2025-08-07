// --- 遊戲狀態與設定 ---
let gameState = {
    mode: 'single', difficulty: 'normal', currentPlayer: 'X',
    board: Array(9).fill(''), xPositions: [], oPositions: [],
    playerScore: 0, opponentScore: 0, isGameOver: false,
    animationsOn: true, volume: 0.5
};
const themes = { default: '預設藍色', dark: '黑暗模式', pixel: '像素風格', tech: '未來科技' };
let currentTheme = 'default';
const WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

// --- 音效管理 ---
const sounds = {
    press: new Audio('https://www.soundjay.com/buttons/sounds/button-4.mp3'),
    release: new Audio('https://www.soundjay.com/buttons/sounds/button-7.mp3'),
    place: new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3'),
    win: new Audio('https://www.soundjay.com/misc/sounds/magic-chime-01.mp3'),
    lose: new Audio('https://www.soundjay.com/misc/sounds/camera-shutter-click-01.mp3'),
    draw: new Audio('https://www.soundjay.com/misc/sounds/light-switch-3.mp3')
};
function playSound(sound) {
    if (!sound) return;
    const s = sound.cloneNode();
    s.volume = gameState.volume;
    s.play().catch(e => console.error("音效播放失敗:", e));
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
function setDifficulty(level) { gameState.difficulty = level; saveSettings(); showModal(`難度設為：${level}`); backToMenu(); }
function switchTheme() { const themeKeys = Object.keys(themes); const currentIndex = themeKeys.indexOf(currentTheme); currentTheme = themeKeys[(currentIndex + 1) % themeKeys.length]; applyTheme(); saveSettings(); }
function applyTheme() { if (!doc.body) return; doc.body.className = ''; doc.body.classList.add(currentTheme); if (!gameState.animationsOn) doc.body.classList.add('animations-disabled'); if (doc.themeText) doc.themeText.innerText = `當前主題：${themes[currentTheme]}`; }
function toggleAnimations() { if(!doc.settings || !doc.settings.animations) return; gameState.animationsOn = doc.settings.animations.checked; doc.body.classList.toggle('animations-disabled', !gameState.animationsOn); saveSettings(); }
function adjustVolume() { if(!doc.settings || !doc.settings.volume) return; gameState.volume = doc.settings.volume.value / 100; saveSettings(); }
function testSound() { playSound(sounds.press); }

// --- 遊戲核心邏輯 ---
function startGame(mode) { gameState.mode = mode; showElement('game'); resetGame(); if (localStorage.getItem('seenTutorial') !== 'true') startTutorial(); }
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

// ==================== BUG FIX START (makeMove) ====================
function makeMove(index) {
    if (gameState.board[index] !== '' || gameState.isGameOver) return;
    
    // 修正 Bug A: 在下棋的瞬間就「鎖定」當前的棋子符號
    const symbolToPlace = gameState.currentPlayer;
    
    playSound(sounds.place);
    const cell = document.querySelector(`.cell[data-index='${index}']`);
    if (cell) {
        cell.classList.add('placing');
        setTimeout(() => { 
            // 使用鎖定的符號來渲染，而不是讀取可能已改變的 gameState.currentPlayer
            if(cell) cell.innerText = symbolToPlace; 
        }, 300);
        setTimeout(() => { 
            if(cell) cell.classList.remove('placing'); 
        }, 600);
    }

    gameState.board[index] = symbolToPlace; // 同樣用鎖定的符號更新內部狀態
    
    const positions = symbolToPlace === 'X' ? gameState.xPositions : gameState.oPositions;
    positions.push(index);
    if (positions.length > 3) {
        let oldIndex = positions.shift();
        gameState.board[oldIndex] = '';
        const oldCell = document.querySelector(`.cell[data-index='${oldIndex}']`);
        if(oldCell) oldCell.innerText = '';
    }

    if (checkWinner()) return; // 檢查勝利

    // 只有在確定沒有勝負後，才切換玩家
    gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
    updateTurnIndicator();

    if (gameState.mode === 'single' && gameState.currentPlayer === 'O' && !gameState.isGameOver) {
        if(doc.game.board) doc.game.board.classList.add('locked');
        if(doc.game.turnIndicator) doc.game.turnIndicator.innerText = 'AI 思考中...';
        setTimeout(() => {
            aiMove();
            if(doc.game.board) doc.game.board.classList.remove('locked');
        }, 700);
    }
}
// ==================== BUG FIX END (makeMove) ====================

// ==================== BUG FIX START (checkWinner) ====================
function checkWinner() {
    for (let combo of WINS) {
        const [a, b, c] = combo;

        // 修正 Bug B: 嚴格檢查三個棋子是否「存在」且「完全相同」
        if (gameState.board[a] && gameState.board[a] === gameState.board[b] && gameState.board[a] === gameState.board[c]) {
            const winner = gameState.board[a]; // 勝利者是連線的那個棋子
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
// ==================== BUG FIX END (checkWinner) ====================

function endGame(winner, combo = null) {
    gameState.isGameOver = true;
    if(doc.game.board) doc.game.board.classList.add('locked');
    let modalText = '';
    if (winner === 'draw') {
        playSound(sounds.draw);
        modalText = '平手！';
        if(doc.game.turnIndicator) doc.game.turnIndicator.innerText = '平局！';
    } else {
        if (winner === 'X' || (gameState.mode === 'two' && winner === 'O')) { playSound(sounds.win); launchConfetti(); } else { playSound(sounds.lose); }
        modalText = `玩家 ${winner} 贏了！`;
        if(doc.game.turnIndicator) doc.game.turnIndicator.innerText = `遊戲結束！`;
        if (winner === 'X') gameState.playerScore++; else gameState.opponentScore++;
        updateScoreboard();
        drawWinningLine(winner, combo);
        if(doc.game.board) doc.game.board.classList.add('shake');
    }
    setTimeout(() => showEndGameModal(modalText), 700);
}

// --- AI 邏輯 ---
function aiMove() {
    switch(gameState.difficulty) {
        case 'easy': randomMove(); break;
        case 'normal': case 'hard': case 'hell': smartMove('O', 'X'); break;
        default: randomMove();
    }
}
function randomMove() { const empty = gameState.board.map((val, idx) => val === '' ? idx : null).filter(val => val !== null); if (empty.length > 0) makeMove(empty[Math.floor(Math.random() * empty.length)]); }
function smartMove(aiPlayer, humanPlayer) { const winningMove = findBestMove(aiPlayer); if (winningMove !== null) { makeMove(winningMove); return; } const blockingMove = findBestMove(humanPlayer); if (blockingMove !== null) { makeMove(blockingMove); return; } randomMove(); }
function findBestMove(player) { for (let i = 0; i < 9; i++) { if (gameState.board[i] === '') { gameState.board[i] = player; if (isWinner(player)) { gameState.board[i] = ''; return i; } gameState.board[i] = ''; } } return null; }
function isWinner(player) { return WINS.some(combo => combo.every(index => gameState.board[index] === player)); }

// --- 畫面渲染 & UI 更新 ---
function updateTurnIndicator() { if (doc.game.turnIndicator) doc.game.turnIndicator.innerText = `現在輪到：${gameState.currentPlayer}`; }
function updateScoreboard() { if (doc.game.scoreboard) { const opponent = gameState.mode === 'single' ? 'AI' : '玩家O'; doc.game.scoreboard.innerText = `你: ${gameState.playerScore} | ${opponent}: ${gameState.opponentScore}`; } }
function drawWinningLine(winner, combo) { if (!doc.game.board) return; const winningLine = document.createElement('div'); winningLine.className = `winning-line win-combo-${WINS.indexOf(combo)} ${winner === 'X' ? 'x-win-line' : 'o-win-line'}`; doc.game.board.appendChild(winningLine); }

// --- 勝利粒子效果 ---
function launchConfetti() { if (!gameState.animationsOn) return; const colors = ['#00ffff', '#ff00ff', '#ffff00', '#fff']; for (let i = 0; i < 50; i++) { const confetti = document.createElement('div'); confetti.className = 'confetti'; confetti.style.left = Math.random() * 100 + 'vw'; confetti.style.animationDelay = Math.random() * 0.5 + 's'; confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]; doc.body.appendChild(confetti); setTimeout(() => { confetti.remove(); }, 2000); } }

// --- Modal 彈出視窗 ---
function showModal(text, buttons = {'確定': closeModal}) { if (!doc.modal.container) return; doc.modal.text.innerHTML = text; doc.modal.buttons.innerHTML = ''; for (const btnText in buttons) { const btn = document.createElement('button'); btn.innerText = btnText; btn.onclick = buttons[btnText]; doc.modal.buttons.appendChild(btn); } doc.modal.container.classList.add('visible'); }
function closeModal() { if(doc.modal.container) doc.modal.container.classList.remove('visible'); }
function showEndGameModal(text) { showModal(text, {'再來一局': () => { closeModal(); resetGame(); }, '返回主選單': () => { closeModal(); backToMenu(); }}); }

// --- 教學系統 ---
let tutorialStep = 0;
const tutorialSteps = [ "<b>【規則1】</b>歡迎！點擊棋盤即可落子。", "<b>【規則2】</b>雙方輪流下棋。你的棋子是 'X'，對手是 'O'。", "<b>【重要規則】</b>每人場上最多只能有3個棋子！當你下第4個棋子時，你最早放的第1個棋子將會消失。", "<b>【勝利條件】</b>讓你的3個棋子連成一線即可獲勝！", "教學結束！祝你好運！" ];
function startTutorial() { tutorialStep = 0; showNextTutorialStep(); }
function showNextTutorialStep() { if (localStorage.getItem('seenTutorial') === 'true') return; if (tutorialStep < tutorialSteps.length) { let buttons = {'下一步': showNextTutorialStep}; if (tutorialStep === 0) buttons['跳過教學'] = () => { localStorage.setItem('seenTutorial', 'true'); closeModal(); }; if (tutorialStep === tutorialSteps.length - 1) buttons = {'開始遊戲': () => { localStorage.setItem('seenTutorial', 'true'); closeModal(); }}; showModal(tutorialSteps[tutorialStep], buttons); tutorialStep++; } }
function resetTutorial() { localStorage.removeItem('seenTutorial'); showModal("教學已重設。"); }

// --- 存檔 & 讀檔 ---
function saveSettings() { const settings = { theme: currentTheme, difficulty: gameState.difficulty, volume: gameState.volume, animationsOn: gameState.animationsOn }; localStorage.setItem('ticTacToeSettings', JSON.stringify(settings)); }
function loadSettings() { try { const settings = JSON.parse(localStorage.getItem('ticTacToeSettings')); if (settings) { currentTheme = themes[settings.theme] ? settings.theme : 'default'; gameState.difficulty = settings.difficulty || 'normal'; gameState.volume = settings.volume !== undefined ? settings.volume : 0.5; gameState.animationsOn = settings.animationsOn !== undefined ? settings.animationsOn : true; } } catch (e) { console.error("讀取設定失敗:", e); } if (doc.settings.volume) doc.settings.volume.value = gameState.volume * 100; if (doc.settings.animations) doc.settings.animations.checked = gameState.animationsOn; applyTheme(); }

// --- 遊戲初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    Object.assign(doc, {
        body: document.body, themeText: document.getElementById('current-theme'),
        views: { main: document.getElementById('main-menu'), mode: document.getElementById('mode-selection'), difficulty: document.getElementById('difficulty'), settings: document.getElementById('sound-settings'), game: document.getElementById('game') },
        game: { board: document.getElementById('board'), scoreboard: document.getElementById('scoreboard'), turnIndicator: document.getElementById('turn-indicator') },
        modal: { container: document.getElementById('modal'), content: document.getElementById('modal-content'), text: document.getElementById('modal-text'), buttons: document.getElementById('modal-buttons') },
        settings: { volume: document.getElementById('volume'), animations: document.getElementById('animations-on') }
    });
    loadSettings();
    showElement('main');
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('mousedown', () => { playSound(sounds.press); btn.classList.add('pressed'); });
        btn.addEventListener('mouseup', () => { playSound(sounds.release); btn.classList.remove('pressed'); });
        btn.addEventListener('mouseleave', () => btn.classList.remove('pressed'));
    });
    if(doc.settings.volume) doc.settings.volume.addEventListener('input', adjustVolume);
    if(doc.settings.animations) doc.settings.animations.addEventListener('change', toggleAnimations);
});