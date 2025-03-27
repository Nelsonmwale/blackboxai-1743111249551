require('dotenv').config();
const express = require('express');
const Web3 = require('web3');
const path = require('path');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Set up Web3 connection
const web3 = new Web3(process.env.BLOCKCHAIN_URL || 'http://localhost:8545');
let votingContract;
let contractAddress;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Import contract ABI
const votingABI = require('./build/contracts/Voting.json').abi;

// Initialize contract
async function initializeContract() {
    try {
        // Get contract address from deployment (you may need to adjust this)
        const deployData = require('./build/contracts/Voting.json');
        contractAddress = deployData.networks[Object.keys(deployData.networks)[0]].address;
        
        votingContract = new web3.eth.Contract(votingABI, contractAddress);
        console.log('Connected to Voting contract at:', contractAddress);
    } catch (err) {
        console.error('Error initializing contract:', err);
        process.exit(1);
    }
}

// API Routes

// Get all candidates
app.get('/api/candidates', async (req, res) => {
    try {
        const candidateCount = await votingContract.methods.candidateCount().call();
        const candidates = [];
        
        for (let i = 1; i <= candidateCount; i++) {
            const candidate = await votingContract.methods.candidates(i).call();
            candidates.push({
                id: candidate.id,
                name: candidate.name,
                voteCount: candidate.voteCount
            });
        }
        
        res.json(candidates);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch candidates' });
    }
});

// Register voter
app.post('/api/register', async (req, res) => {
    try {
        const { voterAddress, name } = req.body;
        
        // Get admin account (first account in development)
        const accounts = await web3.eth.getAccounts();
        const admin = accounts[0];
        
        await votingContract.methods.registerVoter(voterAddress, name)
            .send({ from: admin });
            
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Voter registration failed' });
    }
});

// Cast vote
app.post('/api/vote', async (req, res) => {
    try {
        const { voterAddress, candidateId } = req.body;
        
        await votingContract.methods.vote(candidateId)
            .send({ from: voterAddress });
            
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Voting failed' });
    }
});

// Get results
app.get('/api/results', async (req, res) => {
    try {
        const candidateCount = await votingContract.methods.candidateCount().call();
        const results = [];
        
        for (let i = 1; i <= candidateCount; i++) {
            const candidate = await votingContract.methods.candidates(i).call();
            results.push({
                id: candidate.id,
                name: candidate.name,
                voteCount: candidate.voteCount
            });
        }
        
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch results' });
    }
});

// Start server
initializeContract().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});