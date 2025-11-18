import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("DonationTracker Contract Interaction Script\n");

  // Load deployment info
  const network = (await ethers.provider.getNetwork()).name;
  const deploymentFile = path.join(__dirname, "..", "deployments", `deployment-${network}.json`);

  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ Deployment file not found. Please deploy the contract first.");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));
  const contractAddress = deploymentInfo.contractAddress;

  console.log("Network:", network);
  console.log("Contract Address:", contractAddress);
  console.log("");

  // Get contract instance
  const DonationTracker = await ethers.getContractFactory("DonationTracker");
  const contract = DonationTracker.attach(contractAddress);

  // Get signers
  const [owner, ngo1, ngo2, donor1] = await ethers.getSigners();

  console.log("Owner:", owner.address);
  console.log("NGO 1:", ngo1.address);
  console.log("NGO 2:", ngo2.address);
  console.log("Donor 1:", donor1.address);
  console.log("\n========================================\n");

  try {
    // 1. Register NGO
    console.log("1. Registering NGO...");
    const registerTx = await contract.connect(ngo1).registerNGO(
      "Test Food Bank India",
      "QmTestMetadata123",
      "A test food bank serving communities across India",
      "https://testfoodbank.org",
      "contact@testfoodbank.org"
    );
    await registerTx.wait();
    console.log("✅ NGO registered successfully");
    console.log("Transaction hash:", registerTx.hash);
    console.log("");

    // 2. Approve NGO (as owner)
    console.log("2. Approving NGO...");
    const approveTx = await contract.connect(owner).approveNGO(ngo1.address, true);
    await approveTx.wait();
    console.log("✅ NGO approved successfully");
    console.log("Transaction hash:", approveTx.hash);
    console.log("");

    // 3. Make a donation
    console.log("3. Making a donation...");
    const donationAmount = ethers.parseEther("0.1"); // 0.1 MATIC
    const donateTx = await contract.connect(donor1).donate(
      ngo1.address,
      "Supporting food distribution in Mumbai",
      { value: donationAmount }
    );
    await donateTx.wait();
    console.log("✅ Donation made successfully");
    console.log("Amount:", ethers.formatEther(donationAmount), "MATIC");
    console.log("Transaction hash:", donateTx.hash);
    console.log("");

    // 4. Get NGO details
    console.log("4. Fetching NGO details...");
    const ngoDetails = await contract.getNGO(ngo1.address);
    console.log("NGO Name:", ngoDetails.name);
    console.log("Total Received:", ethers.formatEther(ngoDetails.totalReceived), "MATIC");
    console.log("Approved:", ngoDetails.approved);
    console.log("");

    // 5. Get all donations
    console.log("5. Fetching all donations...");
    const donationIds = await contract.getAllDonations();
    console.log("Total Donations:", donationIds.length);

    if (donationIds.length > 0) {
      const lastDonation = await contract.getDonation(donationIds[donationIds.length - 1]);
      console.log("Last Donation:");
      console.log("  - Donor:", lastDonation.donor);
      console.log("  - NGO:", lastDonation.ngo);
      console.log("  - Amount:", ethers.formatEther(lastDonation.amount), "MATIC");
      console.log("  - Message:", lastDonation.message);
    }
    console.log("");

    // 6. Check pending withdrawal
    console.log("6. Checking pending withdrawal...");
    const pending = await contract.getPendingWithdrawal(ngo1.address);
    console.log("Pending Withdrawal:", ethers.formatEther(pending), "MATIC");
    console.log("");

    console.log("========================================");
    console.log("🎉 All interactions completed successfully!");
    console.log("========================================");

  } catch (error: any) {
    console.error("❌ Error during interaction:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
