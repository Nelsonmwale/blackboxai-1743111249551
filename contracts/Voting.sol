// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedCandidateId;
    }

    address public admin;
    mapping(uint => Candidate) public candidates;
    mapping(address => Voter) public voters;
    uint public candidatesCount;
    uint public votingStart;
    uint public votingEnd;

    event VoterRegistered(address voter);
    event VoteCast(address voter, uint candidateId);
    event VotingPeriodSet(uint start, uint end);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor(string[] memory candidateNames) {
        admin = msg.sender;
        for (uint i = 0; i < candidateNames.length; i++) {
            addCandidate(candidateNames[i]);
        }
    }

    function addCandidate(string memory name) public onlyAdmin {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, name, 0);
    }

    function registerVoter(address voter) public onlyAdmin {
        require(!voters[voter].isRegistered, "Voter already registered");
        voters[voter] = Voter(true, false, 0);
        emit VoterRegistered(voter);
    }

    function setVotingPeriod(uint start, uint end) public onlyAdmin {
        require(start < end, "Invalid voting period");
        votingStart = start;
        votingEnd = end;
        emit VotingPeriodSet(start, end);
    }

    function vote(uint candidateId) public {
        require(voters[msg.sender].isRegistered, "Not registered voter");
        require(!voters[msg.sender].hasVoted, "Already voted");
        require(block.timestamp >= votingStart && block.timestamp <= votingEnd, "Voting not active");
        require(candidateId > 0 && candidateId <= candidatesCount, "Invalid candidate");

        voters[msg.sender].hasVoted = true;
        voters[msg.sender].votedCandidateId = candidateId;
        candidates[candidateId].voteCount++;
        
        emit VoteCast(msg.sender, candidateId);
    }

    function getCandidate(uint id) public view returns (uint, string memory, uint) {
        return (candidates[id].id, candidates[id].name, candidates[id].voteCount);
    }
}