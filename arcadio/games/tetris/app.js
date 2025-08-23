// Check if device is mobile or tablet
function isMobileDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android|blackberry|windows phone/g.test(userAgent);
    const isTablet = /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/g.test(userAgent);
    const isSmallScreen = window.innerWidth <= 900;
    const hasTouchScreen = navigator.maxTouchPoints > 0;
    
    console.log('Device detection:', {
        isMobile,
        isTablet,
        isSmallScreen,
        hasTouchScreen,
        width: window.innerWidth
    });
    
    // Показываем оверлей если это мобильное устройство, планшет или просто маленькое окно
    return (isMobile || isTablet || isSmallScreen);
}

function handleMobileOverlay() {
    console.log('Handling mobile overlay');
    const mobileOverlay = document.getElementById('mobileOverlay');
    if (!mobileOverlay) {
        console.error('Mobile overlay element not found!');
        return;
    }
    
    if (isMobileDevice()) {
        console.log('Showing mobile overlay');
        mobileOverlay.style.display = 'flex';
        // Pause game if it's running
        if (window.tetris && !window.tetris.gameOver) {
            // Add any game-specific pause logic here
        }
    } else {
        console.log('Hiding mobile overlay');
        mobileOverlay.style.display = 'none';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing mobile detection');
    
    // Initial mobile check
    handleMobileOverlay();
    
    // Add resize listener for dynamic mobile detection
    window.addEventListener('resize', handleMobileOverlay);
    
    // Don't initialize game if on mobile
    if (isMobileDevice()) {
        console.log('Mobile device detected, preventing game initialization');
        return;
    }
});
