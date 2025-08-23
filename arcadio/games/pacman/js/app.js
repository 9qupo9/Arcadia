// Wait for DOM to load
function isMobileOrTablet() {
    // Check using user agent
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUA = /iphone|ipad|ipod|android|blackberry|windows phone/g.test(userAgent);
    const isTabletUA = /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/g.test(userAgent);
    
    // Check using screen width
    const isSmallScreen = window.innerWidth <= 900;
    
    // Check using touch points
    const hasTouchScreen = navigator.maxTouchPoints > 0;
    
    return (isMobileUA || isTabletUA || (isSmallScreen && hasTouchScreen));
}

document.addEventListener('DOMContentLoaded', () => {
    // Check if device is mobile or tablet
    if (isMobileOrTablet()) {
        const mobileOverlay = document.getElementById('mobileOverlay');
        mobileOverlay.style.display = 'flex';
        return; // Stop further execution on mobile devices
    }

    // Initialize game
    const game = new PacmanGame('gameCanvas');

    // Update high score when wallet connects
    async function updateHighScore() {
        if (walletManager.isConnected()) {
            const highScore = await walletManager.getHighScore();
            document.getElementById('highScore').textContent = highScore;
        }
    }

    // Listen for wallet connection
    const connectButton = document.getElementById('connectWallet');
    const originalButtonText = connectButton.innerHTML;

    connectButton.addEventListener('click', async () => {
        connectButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
        
        try {
            const connected = await walletManager.connectWallet();
            if (connected) {
                await updateHighScore();
            } else {
                connectButton.innerHTML = originalButtonText;
            }
        } catch (error) {
            console.error('Connection error:', error);
            connectButton.innerHTML = originalButtonText;
        }
    });

    // Add visual feedback to control buttons
    const controlButtons = document.querySelectorAll('.control-btn');
    controlButtons.forEach(button => {
        button.addEventListener('mousedown', () => {
            button.style.transform = 'scale(0.95)';
        });

        button.addEventListener('mouseup', () => {
            button.style.transform = 'scale(1)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
        });
    });

    // Add hover animations to social buttons
    const socialButtons = document.querySelectorAll('.social-btn');
    socialButtons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
        });
    });

    // Handle window focus/blur
    window.addEventListener('blur', () => {
        if (game.isGameRunning) {
            game.endGame();
        }
    });

    // Handle mobile touch events for controls
    let touchStartY = 0;
    let touchStartX = 0;

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, false);

    document.addEventListener('touchmove', (e) => {
        if (!touchStartX || !touchStartY) return;

        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;

        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Require a minimum swipe distance to trigger direction change
        const minSwipeDistance = 30;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                    game.handleKeyPress({ key: 'ArrowRight' });
                } else {
                    game.handleKeyPress({ key: 'ArrowLeft' });
                }
                touchStartX = touchEndX;
                touchStartY = touchEndY;
            }
        } else {
            // Vertical swipe
            if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0) {
                    game.handleKeyPress({ key: 'ArrowDown' });
                } else {
                    game.handleKeyPress({ key: 'ArrowUp' });
                }
                touchStartX = touchEndX;
                touchStartY = touchEndY;
            }
        }
    }, false);

    document.addEventListener('touchend', () => {
        touchStartX = null;
        touchStartY = null;
    }, false);

    // Prevent scrolling while playing on mobile
    document.addEventListener('touchmove', (e) => {
        if (game.isGameRunning) {
            e.preventDefault();
        }
    }, { passive: false });
});
