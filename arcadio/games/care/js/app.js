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
    const game = new PixelRacer();

    // Add event listener for the start game button
    const startButton = document.getElementById('startGame');
    startButton.addEventListener('click', () => {
        console.log('Start Game button clicked'); // Log for debugging
        game.startGame(); // Call the startGame method
        document.getElementById('overlay').style.display = 'none'; // Hide the overlay
    });

    // Add event listener for the continue game button
    const continueButton = document.getElementById('continueGame');
    continueButton.addEventListener('click', () => {
        console.log('Continue Game button clicked'); // Log for debugging
        game.isGameRunning = true; // Set game state to running
        document.getElementById('continueOverlay').style.display = 'none'; // Hide continue overlay
        game.update(); // Resume the game loop
    });

    const controlButtons = document.querySelectorAll('.control-btn');
    controlButtons.forEach(button => {
        button.addEventListener('mousedown', () => {
            button.style.transform = 'scale(0.95)';
        });

        button.addEventListener('mouseup', () => {
            button.style.transform = 'scale(1)';
        });
    });

    // Handle window focus/blur
    window.addEventListener('blur', () => {
        if (game.isGameRunning && !game.isPaused) {
            game.isPaused = true;
            if (game.gameMusic) {
                game.gameMusic.pause();
            }
        }
    });

    window.addEventListener('focus', () => {
        if (game.isGameRunning && game.isPaused && game.lives > 0) {
            game.isPaused = false;
            if (game.gameMusic) {
                game.gameMusic.play().catch(console.error);
            }
            game.update();
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

    // Add particle effects when collecting coins
    function createParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            
            // Random direction and speed
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            const dx = Math.cos(angle) * speed;
            const dy = Math.sin(angle) * speed;
            
            document.body.appendChild(particle);
            
            let opacity = 1;
            const animate = () => {
                if (opacity <= 0) {
                    particle.remove();
                    return;
                }
                
                opacity -= 0.02;
                particle.style.opacity = opacity;
                particle.style.left = (parseFloat(particle.style.left) + dx) + 'px';
                particle.style.top = (parseFloat(particle.style.top) + dy) + 'px';
                
                requestAnimationFrame(animate);
            };
            
            requestAnimationFrame(animate);
        }
    }

    // Add this CSS for particles
    const style = document.createElement('style');
    style.textContent = `
        .particle {
            position: absolute;
            width: 8px;
            height: 8px;
            background: #ffd700;
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
        }
    `;
    document.head.appendChild(style);
});
