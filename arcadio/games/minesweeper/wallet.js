class WalletConnection {
    constructor() {
        this.isConnected = false;
        this.account = null;
        this.init();
    }

    async init() {
        // Check if MetaMask is installed
        if (typeof window.ethereum !== 'undefined') {
            // Check if already connected
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    this.account = accounts[0];
                    this.isConnected = true;
                    this.updateButtonState();
                }
            } catch (error) {
                console.error('Error checking wallet connection:', error);
            }

            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length > 0) {
                    this.account = accounts[0];
                    this.isConnected = true;
                } else {
                    this.account = null;
                    this.isConnected = false;
                }
                this.updateButtonState();
            });
        }
    }

    async connectWallet() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                this.account = accounts[0];
                this.isConnected = true;
                this.updateButtonState();
                return true;
            } catch (error) {
                console.error('Error connecting wallet:', error);
                return false;
            }
        } else {
            alert('MetaMask is not installed. Please install it to use this feature.');
            return false;
        }
    }

    updateButtonState() {
        const button = document.getElementById('walletButton');
        if (this.isConnected && this.account) {
            button.textContent = this.account.slice(0, 6) + '...' + this.account.slice(-4);
            button.classList.add('connected');
        } else {
            button.textContent = 'Connect Wallet';
            button.classList.remove('connected');
        }
    }
}

// Initialize wallet connection
const walletConnection = new WalletConnection();
