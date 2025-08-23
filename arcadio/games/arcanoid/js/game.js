class ArkanoidGame {
    constructor(canvasId) {
        // Canvas setup
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Store original dimensions for scaling reference
        this.originalDimensions = null;
        
        // Game elements
        this.paddle = {
            width: 125,
            height: 25,
            x: 0, // Will be set in setupCanvas
            y: 0, // Will be set in setupCanvas
            speed: 8,
            dx: 0
        };
    
        this.ball = {
            radius: 8,
            x: 0, // Will be set in setupCanvas
            y: 0, // Will be set in setupCanvas
            speed: 6,
            dx: 6,
            dy: -6
        };
    
        // Brick configuration
        this.brickRowCount = 5;
        this.brickColumnCount = 9;
        this.brickWidth = 60;
        this.brickHeight = 20;
        this.brickPadding = 5;
        this.brickOffsetTop = 60;
        this.brickOffsetLeft = 0; // Will be calculated in setupCanvas
        
        // Setup canvas first to initialize dimensions
        this.setupCanvas();
        
        // Create bricks after canvas setup
        this.bricks = this.createBricks();
    
        // Game state
        this.score = 0;
        this.lives = 3;
        this.highScore = parseInt(localStorage.getItem('arkanoidHighScore')) || 0;
        this.isGameRunning = false;
        this.gameOver = false;
        this.isGamePaused = false;

        // Controls
        this.rightPressed = false;
        this.leftPressed = false;
    
        // Bind event handlers
        this.keyDownHandler = this.keyDownHandler.bind(this);
        this.keyUpHandler = this.keyUpHandler.bind(this);
        
        // Initialize sound
        this.music = new Audio('./bit.mp3');
        this.music.loop = true;
        this.music.volume = 0.12;

        this.deathSound = new Audio('./Dead.mp3');
        this.deathSound.volume = 0.12;

        // Init the game
        this.init();
    }

    setupCanvas() {
        // Make canvas responsive to game board container
        const resizeCanvas = () => {
            const gameBoard = document.querySelector('.game-board');
            const boardWidth = gameBoard.clientWidth;
            const boardHeight = gameBoard.clientHeight;
            
            // Store original dimensions as reference if not already stored
            if (!this.originalDimensions) {
                this.originalDimensions = {
                    canvasWidth: 600, // Assuming default width
                    canvasHeight: 450, // Assuming default height
                    paddleWidth: this.paddle.width,
                    paddleHeight: this.paddle.height,
                    ballRadius: this.ball.radius,
                    brickWidth: this.brickWidth,
                    brickHeight: this.brickHeight,
                    brickPadding: this.brickPadding,
                    brickOffsetTop: this.brickOffsetTop
                };
            }
            
            // Set canvas dimensions
            this.canvas.width = boardWidth;
            this.canvas.height = boardHeight;
            
            // Calculate scale factors
            const scaleX = boardWidth / this.originalDimensions.canvasWidth;
            const scaleY = boardHeight / this.originalDimensions.canvasHeight;
            
            // Scale game elements
            this.scaleGameElements(scaleX, scaleY);
            
            // Reset paddle and ball positions with scaled dimensions
            if (this.paddle) {
                this.paddle.x = this.canvas.width / 2 - this.paddle.width / 2;
                this.paddle.y = this.canvas.height - 30 * scaleY;
            }
            
            if (this.ball) {
                this.ball.x = this.canvas.width / 2;
                this.ball.y = this.canvas.height - 50 * scaleY;
            }
            
            // Recalculate brick layout with scaled dimensions
            if (this.bricks) {
                this.brickOffsetLeft = (this.canvas.width - (this.brickColumnCount * (this.brickWidth + this.brickPadding) - this.brickPadding)) / 2;
                this.bricks = this.createBricks();
            }
        };
    
        // Initial setup
        resizeCanvas();
        
        // Handle window resize
        window.addEventListener('resize', resizeCanvas);
    }

    scaleGameElements(scaleX, scaleY) {
        // Scale paddle dimensions
        this.paddle.width = this.originalDimensions.paddleWidth * scaleX;
        this.paddle.height = this.originalDimensions.paddleHeight * scaleY;
        this.paddle.speed = 8 * scaleX; // Scale paddle speed
    
        // Scale ball dimensions and speed
        this.ball.radius = this.originalDimensions.ballRadius * Math.min(scaleX, scaleY);
        this.ball.speed = 4 * Math.min(scaleX, scaleY);
        this.ball.dx = this.ball.dx > 0 ? this.ball.speed : -this.ball.speed;
        this.ball.dy = this.ball.dy > 0 ? this.ball.speed : -this.ball.speed;
    
        // Scale brick dimensions
        this.brickWidth = this.originalDimensions.brickWidth * scaleX;
        this.brickHeight = this.originalDimensions.brickHeight * scaleY;
        this.brickPadding = this.originalDimensions.brickPadding * Math.min(scaleX, scaleY);
        this.brickOffsetTop = this.originalDimensions.brickOffsetTop * scaleY;
    }

    createBricks() {
        const bricks = [];
        const cryptoColors = [
            {color: '#F7931A', points: 10}, // Bitcoin orange
            {color: '#627EEA', points: 20}, // Ethereum blue
            {color: '#26A17B', points: 5},  // Tether green
            {color: '#3CC8C8', points: 15}, // Chainlink blue
            {color: '#F0B90B', points: 25}  // Binance yellow
        ];
    
        // Calculate total width needed for all bricks
        const totalBrickWidth = this.brickColumnCount * this.brickWidth + (this.brickColumnCount - 1) * this.brickPadding;
        
        // Calculate left offset to center the brick grid horizontally
        this.brickOffsetLeft = (this.canvas.width - totalBrickWidth) / 2;
        
        // Calculate total height needed for all brick rows
        const totalBrickHeight = this.brickRowCount * this.brickHeight + (this.brickRowCount - 1) * this.brickPadding;
        
        // Calculate top offset to position brick grid vertically (keeping some space from top)
        this.brickOffsetTop = Math.max(60, (this.canvas.height * 0.3 - totalBrickHeight) / 2);
    
        for (let c = 0; c < this.brickColumnCount; c++) {
            bricks[c] = [];
            for (let r = 0; r < this.brickRowCount; r++) {
                const brickX = c * (this.brickWidth + this.brickPadding) + this.brickOffsetLeft;
                const brickY = r * (this.brickHeight + this.brickPadding) + this.brickOffsetTop;
                const colorInfo = cryptoColors[r % cryptoColors.length];
                
                // Add special coins randomly (5% chance)
                const isCoin = Math.random() < 0.05;
                // Assign a random coin color for special effect
                const randomColorInfo = cryptoColors[Math.floor(Math.random() * cryptoColors.length)];
                const coinColor = isCoin ? randomColorInfo.color : null;
                
                bricks[c][r] = { 
                    x: brickX, 
                    y: brickY, 
                    status: 1, 
                    color: colorInfo.color,
                    points: colorInfo.points,
                    isCoin: isCoin,
                    coinColor: coinColor
                };
            }
        }

        console.log(bricks);
        return bricks;
    }

    init() {
        // Event listeners
        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);
        
        // Update UI
        this.updateScoreDisplay();
        this.updateLivesDisplay();
        this.updateHighScoreDisplay();
        
        // Start game button
        const startGameBtn = document.getElementById('startGame');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => {
                this.startGame();
            });
        }
    }

    startGame() {
        if (!this.isGameRunning && !this.isGamePaused) {
            this.resetGame();
        }
        
        this.isGameRunning = true;
        this.isGamePaused = false;
        document.getElementById('overlay').style.display = 'none';
        this.gameLoop();
        
        // Play Background Music
        this.music.play(); // Play background music

        // In case when Player immediately restart level
        this.deathSound.pause();
        this.deathSound.currentTime = 0;
    }

    endGame() {
        // Pause the game
        this.isGameRunning = false;
        
        this.isGamePaused = true;

        // Show pause overlay
        const overlay = document.getElementById('overlay');
        const menu = overlay.querySelector('.menu');
        
        // Update menu for pause
        const title = menu.querySelector('h1');
        title.textContent = 'GAME PAUSED';
        
        const startBtn = menu.querySelector('#startGame');
        startBtn.textContent = 'Resume Game';
        
        // Show overlay
        overlay.style.display = 'flex';

        this.music.pause();
    }

    resetGame() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height - 50;
        this.ball.dx = 6;
        this.ball.dy = -6;
        this.paddle.x = this.canvas.width / 2 - this.paddle.width / 2;
        this.bricks = this.createBricks();
        
        if(this.gameOver){
            this.score = 0;
            this.lives = 3;
            this.gameOver = false;
            
            this.updateScoreDisplay();
            this.updateLivesDisplay();
        }
    }    

    // Game loop
    gameLoop() {
        if (!this.isGameRunning) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawPaddle();
        this.drawBricks();
        this.drawBall();
        
        this.collisionDetection();
        this.moveBall();
        this.movePaddle();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    // Draw methods
    drawBall() {
        this.ctx.save(); // Save current context state
        
        // Set up neon glow for the ball
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#FFFFFF'; 

        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fill();
        this.ctx.closePath();
        
        this.ctx.restore(); // Restore context state
    }

    drawPaddle() {
        this.ctx.save(); // Save current context state
    
        // Set up neon glow for paddle border
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#3F51B5';
    
        // Draw only the border (no fill)
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#3F51B5';
        this.ctx.lineWidth = 6;
        this.ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 5);
        this.ctx.stroke();
        this.ctx.closePath();
    
        // Set up neon glow for text
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#FFFFFF';
    
        // Draw text with neon effect
        const fontSize = Math.max(10, Math.floor(this.paddle.height * 0.4));
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('CRYPTO', this.paddle.x + this.paddle.width / 2, this.paddle.y + this.paddle.height / 2 + fontSize * 0.4);
    
        this.ctx.restore(); // Restore context state
    }
    
    drawBricks() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                const brick = this.bricks[c][r];
                if (brick.status === 1) {
                    const neonColor = brick.color;
    
                    this.ctx.save();

                    this.ctx.shadowBlur = 15;
                    this.ctx.shadowColor = neonColor;
        
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = neonColor;
                    this.ctx.lineWidth = 6;
                    this.ctx.roundRect(brick.x, brick.y, this.brickWidth, this.brickHeight, 3);
                    this.ctx.stroke();
                    this.ctx.closePath();
        
                    this.ctx.restore();
    
                    if (brick.isCoin) {
                        this.ctx.save();
        
                        this.ctx.shadowBlur = 10;
                        this.ctx.shadowColor = brick.coinColor;
        
                        this.ctx.beginPath();
                        this.ctx.arc(brick.x + this.brickWidth / 2, brick.y + this.brickHeight / 2, 7, 0, Math.PI * 2);
                        this.ctx.fillStyle = brick.coinColor;
                        this.ctx.fill();
                        this.ctx.strokeStyle = "#FFF";
                        this.ctx.lineWidth = 3;
                        this.ctx.stroke();
        
                        this.ctx.restore();
                    }
                }
            }
        }
    }
        
    // Movement and physics
    moveBall() {
        // Ball movement
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        // Wall collision (right/left)
        if (this.ball.x + this.ball.radius > this.canvas.width || this.ball.x - this.ball.radius < 0) {
            this.ball.dx = -this.ball.dx;
        }
        
        // Wall collision (top)
        if (this.ball.y - this.ball.radius < 0) {
            this.ball.dy = -this.ball.dy;
        }
        
        // Bottom collision (life lost)
        if (this.ball.y + this.ball.radius > this.canvas.height) {
            this.lives--;
            this.updateLivesDisplay();
            
            // Reset background music
            this.music.pause();
            this.music.currentTime = 0;

            // Play death sound
            this.deathSound.play(); // Play death sound
            setTimeout(() => {
                this.deathSound.pause();
                this.deathSound.currentTime = 0; // Reset sound
            }, 2000); // Play for 2 seconds

            if (this.lives <= 0) {
                this.gameOver = true;
                this.isGameRunning = false;
                this.showGameOver();
            } else {
                this.isGameRunning = false;
                this.showContinueOverlay();
            }
        }
        
        // Paddle collision
        if (
            this.ball.y + this.ball.radius > this.paddle.y &&
            this.ball.y - this.ball.radius < this.paddle.y + this.paddle.height &&
            this.ball.x > this.paddle.x &&
            this.ball.x < this.paddle.x + this.paddle.width
        ) {
            // Calculate where the ball hit the paddle (0 to 1)
            const hitPosition = (this.ball.x - this.paddle.x) / this.paddle.width;
            
            // Calculate angle based on hit position (-60 to 60 degrees)
            const angle = (hitPosition * 120 - 60) * Math.PI / 180;
            
            // Calculate new velocity with consistent speed
            const speed = Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy);
            this.ball.dx = speed * Math.sin(angle);
            this.ball.dy = -speed * Math.cos(angle);
            
        }
    }

    movePaddle() {
        // Keyboard controls
        if (this.rightPressed) {
            this.paddle.x = Math.min(this.paddle.x + this.paddle.speed, this.canvas.width - this.paddle.width);
        } else if (this.leftPressed) {
            this.paddle.x = Math.max(this.paddle.x - this.paddle.speed, 0);
        }
    }

    collisionDetection() {
        let allBricksDestroyed = true;
        
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                const brick = this.bricks[c][r];
                
                if (brick.status === 1) {
                    allBricksDestroyed = false;
                    
                    // Check for collision
                    if (
                        this.ball.x > brick.x && 
                        this.ball.x < brick.x + this.brickWidth &&
                        this.ball.y > brick.y && 
                        this.ball.y < brick.y + this.brickHeight
                    ) {
                        this.ball.dy = -this.ball.dy;
                        brick.status = 0;
                        
                        let pointsEarned = brick.points || 10; // Default 10 if points not found

                        console.log(brick.color, brick.points);

                        // If it's a coin, change all bricks to its color
                        if (brick.isCoin && brick.coinColor) {
                            this.changeBricksColor(brick.coinColor);
                        }
                        
                        // Double points for coins
                        if (brick.isCoin) {
                            pointsEarned *= 2;
                        }
                        
                        // Update score
                        const previousScore = this.score;
                        this.score += pointsEarned;
                        this.updateScoreDisplay();
                        
                        // Check if the score crossed a 100-point threshold
                        if (Math.floor(previousScore / 100) < Math.floor(this.score / 100)) {
                            this.accelerateBall();
                        }
                        
                        // Check high score
                        if (this.score > this.highScore) {
                            this.highScore = this.score;
                            localStorage.setItem('arkanoidHighScore', this.highScore);
                            this.updateHighScoreDisplay();
                        }
                    }
                }
            }
        }
        
        // Level complete
        if (allBricksDestroyed) {
            this.levelUp();
        }
    }

    changeBricksColor(newColor) {
        const cryptoColors = [
            {color: '#F7931A', points: 10}, // Bitcoin orange
            {color: '#627EEA', points: 20}, // Ethereum blue
            {color: '#26A17B', points: 5},  // Tether green
            {color: '#3CC8C8', points: 15}, // Chainlink blue
            {color: '#F0B90B', points: 25}  // Binance yellow
        ];
        
        const colorInfo = cryptoColors.find(c => c.color === newColor);
        
        if (!colorInfo) {
            console.warn("404");
            return;
        }
    
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                if (this.bricks[c][r].status === 1) {
                    this.bricks[c][r].color = newColor;
                    this.bricks[c][r].points = colorInfo.points; // Update points
                }
            }
        }
    }
    
    accelerateBall() {
        // Increase ball speed by 5%
        const speedIncrease = 1.05;
        
        // Calculate current speed
        const currentSpeed = Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy);
        
        // Calculate new speed
        const newSpeed = currentSpeed * speedIncrease;
        
        // Maintain direction while increasing speed
        const angle = Math.atan2(this.ball.dy, this.ball.dx);
        this.ball.dx = Math.cos(angle) * newSpeed;
        this.ball.dy = Math.sin(angle) * newSpeed;
        
        console.log(`Ball accelerated to speed: ${newSpeed.toFixed(2)}`);
    }

    levelUp() {
        // Reset ball and paddle
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height - 50;
        this.paddle.x = (this.canvas.width - this.paddle.width) / 2;
        
        // Create new bricks
        this.bricks = this.createBricks();
    }

    // Input handlers
    keyDownHandler(e) {
        if (e.code === 'KeyD' || e.code === 'ArrowRight') {
            this.rightPressed = true;
            this.highlightControlButton(e.code);
        } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
            this.leftPressed = true;
            this.highlightControlButton(e.code);
        }
        
        // Spacebar to start/restart
        if (e.code === 'Space' && (!this.isGameRunning || this.gameOver)) {
            this.startGame();
        }
    }

    keyUpHandler(e) {
        if (e.code === 'KeyD' || e.code === 'ArrowRight') {
            this.rightPressed = false;
            this.unhighlightControlButton('KeyD');
        } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
            this.leftPressed = false;
            this.unhighlightControlButton('KeyA');
        }
    }

    // UI helpers
    highlightControlButton(keyCode) {
        const button = document.querySelector(`.control-btn[data-key="${keyCode}"]`);
        if (button) button.classList.add('active');
    }

    unhighlightControlButton(keyCode) {
        const button = document.querySelector(`.control-btn[data-key="${keyCode}"]`);
        if (button) button.classList.remove('active');
    }

    updateScoreDisplay() {
        const scoreElement = document.getElementById('score');
        if (scoreElement) scoreElement.textContent = this.score;
    }

    updateLivesDisplay() {
        const livesElement = document.getElementById('lives');
        if (livesElement) livesElement.textContent = this.lives;
    }

    updateHighScoreDisplay() {
        const highScoreElement = document.getElementById('highScore');
        if (highScoreElement) highScoreElement.textContent = this.highScore;
    }

    showGameOver() {
        const overlay = document.getElementById('overlay');
        const menu = overlay.querySelector('.menu');
        
        // Update menu for game over
        const title = menu.querySelector('h1');
        title.textContent = 'GAME OVER';
        
        const startBtn = menu.querySelector('#startGame');
        startBtn.textContent = 'Play Again';
        
        const instructions = menu.querySelector('.instructions');
        instructions.innerHTML = `
            <p>Final Score: ${this.score}</p>
            <p>High Score: ${this.highScore}</p>
        `;
        
        // Show overlay
        overlay.style.display = 'flex';
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
}