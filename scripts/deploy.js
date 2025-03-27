const hre = require("hardhat");

async function main() {
  const initialCandidates = ["Candidate A", "Candidate B", "Candidate C"];
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(initialCandidates);

  await voting.waitForDeployment();

  console.log(
    `Voting contract deployed to ${voting.target}`
  );
  console.log(`Initial candidates: ${initialCandidates.join(", ")}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});