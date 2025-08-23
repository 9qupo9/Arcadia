class PacmanGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isGameRunning = false;
        this.score = 0;
        this.lives = 3;
        this.lastScoreUpdateTime = 0;  // Add this line to track when score was last updated
        this.scoreUpdateInterval = 5000;
        
        this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
        document.getElementById('highScore').textContent = this.highScore;

        // Game entitie
        this.pacman = null;
        this.ghosts = [];
        this.maze = [];
        
        // Game settings
        this.cellSize = 0; // Will be calculated based on screen size
        this.mazeWidth = 28;
        this.mazeHeight = 31;
        this.fps = 60;
        this.animationId = null;
        
        // Colors
        this.colors = {
            maze: '#2121DE',
            background: '#000',
            pacman: '#FFCC00',
            ghosts: ['#FF0000', '#00FFDE', '#FFB8DE', '#FFB847'],
            text: '#FFFFFF'
        };

        this.fps = 60;
        this.moveInterval = 300;
        this.lastMoveTime = 0;
        
        // Initialize game
        this.initCanvas();
        this.createMaze();
        this.addEventListeners();
        this.showStartScreen();
        
        // Handle window resize
        window.addEventListener('resize', () => this.initCanvas());


        this.music = new Audio('./bit.mp3');
        this.music.loop = true;
        this.music.volume = 0.12;

        this.deathSound = new Audio('./Dead.mp3');
        this.deathSound.volume = 0.12;
    }
    
    initCanvas() {
        const gameBoard = document.querySelector('.game-board');
        this.canvas.width = gameBoard.clientWidth;
        this.canvas.height = gameBoard.clientHeight;
        
        // Calculate cell size based on maze dimensions and canvas size
        const cellSizeX = this.canvas.width / this.mazeWidth;
        const cellSizeY = this.canvas.height / this.mazeHeight;
        this.cellSize = Math.min(cellSizeX, cellSizeY);
        
        // Redraw if game is running
        if (this.isGameRunning) {
            this.drawMaze();
        }
    }
    
    createMaze() {
        // Simple maze layout (0 = empty path, 1 = wall)
        // This is a simplified version of a standard Pacman maze
        this.maze = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
            [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
            [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
            [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
            [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1],
            [1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1],
            [1,1,1,1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,0,0,0,1],
            [1,1,1,1,1,1,0,1,1,0,1,1,1,0,0,1,1,1,0,1,1,0,1,1,1,1,0,1],
            [1,1,1,1,1,1,0,1,1,0,1,0,0,0,0,0,0,1,0,1,1,0,1,1,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,1,1,0,1,1,0,1,0,0,0,0,0,0,1,0,1,1,0,1,1,1,1,1,1],
            [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1],
            [1,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,1,1,1,1],
            [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1],
            [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
            [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
            [1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1],
            [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
            [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
            [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
            [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
            [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
    }
    
    addEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Control buttons
        const controlButtons = document.querySelectorAll('.control-btn');
        controlButtons.forEach(button => {
            button.addEventListener('mousedown', () => {
                this.handleKeyPress({ key: button.getAttribute('data-key') });
            });
        });
        
        // Start game button
        const startButton = document.getElementById('startGame');
        if (startButton) {
            startButton.addEventListener('click', () => this.startGame());
        }
    }
    
    handleKeyPress(e) {
        if (!this.isGameRunning) return;
    
        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.pacman.nextDirection = 'up';
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.pacman.nextDirection = 'down';
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.pacman.nextDirection = 'left';
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.pacman.nextDirection = 'right';
                break;
        }
    }
    
    
    showStartScreen() {
        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    showContinueOverlay() {
        const overlay = document.getElementById('overlay');
        const menu = overlay.querySelector('.menu');
        
        const title = menu.querySelector('h1');
        title.textContent = 'YOU LOST A LIFE';
        
        const startBtn = menu.querySelector('#startGame');
        startBtn.textContent = 'Continue';
        
        const instructions = menu.querySelector('.instructions');
        if (instructions) {
            instructions.innerHTML = '';
        }
        
        overlay.style.display = 'flex';
    }
    
    hideOverlay() {
        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
    
    startGame() {
        this.hideOverlay();

        this.music.play();

        const startBtn = document.getElementById('startGame');
        
        if (startBtn.textContent.trim() === 'Continue') {
            this.resetPositions();
        } else {
            this.resetGame();
        }
        this.isGameRunning = true;
        this.animationId = requestAnimationFrame((ts) => this.gameLoop(ts));
    }
    
    
    resetGame() {
        this.score = 0;
        this.lives = 3;

        this.pacman = {
            x: 14,
            y: 23,
            prevX: 14,
            prevY: 23,
            direction: 'right',
            nextDirection: 'right',
            mouthAngle: 0,
            mouthOpen: true
        };
        
       this.ghosts = [];
        const ghostStartPositions = [
            {x: 13, y: 14},
            {x: 14, y: 14},
            {x: 13, y: 15},
            {x: 14, y: 15}
        ];
        
        ghostStartPositions.forEach((pos, index) => {
            this.ghosts.push({
                x: pos.x,
                y: pos.y,
                prevX: pos.x,
                prevY: pos.y,
                direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)],
                color: this.colors.ghosts[index]
            });
        });
        
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
    }
    
    
    
    gameLoop(timestamp) {
        if (!this.lastMoveTime) {
            this.lastMoveTime = timestamp;
            this.lastScoreUpdateTime = timestamp;  // Initialize score timer
        }
        
        const dt = timestamp - this.lastMoveTime;
        
        // Update score based on time spent in maze
        if (timestamp - this.lastScoreUpdateTime >= this.scoreUpdateInterval) {
            this.score += 10;
            document.getElementById('score').textContent = this.score;
            this.lastScoreUpdateTime = timestamp;
            this.updateHighScore();
        }

        if (dt >= this.moveInterval) {
            this.pacman.prevX = this.pacman.x;
            this.pacman.prevY = this.pacman.y;
            this.ghosts.forEach(ghost => {
                ghost.prevX = ghost.x;
                ghost.prevY = ghost.y;
            });
            
            this.update(); 
            this.lastMoveTime = timestamp;
        }
        
        const progress = (timestamp - this.lastMoveTime) / this.moveInterval;
        
        this.render(progress);
        
        if (this.isGameRunning) {
            this.animationId = requestAnimationFrame((ts) => this.gameLoop(ts));
        }
    }
    
    update() {
        this.updatePacman();
        this.updateGhosts();
        this.checkCollisions();
    }

    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
            document.getElementById('highScore').textContent = this.highScore;
            if (window.walletManager && window.walletManager.isConnected()) {
                window.walletManager.updateHighScore(this.score);
            }
        }
    }

    isWall(x, y) {
        if (y === 14 && (x < 0 || x >= this.mazeWidth)) return false;
        
        if (x < 0 || x >= this.mazeWidth || y < 0 || y >= this.mazeHeight) {
            return true;
        }
        
        return this.maze[y][x] === 1;
    }
    
    updatePacman() {
        this.pacman.oldX = this.pacman.x;
        this.pacman.oldY = this.pacman.y;
        
        if (this.pacman.nextDirection !== this.pacman.direction) {
            const nextCell = this.getNextCell(this.pacman.x, this.pacman.y, this.pacman.nextDirection);
            if (!this.isWall(nextCell.x, nextCell.y)) {
                this.pacman.direction = this.pacman.nextDirection;
            }
        }
        
        const nextCell = this.getNextCell(this.pacman.x, this.pacman.y, this.pacman.direction);
        if (!this.isWall(nextCell.x, nextCell.y)) {
            this.pacman.x = nextCell.x;
            this.pacman.y = nextCell.y;
        }
        
        if (this.pacman.y === 14) {
            if (this.pacman.x < 0) this.pacman.x = this.mazeWidth - 1;
            if (this.pacman.x >= this.mazeWidth) this.pacman.x = 0;
        }
        
        if (this.pacman.mouthOpen) {
            this.pacman.mouthAngle += 0.1;
            if (this.pacman.mouthAngle > 0.4) this.pacman.mouthOpen = false;
        } else {
            this.pacman.mouthAngle -= 0.1;
            if (this.pacman.mouthAngle < 0.05) this.pacman.mouthOpen = true;
        }
        
    }
    
    updateGhosts() {
        this.ghosts.forEach(ghost => {
            ghost.oldX = ghost.x;
            ghost.oldY = ghost.y;
            
            if (Math.random() < 0.8) {
                const possibleDirections = ['up', 'down', 'left', 'right'];
                const oppositeDir = this.getOppositeDirection(ghost.direction);
                const availableDirections = possibleDirections.filter(dir => {
                    if (dir === oppositeDir) return false;
                    const testCell = this.getNextCell(ghost.x, ghost.y, dir);
                    return !this.isWall(testCell.x, testCell.y);
                });
                if (availableDirections.length > 0) {
                    ghost.direction = availableDirections[Math.floor(Math.random() * availableDirections.length)];
                }
            }
            
            const nextCell = this.getNextCell(ghost.x, ghost.y, ghost.direction);
            if (!this.isWall(nextCell.x, nextCell.y)) {
                ghost.x = nextCell.x;
                ghost.y = nextCell.y;
            } else {
                const possibleDirections = ['up', 'down', 'left', 'right'];
                const availableDirections = possibleDirections.filter(dir => {
                    const testCell = this.getNextCell(ghost.x, ghost.y, dir);
                    return !this.isWall(testCell.x, testCell.y);
                });
                if (availableDirections.length > 0) {
                    ghost.direction = availableDirections[Math.floor(Math.random() * availableDirections.length)];
                }
            }
            
            if (ghost.y === 14) {
                if (ghost.x < 0) ghost.x = this.mazeWidth - 1;
                if (ghost.x >= this.mazeWidth) ghost.x = 0;
            }
        });    
    }    
    
    checkCollisions() {
        const pacmanOldX = Math.floor(this.pacman.oldX);
        const pacmanOldY = Math.floor(this.pacman.oldY);
        const pacmanNewX = Math.floor(this.pacman.x);
        const pacmanNewY = Math.floor(this.pacman.y);
    
        for (const ghost of this.ghosts) {
            const ghostOldX = Math.floor(ghost.oldX);
            const ghostOldY = Math.floor(ghost.oldY);
            const ghostNewX = Math.floor(ghost.x);
            const ghostNewY = Math.floor(ghost.y);
            
            if (pacmanNewX === ghostNewX && pacmanNewY === ghostNewY) {
                this.handleCollision();
                return;
            }
            
            if (pacmanOldX === ghostNewX && pacmanOldY === ghostNewY &&
                ghostOldX === pacmanNewX && ghostOldY === pacmanNewY) {
                this.handleCollision();
                return;
            }
        }
    }
    
    handleCollision() {
        this.music.pause();
        this.music.currentTime = 0;

        this.deathSound.play()
        setTimeout(() => {
            this.deathSound.pause();
            this.deathSound.currentTime = 0; // Reset sound
        }, 2000); // Play for 2 seconds

        this.lives--;
        document.getElementById('lives').textContent = this.lives;
        if (this.lives <= 0) {
            this.endGame();
        } else {
            this.showContinueOverlay();
            this.isGameRunning = false;
            cancelAnimationFrame(this.animationId);
        }
    }
    
    
    
    resetPositions() {
        // Reset Pacman position
        this.pacman.x = 14;
        this.pacman.y = 23;
        this.pacman.direction = 'right';
        this.pacman.nextDirection = 'right';

        // Reset ghost positions
        const ghostStartPositions = [
            {x: 13, y: 14}, // Red ghost
            {x: 14, y: 14}, // Pink ghost
            {x: 13, y: 15}, // Blue ghost
            {x: 14, y: 15}  // Orange ghost
        ];
        
        this.ghosts.forEach((ghost, index) => {
            ghost.x = ghostStartPositions[index].x;
            ghost.y = ghostStartPositions[index].y;
            ghost.direction = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
        });
    }
    
    endGame() {
        this.isGameRunning = false;
        cancelAnimationFrame(this.animationId);
        
        // Show game over screen
        const overlay = document.getElementById('overlay');
        if (overlay) {
            const menu = overlay.querySelector('.menu');
            const gameTitle = menu.querySelector('h1');
            const startButton = menu.querySelector('#startGame');
            
            gameTitle.textContent = 'GAME OVER';
            startButton.textContent = 'Play Again';
            overlay.style.display = 'flex';

            const instructions = menu.querySelector('.instructions');
            instructions.innerHTML = `
                <p>Final Score: ${this.score}</p>
                <p>High Score: ${this.highScore}</p>
            `;
        }
    }
    
    render(progress) {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const interpPacmanX = this.pacman.prevX + (this.pacman.x - this.pacman.prevX) * progress;
        const interpPacmanY = this.pacman.prevY + (this.pacman.y - this.pacman.prevY) * progress;
        
        this.ghosts.forEach(ghost => {
            ghost.interpX = ghost.prevX + (ghost.x - ghost.prevX) * progress;
            ghost.interpY = ghost.prevY + (ghost.y - ghost.prevY) * progress;
        });
        
        const worldWidth = this.mazeWidth * this.cellSize;
        const worldHeight = this.mazeHeight * this.cellSize;
        let camX = (interpPacmanX + 0.5) * this.cellSize;
        let camY = (interpPacmanY + 0.5) * this.cellSize;
        let offsetX = camX - this.canvas.width / 2;
        let offsetY = camY - this.canvas.height / 2;
        
        if (this.canvas.width > worldWidth) {
            offsetX = -(this.canvas.width - worldWidth) / 2;
        } else {
            offsetX = Math.max(0, Math.min(offsetX, worldWidth - this.canvas.width));
        }
        
        if (this.canvas.height > worldHeight) {
            offsetY = -(this.canvas.height - worldHeight) / 2;
        } else {
            offsetY = Math.max(0, Math.min(offsetY, worldHeight - this.canvas.height));
        }
        
        this.ctx.save();
        this.ctx.translate(-offsetX, -offsetY);
        
        this.drawMaze();
        
        this.ctx.fillStyle = this.colors.pacman;
        this.ctx.beginPath();
        const pacmanCenterX = (interpPacmanX + 0.5) * this.cellSize;
        const pacmanCenterY = (interpPacmanY + 0.5) * this.cellSize;
        const pacmanRadius = this.cellSize * 0.4;
        let startAngle = 0, endAngle = 2 * Math.PI;
        switch (this.pacman.direction) {
            case 'right':
                startAngle = this.pacman.mouthAngle;
                endAngle = 2 * Math.PI - this.pacman.mouthAngle;
                break;
            case 'left':
                startAngle = Math.PI + this.pacman.mouthAngle;
                endAngle = 3 * Math.PI - this.pacman.mouthAngle;
                break;
            case 'up':
                startAngle = 1.5 * Math.PI + this.pacman.mouthAngle;
                endAngle = 3.5 * Math.PI - this.pacman.mouthAngle;
                break;
            case 'down':
                startAngle = 0.5 * Math.PI + this.pacman.mouthAngle;
                endAngle = 2.5 * Math.PI - this.pacman.mouthAngle;
                break;
        }
        this.ctx.arc(pacmanCenterX, pacmanCenterY, pacmanRadius, startAngle, endAngle);
        this.ctx.lineTo(pacmanCenterX, pacmanCenterY);
        this.ctx.fill();
        
        this.ghosts.forEach(ghost => {
            const ghostX = (ghost.interpX + 0.5) * this.cellSize;
            const ghostY = (ghost.interpY + 0.5) * this.cellSize;
            const ghostRadius = this.cellSize * 0.4;
            this.ctx.fillStyle = ghost.color;
            this.ctx.beginPath();
            this.ctx.arc(ghostX, ghostY, ghostRadius, Math.PI, 0, false);
            const waveHeight = ghostRadius * 0.4;
            this.ctx.lineTo(ghostX + ghostRadius, ghostY + ghostRadius);
            this.ctx.lineTo(ghostX + ghostRadius - (ghostRadius/3), ghostY + ghostRadius - waveHeight);
            this.ctx.lineTo(ghostX + ghostRadius - (2*ghostRadius/3), ghostY + ghostRadius);
            this.ctx.lineTo(ghostX, ghostY + ghostRadius);
            this.ctx.lineTo(ghostX - (2*ghostRadius/3), ghostY + ghostRadius - waveHeight);
            this.ctx.lineTo(ghostX - ghostRadius + (ghostRadius/3), ghostY + ghostRadius);
            this.ctx.lineTo(ghostX - ghostRadius, ghostY + ghostRadius);
            this.ctx.lineTo(ghostX - ghostRadius, ghostY);
            this.ctx.fill();
            
            this.ctx.fillStyle = 'white';
            const eyeRadius = ghostRadius * 0.3;
            const eyeOffsetX = ghostRadius * 0.3;
            this.ctx.beginPath();
            this.ctx.arc(ghostX - eyeOffsetX, ghostY - eyeOffsetX / 2, eyeRadius, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(ghostX + eyeOffsetX, ghostY - eyeOffsetX / 2, eyeRadius, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.fillStyle = 'blue';
            const pupilRadius = eyeRadius * 0.5;
            let pupilOffsetX = 0, pupilOffsetY = 0;
            switch (ghost.direction) {
                case 'left':  pupilOffsetX = -pupilRadius; break;
                case 'right': pupilOffsetX = pupilRadius;  break;
                case 'up':    pupilOffsetY = -pupilRadius; break;
                case 'down':  pupilOffsetY = pupilRadius;  break;
            }
            this.ctx.beginPath();
            this.ctx.arc(ghostX - eyeOffsetX + pupilOffsetX, ghostY - eyeOffsetX / 2 + pupilOffsetY, pupilRadius, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(ghostX + eyeOffsetX + pupilOffsetX, ghostY - eyeOffsetX / 2 + pupilOffsetY, pupilRadius, 0, 2 * Math.PI);
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }
    
    
    drawMaze() {
        for (let y = 0; y < this.mazeHeight; y++) {
            for (let x = 0; x < this.mazeWidth; x++) {
                if (this.maze[y][x] === 1) {
                    this.ctx.fillStyle = this.colors.maze;
                    this.ctx.fillRect(
                        x * this.cellSize,
                        y * this.cellSize,
                        this.cellSize,
                        this.cellSize
                    );
                }
            }
        }
    }
    
    // Helper methods
    getNextCell(x, y, direction) {
        switch (direction) {
            case 'up':
                return { x: x, y: y - 1 };
            case 'down':
                return { x: x, y: y + 1 };
            case 'left':
                return { x: x - 1, y: y };
            case 'right':
                return { x: x + 1, y: y };
            default:
                return { x, y };
        }
    }
    
    
    getOppositeDirection(direction) {
        switch (direction) {
            case 'up': return 'down';
            case 'down': return 'up';
            case 'left': return 'right';
            case 'right': return 'left';
            default: return direction;
        }
    }
}