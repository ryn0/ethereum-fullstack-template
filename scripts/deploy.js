const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const SocialLendingContract = await hre.ethers.getContractFactory("SocialLending");
    const socialLendingContract = await SocialLendingContract.deploy();

    await socialLendingContract.deployed();
    console.log("SocialLending Contract address:", socialLendingContract.address);

    saveFrontendFiles(socialLendingContract);

}

function saveFrontendFiles(contract) {
    const fs = require("fs");
    const contractsDir = __dirname + "/../src/abis";

    if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir);
    }

    fs.writeFileSync(
        contractsDir + "/contract-address.json",
        JSON.stringify({ SocialLendingContract: contract.address }, undefined, 2)
    );

    const SocialLendingContractArtifact = artifacts.readArtifactSync("SocialLending");

    fs.writeFileSync(
        contractsDir + "/SocialLendingContract.json",
        JSON.stringify(SocialLendingContractArtifact, null, 2)
    );
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.log(error);
        process.exit(1);
    });