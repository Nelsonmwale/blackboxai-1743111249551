// Global state
let currentAccount = null;
let candidates = [];

// DOM elements
const walletBtn = document.getElementById('connect-wallet');
const registerForm = document.getElementById('registration-form');
const candidatesContainer = document.getElementById('candidates-container');
const resultsDisplay = document.getElementById('results-display');

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});

// Connect to MetaMask
async function connectWallet() {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            currentAccount = accounts[0];
            document.getElementById('wallet-address').textContent = 
                `${currentAccount.substring(0, 6)}...${currentAccount.substring(38)}`;
            loadData();
        } catch (err) {
            console.error('Error connecting to MetaMask:', err);
            showError('Failed to connect wallet. Please try again.');
        }
    } else {
        showError('Please install MetaMask to use this application!');
    }
}

// Load initial data
async function loadData() {
    try {
        // Load candidates
        const response = await fetch('/api/candidates');
        if (!response.ok) throw new Error('Failed to fetch candidates');
        candidates = await response.json();
        
        displayCandidates();
        displayResults();
    } catch (err) {
        console.error('Error loading data:', err);
        showError('Failed to load voting data. Please refresh the page.');
    }
}

// Display candidates
function displayCandidates() {
    candidatesContainer.innerHTML = '';
    
    candidates.forEach(candidate => {
        const card = document.createElement('div');
        card.className = 'candidate-card';
        card.dataset.id = candidate.id;
        card.innerHTML = `
            <img src="https://randomuser.me/api/portraits/${candidate.id % 2 === 0 ? 'men' : 'women'}/${candidate.id}.jpg" 
                 alt="${candidate.name}" class="candidate-img">
            <h3>${candidate.name}</h3>
            <p>Votes: ${candidate.voteCount}</p>
        `;
        card.addEventListener('click', () => castVote(candidate.id));
        candidatesContainer.appendChild(card);
    });
}

// Display results
function displayResults() {
    resultsDisplay.innerHTML = '';
    
    candidates.forEach(candidate => {
        const maxVotes = Math.max(...candidates.map(c => c.voteCount));
        const percentage = maxVotes > 0 ? (candidate.voteCount / maxVotes) * 100 : 0;
        
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.innerHTML = `
            <div class="result-name">${candidate.name}</div>
            <div class="result-bar" style="width: ${percentage}%"></div>
            <div class="result-count">${candidate.voteCount}</div>
        `;
        resultsDisplay.appendChild(resultItem);
    });
}

// Cast vote
async function castVote(candidateId) {
    if (!currentAccount) {
        showError('Please connect your wallet first!');
        return;
    }

    try {
        const response = await fetch('/api/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                voterAddress: currentAccount,
                candidateId: candidateId
            })
        });

        if (!response.ok) throw new Error('Voting failed');
        
        showSuccess('Vote cast successfully!');
        loadData(); // Refresh data
    } catch (err) {
        console.error('Error casting vote:', err);
        showError('Failed to cast vote. ' + err.message);
    }
}

// Register voter
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!currentAccount) {
        showError('Please connect your wallet first!');
        return;
    }

    const formData = new FormData(registerForm);
    const voterData = {
        voterAddress: currentAccount,
        name: formData.get('voter-name'),
        email: formData.get('voter-email')
    };

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(voterData)
        });

        if (!response.ok) throw new Error('Registration failed');
        
        showSuccess('Registration successful!');
        registerForm.reset();
    } catch (err) {
        console.error('Error registering voter:', err);
        showError('Registration failed. ' + err.message);
    }
});

// Helper functions
function showError(message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.textContent = message;
    document.body.appendChild(errorEl);
    setTimeout(() => errorEl.remove(), 5000);
}

function showSuccess(message) {
    const successEl = document.createElement('div');
    successEl.className = 'success-message';
    successEl.textContent = message;
    document.body.appendChild(successEl);
    setTimeout(() => successEl.remove(), 5000);
}

// Initialize
if (walletBtn) {
    walletBtn.addEventListener('click', connectWallet);
}

// Check if wallet is already connected
window.addEventListener('load', async () => {
    if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            currentAccount = accounts[0];
            document.getElementById('wallet-address').textContent = 
                `${currentAccount.substring(0, 6)}...${currentAccount.substring(38)}`;
            loadData();
        }
    }
});