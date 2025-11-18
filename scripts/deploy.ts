import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { ethers } = hre;

async function main() {
  console.log("Starting deployment of DonationTracker contract...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "MATIC\n");

  // Deploy the contract
  console.log("Deploying DonationTracker...");
  const DonationTracker = await ethers.getContractFactory("DonationTracker");
  const donationTracker = await DonationTracker.deploy();

  await donationTracker.waitForDeployment();
  const contractAddress = await donationTracker.getAddress();

  console.log("✅ DonationTracker deployed to:", contractAddress);
  console.log("✅ Transaction hash:", donationTracker.deploymentTransaction()?.hash);
  console.log("✅ Owner:", await donationTracker.owner());

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    deploymentTime: new Date().toISOString(),
    transactionHash: donationTracker.deploymentTransaction()?.hash,
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  // Save deployment info to file
  const deploymentFile = path.join(deploymentsDir, `deployment-${deploymentInfo.network}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n✅ Deployment info saved to:", deploymentFile);

  // Create .env file with contract address
  const envExample = path.join(__dirname, "..", ".env.example");
  const envFile = path.join(__dirname, "..", ".env");

  if (fs.existsSync(envExample)) {
    let envContent = fs.readFileSync(envExample, "utf-8");
    envContent = envContent.replace(
      "VITE_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000",
      `VITE_CONTRACT_ADDRESS=${contractAddress}`
    );
    fs.writeFileSync(envFile, envContent);
    console.log("✅ .env file created with contract address\n");
  }

  console.log("========================================");
  console.log("IMPORTANT: Update your .env file with:");
  console.log(`VITE_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("========================================\n");

  // Verify on Polygonscan (if not localhost)
  if (process.env.POLYGONSCAN_API_KEY && deploymentInfo.network !== "localhost") {
    console.log("\nWaiting for block confirmations...");
    await donationTracker.deploymentTransaction()?.wait(6);

    console.log("Verifying contract on Polygonscan...");
    try {
      await (hre as any).run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on Polygonscan");
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ Contract already verified on Polygonscan");
      } else {
        console.log("❌ Error verifying contract:", error.message);
      }
    }
  }

  console.log("\n🎉 Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
