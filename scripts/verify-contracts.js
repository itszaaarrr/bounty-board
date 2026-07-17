const hre = require("hardhat");

async function main() {
  console.log("Running contract verification & integration test...\n");

  const [deployer, user1, user2] = await hre.ethers.getSigners();

  console.log("Test accounts:");
  console.log("  Deployer:", deployer.address);
  console.log("  User1:", user1.address);
  console.log("  User2:", user2.address);
  console.log();

  // 1. Deploy contracts
  console.log("1. Deploying contracts...");
  const BountyBoard = await hre.ethers.getContractFactory("BountyBoard");
  const bountyBoard = await BountyBoard.deploy();
  await bountyBoard.waitForDeployment();
  const bountyBoardAddress = await bountyBoard.getAddress();
  console.log("   BountyBoard:", bountyBoardAddress);

  const ReputationSystem = await hre.ethers.getContractFactory("ReputationSystem");
  const reputationSystem = await ReputationSystem.deploy(bountyBoardAddress);
  await reputationSystem.waitForDeployment();
  const reputationAddress = await reputationSystem.getAddress();
  console.log("   ReputationSystem:", reputationAddress);

  // 2. Link contracts
  console.log("\n2. Linking contracts...");
  await (await bountyBoard.setReputationSystem(reputationAddress)).wait();
  console.log("   BountyBoard -> ReputationSystem: linked");
  console.log();

  // 3. Create bounty
  console.log("3. Creating a test bounty...");
  const deadline = Math.floor(Date.now() / 1000) + 86400 * 7;
  const reward = hre.ethers.parseEther("1.0");

  const tx1 = await bountyBoard.connect(deployer).createBounty(
    "Implement Dilithium Signature Verification",
    "Create a reference implementation of CRYSTALS-Dilithium signature verification.",
    "implementation",
    3, // Advanced
    deadline,
    { value: reward }
  );
  await tx1.wait();
  console.log("   Bounty created with ID: 1");
  console.log("   Reward:", hre.ethers.formatEther(reward), "ARM");
  console.log();

  // 4. Submit solution
  console.log("4. Submitting a solution...");
  const tx2 = await bountyBoard.connect(user1).submitSolution(
    1,
    "ipfs://QmTest123456789... Dilithium verification implementation"
  );
  await tx2.wait();
  console.log("   Submission created by:", user1.address);
  console.log();

  // 5. Check bounty status
  console.log("5. Checking bounty status...");
  const bounty = await bountyBoard.getBounty(1);
  const statusNames = ["Open", "InProgress", "UnderReview", "Completed", "Cancelled"];
  console.log("   Title:", bounty.title);
  console.log("   Status:", statusNames[bounty.status]);
  console.log("   Submissions:", bounty.submissionCount.toString());
  console.log();

  // 6. Approve submission
  console.log("6. Approving submission and paying reward...");
  const user1BalanceBefore = await hre.ethers.provider.getBalance(user1.address);

  const tx3 = await bountyBoard.connect(deployer).approveSubmission(
    1,
    "Excellent implementation! Correct and efficient."
  );
  await tx3.wait();

  const user1BalanceAfter = await hre.ethers.provider.getBalance(user1.address);
  const earned = user1BalanceAfter - user1BalanceBefore;
  console.log("   User1 earned:", hre.ethers.formatEther(earned), "ARM");
  console.log("   (After 5% platform fee)");
  console.log();

  // 7. Verify integration: check reputation
  console.log("7. Checking reputation integration...");
  const profile = await reputationSystem.getProfile(user1.address);
  console.log("   Total submissions:", profile.totalSubmissions.toString());
  console.log("   Approved:", profile.approvedSubmissions.toString());
  console.log("   Reputation points:", profile.reputationPoints.toString());
  console.log("   Total earnings:", hre.ethers.formatEther(profile.totalEarnings), "ARM");

  const [level, levelName] = await reputationSystem.getLevel(user1.address);
  console.log("   Level:", levelName, `(${level})`);
  console.log();

  // 8. Verify fee accounting
  console.log("8. Checking fee accounting...");
  const accFees = await bountyBoard.accumulatedFees();
  console.log("   Accumulated fees:", hre.ethers.formatEther(accFees), "ARM");

  const contractBalance = await hre.ethers.provider.getBalance(bountyBoardAddress);
  console.log("   Contract balance:", hre.ethers.formatEther(contractBalance), "ARM");
  console.log();

  // 9. Check final status
  console.log("9. Final verification...");
  const bountyFinal = await bountyBoard.getBounty(1);
  console.log("   Bounty status:", statusNames[bountyFinal.status]);

  const submission = await bountyBoard.getSubmission(1);
  const subStatusNames = ["Pending", "UnderReview", "Approved", "Rejected"];
  console.log("   Submission status:", subStatusNames[submission.status]);

  // Assertions
  const passed =
    bountyFinal.status === 3n && // Completed
    submission.status === 2n && // Approved
    profile.approvedSubmissions === 1n &&
    profile.reputationPoints === 4n && // Advanced = 4 points
    accFees === hre.ethers.parseEther("0.05");

  console.log();
  if (passed) {
    console.log("ALL VERIFICATION CHECKS PASSED!");
  } else {
    console.error("VERIFICATION FAILED - check values above");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
