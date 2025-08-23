// Check if device is mobile or tablet
function isMobileOrTablet() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android|blackberry|windows phone/g.test(userAgent);
    const isTablet = /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/g.test(userAgent);
    const isSmallScreen = window.innerWidth <= 900;
    const hasTouchScreen = navigator.maxTouchPoints > 0;
    
    return (isMobile || isTablet || (isSmallScreen && hasTouchScreen));
}

// Check device on page load
document.addEventListener('DOMContentLoaded', () => {
    if (isMobileOrTablet()) {
        document.getElementById('mobileOverlay').style.display = 'flex';
        return;
    }
    
    // Initialize game
    game = new Minesweeper();
    
    // Show start game overlay
    const overlay = document.getElementById('overlay');
    const gameOverOverlay = document.getElementById('gameOverOverlay');
    const startButton = document.getElementById('startGame');
    const newGameButton = document.getElementById('newGame');
    
    overlay.style.display = 'flex';
    
    startButton.addEventListener('click', () => {
        overlay.style.display = 'none';
        gameOverOverlay.style.display = 'none';
        game.setupBoard();
        game.gameOver = false;
        game.isFirstClick = true;
        game.timeRemaining = 60;
        game.score = 0;
        document.getElementById('time').textContent = '60';
        document.getElementById('mines').textContent = game.config.mines;
        document.getElementById('score').textContent = '0';
    });

    newGameButton.addEventListener('click', () => {
        gameOverOverlay.style.display = 'none';
        game.setupBoard();
        game.gameOver = false;
        game.isFirstClick = true;
        game.timeRemaining = 60;
        game.score = 0;
        document.getElementById('time').textContent = '60';
        document.getElementById('mines').textContent = game.config.mines;
        document.getElementById('score').textContent = '0';
    });
});

class Minesweeper {
    constructor() {
        this.config = { width: 16, height: 16, mines: 50 };
        this.board = [];
        this.mineLocations = new Set();
        this.revealed = new Set();
        this.flagged = new Set();
        this.gameOver = false;
        this.isFirstClick = true;
        this.timer = null;
        this.timeRemaining = 60;
        this.score = 0;
        this.pointsPerAction = 10;
        this.highScore = parseInt(localStorage.getItem('minesHighScore')) || 0;
        document.getElementById('highScore').textContent = this.highScore;

        // Initialize global rankings
        this.globalRankings = [
            { wallet: '0x000...000', score: 0 },
            { wallet: '0x000...000', score: 0 },
            { wallet: '0x000...000', score: 0 },
            { wallet: '0x000...000', score: 0 },
            { wallet: '0x000...000', score: 0 }
        ];

        this.setupBoard();
        this.setupControls();
        this.updateGlobalRankings();
    }

    setupBoard() {
        const { width, height } = this.config;
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        gameBoard.style.gridTemplateColumns = `repeat(${width}, 35px)`;
        
        this.board = [];
        this.mineLocations.clear();
        this.revealed.clear();
        this.flagged.clear();
        
        for (let y = 0; y < height; y++) {
            this.board[y] = [];
            for (let x = 0; x < width; x++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.setAttribute('data-x', x);
                cell.setAttribute('data-y', y);
                gameBoard.appendChild(cell);
                this.board[y][x] = {
                    isMine: false,
                    neighborMines: 0
                };
            }
        }
    }

    setupControls() {
        const gameBoard = document.getElementById('game-board');
        
        gameBoard.addEventListener('click', (e) => {
            if (this.gameOver) return;
            
            const cell = e.target;
            if (!cell.classList.contains('cell')) return;
            
            const x = parseInt(cell.getAttribute('data-x'));
            const y = parseInt(cell.getAttribute('data-y'));
            
            if (this.isFirstClick) {
                this.startGame(x, y);
            } else if (!this.flagged.has(`${x},${y}`)) {
                this.revealCell(x, y);
            }
        });

        gameBoard.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.gameOver || this.isFirstClick) return;
            
            const cell = e.target;
            if (!cell.classList.contains('cell')) return;
            
            const x = parseInt(cell.getAttribute('data-x'));
            const y = parseInt(cell.getAttribute('data-y'));
            
