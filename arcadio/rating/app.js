// Function to create an empty player slot
function createEmptyPlayerSlot(rank) {
    return `
        <div class="player-item">
            <span class="player-rank">#${rank}</span>
            <span class="player-name">-</span>
            <span class="player-score">-</span>
        </div>
    `;
}

// Function to create a player item HTML
function createPlayerItem(player) {
    return `
        <div class="player-item">
            <span class="player-rank">#${player.rank}</span>
            <span class="player-name">${player.name}</span>
            <span class="player-score">${player.score.toLocaleString()} pts</span>
        </div>
    `;
}

// Function to populate a leaderboard with empty slots
function populateEmptyLeaderboard(leaderboardElement) {
    let content = '';
    for (let i = 1; i <= 500; i++) {
        content += createEmptyPlayerSlot(i);
    }
    leaderboardElement.innerHTML = content;
}

// Function to populate a leaderboard
function populateLeaderboard(gameType) {
    const leaderboardElement = document.getElementById(`${gameType}-leaderboard`);
    
    // Initially populate with empty slots
    populateEmptyLeaderboard(leaderboardElement);

    // When smart contracts are ready, this function will be updated to fetch and display real data
    // For now, we're just showing the empty slots grid
}

// Function to initialize all leaderboards
function initializeLeaderboards() {
    const gameTypes = ['tetris', 'snake', 'racing', 'minesweeper', 'puzzle', 'arcade'];
    
    // Initialize each game's leaderboard
    gameTypes.forEach(gameType => {
        populateLeaderboard(gameType);
    });
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', initializeLeaderboards);
