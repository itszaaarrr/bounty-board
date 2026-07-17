const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying Armchain Bounty Board contracts...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", hre.ethers.formatEther(balance), "ARM\n");

  // 1. Deploy BountyBoard
  console.log("1. Deploying BountyBoard...");
  const BountyBoard = await hre.ethers.getContractFactory("BountyBoard");
  const bountyBoard = await BountyBoard.deploy();
  await bountyBoard.waitForDeployment();
  const bountyBoardAddress = await bountyBoard.getAddress();
  console.log("   BountyBoard deployed to:", bountyBoardAddress);

  // 2. Deploy ReputationSystem with BountyBoard address
  console.log("\n2. Deploying ReputationSystem...");
  const ReputationSystem = await hre.ethers.getContractFactory("ReputationSystem");
  const reputationSystem = await ReputationSystem.deploy(bountyBoardAddress);
  await reputationSystem.waitForDeployment();
  const reputationAddress = await reputationSystem.getAddress();
  console.log("   ReputationSystem deployed to:", reputationAddress);

  // 3. Link BountyBoard -> ReputationSystem
  console.log("\n3. Linking BountyBoard to ReputationSystem...");
  const linkTx = await bountyBoard.setReputationSystem(reputationAddress);
  await linkTx.wait();
  console.log("   BountyBoard now references ReputationSystem");

  // Verify the link
  const linkedRepAddr = await bountyBoard.reputationSystem();
  const linkedBBAddr = await reputationSystem.bountyBoard();
  console.log("   BountyBoard.reputationSystem =", linkedRepAddr);
  console.log("   ReputationSystem.bountyBoard =", linkedBBAddr);

  if (linkedRepAddr !== reputationAddress || linkedBBAddr !== bountyBoardAddress) {
    console.error("ERROR: Contract linking verification failed!");
    process.exit(1);
  }

  // Save deployment info
  const deployment = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      BountyBoard: {
        address: bountyBoardAddress,
      },
      ReputationSystem: {
        address: reputationAddress,
      },
    },
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `deployment-${hre.network.name}-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deployment, null, 2)
  );

  fs.writeFileSync(
    path.join(deploymentsDir, "latest.json"),
    JSON.stringify(deployment, null, 2)
  );

  console.log("\n--- Deployment Summary ---");
  console.log("BountyBoard:      ", bountyBoardAddress);
  console.log("ReputationSystem: ", reputationAddress);
  console.log("Integration:       Linked");
  console.log("\nDeployment saved to:", filename);
  console.log("\nDone!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