            this.toggleFlag(x, y);
        });
    }

    startGame(firstX, firstY) {
        const { width, height, mines } = this.config;
        
        while (this.mineLocations.size < mines) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            
            if ((x !== firstX || y !== firstY) && !this.mineLocations.has(`${x},${y}`)) {
                this.mineLocations.add(`${x},${y}`);
                this.board[y][x].isMine = true;
            }
        }

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (!this.board[y][x].isMine) {
                    this.board[y][x].neighborMines = this.countNeighborMines(x, y);
                }
            }
        }

        this.isFirstClick = false;
        this.startTimer();
        this.revealCell(firstX, firstY);

        const gameMusic = document.getElementById('gameMusic');
        gameMusic.volume = 0.12;
        gameMusic.currentTime = 0;
        gameMusic.play();
    }

    countNeighborMines(x, y) {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const newX = x + dx;
                const newY = y + dy;
                if (this.isValidCell(newX, newY) && this.board[newY][newX].isMine) {
                    count++;
                }
            }
        }
        return count;
    }

    isValidCell(x, y) {
        const { width, height } = this.config;
        return x >= 0 && x < width && y >= 0 && y < height;
    }

    revealCell(x, y) {
        if (!this.isValidCell(x, y) || this.revealed.has(`${x},${y}`) || this.flagged.has(`${x},${y}`)) {
            return;
        }

        const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        this.revealed.add(`${x},${y}`);
        cell.classList.add('revealed');

        if (this.board[y][x].isMine) {
            this.gameOver = true;
            this.revealAllMines();
            this.stopTimer();
            document.getElementById('finalScore').textContent = this.score;
            document.getElementById('gameOverOverlay').style.display = 'flex';
            this.updateGlobalRankings();
            stopGameMusic();
            document.getElementById('loseSound').play();
            this.score = 0;
            document.getElementById('score').textContent = '0';
            return;
        }

        this.score += this.pointsPerAction;
        document.getElementById('score').textContent = this.score;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('minesHighScore', this.highScore);
            document.getElementById('highScore').textContent = this.highScore;
        }
        document.getElementById('knopSound').play();

        const neighborMines = this.board[y][x].neighborMines;
        if (neighborMines > 0) {
            cell.textContent = neighborMines;
            cell.setAttribute('data-number', neighborMines);
        } else {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    this.revealCell(x + dx, y + dy);
                }
            }
        }

        this.checkWin();
    }

    toggleFlag(x, y) {
        if (this.revealed.has(`${x},${y}`)) return;

        const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        const key = `${x},${y}`;

        if (this.flagged.has(key)) {
            this.flagged.delete(key);
            cell.classList.remove('flagged');
            cell.textContent = '';
            if (this.board[y][x].isMine) {
                this.score -= this.pointsPerAction;
                document.getElementById('score').textContent = this.score;
            }
        } else {
            this.flagged.add(key);
            cell.classList.add('flagged');
            cell.textContent = '🚩';
            document.getElementById('clickSound').play();
            if (this.board[y][x].isMine) {
                this.score += this.pointsPerAction;
                document.getElementById('score').textContent = this.score;
            }
        }

        const remainingMines = this.config.mines - this.flagged.size;
        document.getElementById('mines').textContent = remainingMines;
    }

    revealAllMines() {
        this.mineLocations.forEach(loc => {
            const [x, y] = loc.split(',').map(Number);
            const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
            cell.classList.add('revealed', 'mine');
            cell.textContent = '💣';
        });
    }

    checkWin() {
        const { width, height, mines } = this.config;
        const totalCells = width * height;
        
        if (this.revealed.size === totalCells - mines) {
            this.gameOver = true;
            this.stopTimer();
            this.updateGlobalRankings();
            stopGameMusic();
            playTimedSound('winSound', 2000);
            document.getElementById('finalScore').textContent = this.score;
            document.getElementById('gameOverOverlay').style.display = 'flex';
        }
    }

    startTimer() {
        this.timeRemaining = 60;
        document.getElementById('time').textContent = this.timeRemaining;
        this.timer = setInterval(() => {
            this.timeRemaining--;
            document.getElementById('time').textContent = this.timeRemaining;
            if (this.timeRemaining <= 0) {
                this.gameOver = true;
                this.stopTimer();
                this.revealAllMines();
                this.updateGlobalRankings();
                stopGameMusic();
                playTimedSound('winSound', 2000);
                document.getElementById('finalScore').textContent = this.score;
                document.getElementById('gameOverOverlay').style.display = 'flex';
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    reset() {
        this.stopTimer();
        this.setupBoard();
        this.gameOver = false;
        this.isFirstClick = true;
        this.timeRemaining = 60;
        this.score = 0;
        document.getElementById('time').textContent = '60';
        document.getElementById('mines').textContent = this.config.mines;
        document.getElementById('score').textContent = '0';
        stopGameMusic();
    }

    updateGlobalRankings() {
        if (this.score > 0) {
            const walletConnection = window.walletConnection;
            const wallet = walletConnection && walletConnection.account ? walletConnection.account : '0x000...000';
            
            // Update global rankings
            const rankItems = document.querySelectorAll('.rank-item');
            let rankings = Array.from(rankItems).map(item => ({
                wallet: item.querySelector('.wallet').textContent,
                score: parseInt(item.querySelector('.score').textContent)
            }));

            rankings.push({ wallet, score: this.score });
            rankings.sort((a, b) => b.score - a.score);
            rankings = rankings.slice(0, 5);

            // Update ranking display
            rankings.forEach((rank, index) => {
                const rankItem = rankItems[index];
                if (rankItem) {
                    rankItem.querySelector('.wallet').textContent = rank.wallet;
                    rankItem.querySelector('.score').textContent = rank.score;
                }
            });
        }
    }
}

let game;

function playTimedSound(soundId, duration) {
    const sound = document.getElementById(soundId);
    sound.play();
    setTimeout(() => {
        sound.pause();
        sound.currentTime = 0;
    }, duration);
}

function stopGameMusic() {
    const gameMusic = document.getElementById('gameMusic');
    gameMusic.pause();
    gameMusic.currentTime = 0;
}
