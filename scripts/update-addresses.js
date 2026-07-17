const fs = require("fs");
const path = require("path");

/**
 * Script to update frontend contract addresses after deployment
 * Run after deploying to a network
 */

async function main() {
  const deploymentsDir = path.join(__dirname, "../deployments");
  const latestPath = path.join(deploymentsDir, "latest.json");
  const contractsPath = path.join(__dirname, "../src/lib/contracts.ts");

  if (!fs.existsSync(latestPath)) {
    console.error("No deployment found. Run deploy.js first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(latestPath, "utf8"));
  const chainId = deployment.chainId;

  console.log(`Updating contract addresses for chain ${chainId}...`);
  console.log(`  BountyBoard: ${deployment.contracts.BountyBoard.address}`);
  console.log(`  ReputationSystem: ${deployment.contracts.ReputationSystem.address}`);

  // Read contracts.ts
  let contractsContent = fs.readFileSync(contractsPath, "utf8");

  // Find and update the CONTRACT_ADDRESSES object
  const addressPattern = new RegExp(
    `(${chainId}: {[\\s\\S]*?bountyBoard: ")[^"]*(",[\\s\\S]*?reputationSystem: ")[^"]*(")`
  );

  if (addressPattern.test(contractsContent)) {
    contractsContent = contractsContent.replace(
      addressPattern,
      `$1${deployment.contracts.BountyBoard.address}$2${deployment.contracts.ReputationSystem.address}$3`
    );

    fs.writeFileSync(contractsPath, contractsContent);
    console.log("\nUpdated src/lib/contracts.ts");
  } else {
    console.log(`\nChain ID ${chainId} not found in contracts.ts`);
    console.log("Please add manually:");
    console.log(`  ${chainId}: {`);
    console.log(`    bountyBoard: "${deployment.contracts.BountyBoard.address}",`);
    console.log(`    reputationSystem: "${deployment.contracts.ReputationSystem.address}",`);
    console.log(`  },`);
  }

  // Also create a .env.local with addresses
  const envPath = path.join(__dirname, "../.env.local");
  const envContent = `# Contract addresses for chain ${chainId}
# Updated: ${deployment.timestamp}
NEXT_PUBLIC_BOUNTY_BOARD_ADDRESS=${deployment.contracts.BountyBoard.address}
NEXT_PUBLIC_REPUTATION_ADDRESS=${deployment.contracts.ReputationSystem.address}
NEXT_PUBLIC_CHAIN_ID=${chainId}
`;

  fs.writeFileSync(envPath, envContent);
  console.log("Created .env.local with contract addresses");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
