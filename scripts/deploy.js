const hre = require("hardhat");

async function main() {
  // Loads the compiled contract named "Message"
  const Heart2HelpFactory = await hre.ethers.getContractFactory("Heart2Help");

  // Deploys the contract to the blockchain
  console.log("Deploying contract...");
  heart2helpContract = await Heart2HelpFactory.deploy();
  await heart2helpContract.waitForDeployment();

  // Gets the deployed contract’s address
  const address = await heart2helpContract.getAddress();
  console.log("Contract deployed to:", address);
}

// If there’s an error, logs it and exits
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });