const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting Contract", function() {
  let Voting;
  let voting;
  let owner;
  let voter1;
  let voter2;

  beforeEach(async function() {
    [owner, voter1, voter2] = await ethers.getSigners();
    Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy(["Alice", "Bob", "Charlie"]);
    
    // Register test voters
    await voting.connect(owner).registerVoter(voter1.address);
    await voting.connect(owner).registerVoter(voter2.address);
    
    // Set voting period (now + 1min -> now + 1hr)
    const now = Math.floor(Date.now() / 1000);
    await voting.connect(owner).setVotingPeriod(now + 60, now + 3600);
  });

  describe("Deployment", function() {
    it("Should set the right admin", async function() {
      expect(await voting.admin()).to.equal(owner.address);
    });

    it("Should initialize with 3 candidates", async function() {
      expect(await voting.candidatesCount()).to.equal(3);
    });
  });

  describe("Voting", function() {
    it("Should allow registered voters to vote", async function() {
      await voting.connect(voter1).vote(1);
      const candidate = await voting.candidates(1);
      expect(candidate.voteCount).to.equal(1);
    });

    it("Should prevent unregistered voters from voting", async function() {
      const unregistered = (await ethers.getSigners())[3];
      await expect(voting.connect(unregistered).vote(1))
        .to.be.revertedWith("Not registered voter");
    });

    it("Should prevent voting outside the voting period", async function() {
      const now = Math.floor(Date.now() / 1000);
      await voting.connect(owner).setVotingPeriod(now + 1000, now + 2000);
      await expect(voting.connect(voter1).vote(1))
        .to.be.revertedWith("Voting not active");
    });

    it("Should track vote counts correctly", async function() {
      await voting.connect(voter1).vote(1);
      await voting.connect(voter2).vote(2);
      
      const candidate1 = await voting.candidates(1);
      const candidate2 = await voting.candidates(2);
      
      expect(candidate1.voteCount).to.equal(1);
      expect(candidate2.voteCount).to.equal(1);
    });
  });

  describe("Admin Functions", function() {
    it("Should only allow admin to add candidates", async function() {
      await expect(voting.connect(voter1).addCandidate("Dave"))
        .to.be.revertedWith("Only admin can perform this action");
    });

    it("Should allow admin to add new candidates", async function() {
      await voting.connect(owner).addCandidate("Dave");
      expect(await voting.candidatesCount()).to.equal(4);
    });
  });
});