class WalletManager {
    constructor(contractAddress, contractABI) {
        this.provider = null;
        this.signer = null;
        this.address = null;
        this.contract = null;
        this.connectButton = document.getElementById('connectWallet');
        this.walletAddress = document.getElementById('walletAddress');
        this.contractAddress = contractAddress;
        this.contractABI = contractABI;
        
        this.init();
    }

    async init() {
        if (typeof window.ethereum !== 'undefined') {
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.setupEventListeners();
        } else {
            this.connectButton.innerHTML = 'Connect Wallet';
            this.connectButton.disabled = true;
        }
    }

    setupEventListeners() {
        this.connectButton.addEventListener('click', () => this.connectWallet());
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                this.handleDisconnect();
            } else {
                this.handleAccountChange(accounts[0]);
            }
        });
        window.ethereum.on('chainChanged', () => {
            window.location.reload();
        });
    }

    async connectWallet() {
        if (this.isConnected()) {
            // If wallet is connected, disconnect it
            this.handleDisconnect();
            return true;
        }
        
        try {
            const accounts = await this.provider.send('eth_requestAccounts', []);
            this.signer = this.provider.getSigner();
            this.address = accounts[0];
            this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.signer);
            
            this.updateUIOnConnect();
            this.updateLeaderboardUI();
            return true;
        } catch (error) {
            console.error('Error connecting wallet:', error);
            return false;
        }
    }

    async saveHighScore(score) {
        if (!this.isConnected() || !score) return;
        try {
            const tx = await this.contract.saveScore(score);
            await tx.wait();
            console.log('High score saved:', score);
            this.updateLeaderboardUI();
        } catch (error) {
            console.error('Error saving high score:', error);
        }
    }

    async getLeaderboard() {
        if (!this.isConnected()) return [];
        try {
            const leaderboard = await this.contract.getLeaderboard();
            return leaderboard.map(player => ({
                address: player.playerAddress,
                score: player.highScore.toNumber()
            })).sort((a, b) => b.score - a.score);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }
    }

    async updateLeaderboardUI() {
        const leaderboard = await this.getLeaderboard();
        const playerRanks = document.querySelectorAll('.top-players .player-rank');
        
        playerRanks.forEach((rank, index) => {
            if (leaderboard[index]) {
                rank.querySelector('.player-address').textContent = this.formatAddress(leaderboard[index].address);
                rank.querySelector('.player-score').textContent = leaderboard[index].score;
            } else {
                rank.querySelector('.player-address').textContent = '0x000...000';
                rank.querySelector('.player-score').textContent = '0';
            }
        });
    }

    handleDisconnect() {
        this.signer = null;
        this.address = null;
        this.updateUIOnDisconnect();
    }

    handleAccountChange(newAccount) {
        this.address = newAccount;
        this.updateUIOnConnect();
        this.updateLeaderboardUI();
    }

    updateUIOnConnect() {
        this.connectButton.innerHTML = '<i class="fas fa-wallet"></i> Disconnect Wallet';
        this.connectButton.classList.add('connected');
        this.walletAddress.style.display = 'block';
        this.walletAddress.textContent = this.formatAddress(this.address);
    }

    updateUIOnDisconnect() {
        this.connectButton.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
        this.connectButton.classList.remove('connected');
        this.walletAddress.style.display = 'none';
    }

    formatAddress(address) {
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    isConnected() {
        return this.signer !== null;
    }
}

const contractAddress = "0x5bAc476E88b8652d8BAc0687d4db20fcC4E9fBfD";
const contractABI = [
    "function saveScore(uint256 score) external",
    "function getLeaderboard() view returns (tuple(address playerAddress, uint256 highScore)[])"
];
const walletManager = new WalletManager(contractAddress, contractABI);

document.addEventListener("DOMContentLoaded", () => {
    walletManager.updateLeaderboardUI();
});
