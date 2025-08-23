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
    // Автоматически показываем стартовое меню
    showStartMenu();
});

function showStartMenu() {
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';
}

class Tetris {
    constructor() {
        // Initialize game properties
        this.boardWidth = 10;
        this.boardHeight = 20;
        this.board = [];
        this.score = 0;
        this.gameOver = false;
        this.pieceCounter = 0;
        this.currentPiece = null;
        this.gameInterval = null;
        this.speed = 100;
        this.isPlaying = false;

        // Initialize rankings from localStorage
        this.rankings = JSON.parse(localStorage.getItem('tetrisRankings')) || [
            { wallet: '0x000...000', score: 0 },
            { wallet: '0x000...000', score: 0 },
            { wallet: '0x000...000', score: 0 },
            { wallet: '0x000...000', score: 0 },
            { wallet: '0x000...000', score: 0 }
        ];

        // Initialize ranking display
        this.updateRankingDisplay();

        // Initialize the game board
        for (let i = 0; i < this.boardHeight; i++) {
            this.board[i] = new Array(this.boardWidth).fill(null);
        }
        
        // Tetromino shapes
        this.tetrominoes = {
            'I': [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            'O': [
                [1, 1],
                [1, 1]
            ],
            'T': [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            'S': [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0]
            ],
            'Z': [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0]
            ],
            'J': [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            'L': [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0]
            ],
            'B': [
                [1]
            ]
        };

        this.setupBoard();
        this.setupControls();
        
        // Remove game-active class initially
        document.getElementById('game-board').classList.remove('game-active');
    }

    updateRankingDisplay() {
        const rankItems = document.querySelectorAll('.rank-item');
        this.rankings.forEach((ranking, index) => {
            if (rankItems[index]) {
                const walletSpan = rankItems[index].querySelector('.wallet');
                const scoreSpan = rankItems[index].querySelector('.score');
                if (walletSpan) walletSpan.textContent = ranking.wallet;
                if (scoreSpan) scoreSpan.textContent = ranking.score;
            }
        });
    }

    setupBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        
        for (let i = 0; i < this.boardHeight; i++) {
            for (let j = 0; j < this.boardWidth; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.setAttribute('data-row', i);
                cell.setAttribute('data-col', j);
                gameBoard.appendChild(cell);
            }
        }
    }

    setupControls() {
        window.onkeydown = (e) => {
            if (!this.isPlaying || this.gameOver) return;

            switch(e.code) {
                case 'KeyA':
                    this.movePiece(-1);
                    break;
                case 'KeyD':
                    this.movePiece(1);
                    break;
                case 'KeyW':
                    this.rotatePiece();
                    break;
            }
        };
    }

    createNewPiece() {
        this.pieceCounter++;
        let pieceType;
        
        // Каждая 7-я фигура будет черной
        if (this.pieceCounter % 7 === 0) {
            pieceType = 'B';
        } else {
            const pieces = Object.keys(this.tetrominoes).filter(type => type !== 'B');
            pieceType = pieces[Math.floor(Math.random() * pieces.length)];
        }
        
        this.currentPiece = {
            shape: JSON.parse(JSON.stringify(this.tetrominoes[pieceType])),
            type: pieceType,
            x: Math.floor(this.boardWidth / 2) - Math.floor(this.tetrominoes[pieceType][0].length / 2),
            y: 0
        };

        if (this.checkCollision()) {
            this.gameOver = true;
            this.isPlaying = false;
            clearInterval(this.gameInterval);
            // Update rankings when game is over
            this.updateRankings();
            // Remove game-active class when game is over
            document.getElementById('game-board').classList.remove('game-active');
            // Show restart menu with final score
            document.getElementById('finalScore').textContent = this.score;
            document.getElementById('continueOverlay').style.display = 'flex';
            return false;
        }
        return true;
    }

    updateRankings() {
        if (this.score > 0) {
            const walletConnection = window.walletConnection;
            const wallet = walletConnection && walletConnection.account ? walletConnection.account : '0x000...000';
            
            // Add current score to rankings
            this.rankings.push({ wallet: wallet, score: this.score });
            
            // Sort rankings by score in descending order
            this.rankings.sort((a, b) => b.score - a.score);
            
            // Keep only top 5 scores
            this.rankings = this.rankings.slice(0, 5);
            
            // Save to localStorage
            localStorage.setItem('tetrisRankings', JSON.stringify(this.rankings));
            
            // Update ranking display
            this.updateRankingDisplay();
        }
    }

    checkCollision() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardX = this.currentPiece.x + x;
                    const boardY = this.currentPiece.y + y;

                    if (boardX < 0 || boardX >= this.boardWidth || 
                        boardY >= this.boardHeight ||
                        (boardY >= 0 && this.board[boardY][boardX] !== null)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    movePiece(direction) {
        if (!this.currentPiece) return;
        
        this.currentPiece.x += direction;
        if (this.checkCollision()) {
            this.currentPiece.x -= direction;
        }
        this.updateBoard();
    }

    moveDown() {
        if (!this.currentPiece) return;

        this.currentPiece.y++;
        if (this.checkCollision()) {
            this.currentPiece.y--;
            this.lockPiece();
            if (!this.createNewPiece()) {
                return;
            }
        }
        this.updateBoard();
    }

    rotatePiece() {
        if (!this.currentPiece || this.currentPiece.type === 'B') return; // Черный квадрат не вращается

        const originalShape = JSON.parse(JSON.stringify(this.currentPiece.shape));
        const rotated = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[i]).reverse()
        );
        
        this.currentPiece.shape = rotated;
        if (this.checkCollision()) {
            this.currentPiece.shape = originalShape;
        }
        this.updateBoard();
    }

    lockPiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    if (boardY >= 0) {
                        // Если это черный квадратик, удаляем все фигуры вокруг
                        if (this.currentPiece.type === 'B') {
                            // Проверяем все клетки в радиусе 1
                            for (let i = -1; i <= 1; i++) {
                                for (let j = -1; j <= 1; j++) {
                                    const checkY = boardY + i;
                                    const checkX = this.currentPiece.x + x + j;
                                    if (checkY >= 0 && checkY < this.boardHeight &&
                                        checkX >= 0 && checkX < this.boardWidth &&
                                        this.board[checkY][checkX] !== null) {
                                        // Удаляем всю фигуру
                                        this.removeAdjacentPieces(checkY, checkX);
                                    }
                                }
                            }
                        } else {
                            // Добавляем текущую фигуру на доску только если это не черный квадрат
                            this.board[boardY][this.currentPiece.x + x] = this.currentPiece.type;
                        }
                    }
                }
            }
        }
        
        if (this.currentPiece.type !== 'B') {
            this.clearLines();
        }
    }

    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.boardHeight - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== null)) {
                this.board.splice(y, 1);
                this.board.unshift(new Array(this.boardWidth).fill(null));
                linesCleared++;
                y++; // Check the same row again
            }
        }

        if (linesCleared > 0) {
            this.updateScore(linesCleared);
        }
    }

    updateScore(linesCleared) {
        const points = [0, 100, 300, 500, 800]; // Points for 0, 1, 2, 3, 4 lines
        this.score += points[linesCleared];
        document.getElementById('score').textContent = this.score;
        
        // Update high score
        const highScore = parseInt(document.getElementById('highScore').textContent);
        if (this.score > highScore) {
            document.getElementById('highScore').textContent = this.score;
        }
    }

    removeAdjacentPieces(row, col) {
        // Находим все клетки фигуры и черный квадрат
        const visited = new Set();
        const toRemove = [];
        const type = this.board[row][col];
        
        if (type === null) return;
        
        const stack = [[row, col]];
        
        while (stack.length > 0) {
            const [currentRow, currentCol] = stack.pop();
            const key = `${currentRow},${currentCol}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            const currentType = this.board[currentRow][currentCol];
            if (currentType === type || currentType === 'B') {
                toRemove.push([currentRow, currentCol]);
                
                // Добавляем соседние клетки
                const directions = [
                    {x: -1, y: 0}, // слева
                    {x: 1, y: 0},  // справа
                    {x: 0, y: -1}, // сверху
                    {x: 0, y: 1}   // снизу
                ];
                
                directions.forEach(dir => {
                    const newRow = currentRow + dir.y;
                    const newCol = currentCol + dir.x;
                    
                    if (newRow >= 0 && newRow < this.boardHeight &&
                        newCol >= 0 && newCol < this.boardWidth) {
                        stack.push([newRow, newCol]);
                    }
                });
            }
        }
        
        // Удаляем все клетки фигуры и черный квадрат
        toRemove.forEach(([r, c]) => {
            this.board[r][c] = null;
        });
    }

    updateBoard() {
        // Clear the visual board
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.className = 'cell';
        });

        // Draw the locked pieces
        for (let y = 0; y < this.boardHeight; y++) {
            for (let x = 0; x < this.boardWidth; x++) {
                if (this.board[y][x] !== null) {
                    const cell = document.querySelector(`[data-row="${y}"][data-col="${x}"]`);
                    if (cell) {
                        cell.classList.add(`tetromino-${this.board[y][x]}`);
                    }
                }
            }
        }

        // Draw the current piece
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        const boardY = this.currentPiece.y + y;
                        const boardX = this.currentPiece.x + x;
                        if (boardY >= 0) {
                            const cell = document.querySelector(`[data-row="${boardY}"][data-col="${boardX}"]`);
                            if (cell) {
                                cell.classList.add(`tetromino-${this.currentPiece.type}`);
                            }
                        }
                    }
                }
            }
        }
    }

    reset() {
        // Clear the board
        for (let i = 0; i < this.boardHeight; i++) {
            this.board[i] = new Array(this.boardWidth).fill(null);
        }
        
        // Reset game state
        this.score = 0;
        this.gameOver = false;
        this.currentPiece = null;
        
        // Update display
        document.getElementById('score').textContent = '0';
        
        // Clear any existing interval
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
        
        // Remove game-active class
        document.getElementById('game-board').classList.remove('game-active');
        
        this.updateBoard();
    }
}

let game = new Tetris();

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startGame');
    const continueButton = document.getElementById('continueGame');
    
    startButton.addEventListener('click', startGame);
    continueButton.addEventListener('click', continueGame);
});

function startGame() {
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'none';

    if (game.isPlaying) {
        game.reset();
    }
    
    game.isPlaying = true;
    game.gameOver = false;
    
    document.getElementById('game-board').classList.add('game-active');
    
    const gameMusic = document.getElementById('gameMusic');
    if (gameMusic) {
        gameMusic.volume = 0.12;
        gameMusic.currentTime = 0;
        gameMusic.play();
    }
    
    if (game.createNewPiece()) {
        game.gameInterval = setInterval(() => game.moveDown(), game.speed);
    }
}

function continueGame() {
    const continueOverlay = document.getElementById('continueOverlay');
    continueOverlay.style.display = 'none';
    
    game.reset();
    game.isPlaying = true;
    game.gameOver = false;
    
    document.getElementById('game-board').classList.add('game-active');
    
    const gameMusic = document.getElementById('gameMusic');
    if (gameMusic) {
        gameMusic.volume = 0.12;
        gameMusic.currentTime = 0;
        gameMusic.play();
    }
    
    if (game.createNewPiece()) {
        game.gameInterval = setInterval(() => game.moveDown(), game.speed);
    }
}


