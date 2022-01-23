const { expect } = require("chai");
const { ethers } = require("hardhat");

// var log = require('console-log-level')({ level: 'info' })

// `describe` is a Mocha function that allows you to organize your tests. It's
// not actually needed, but having your tests organized makes debugging them
// easier. All Mocha functions are available in the global scope.
// `describe` recieves the name of a section of your test suite, and a callback.
// The callback must define the tests of that section. This callback can't be
// an async function.
describe("SocialLending Contract", () => {

  let owner;
  let sender;
  let recipient1, addrs;

  beforeEach(async () => {
    // Get the ContractFactory and Signers here.
    SocialLending = await ethers.getContractFactory("SocialLending");
    [owner, sender, recipient1, recipient2, ...addrs] = await ethers.getSigners();

    SocialLendingContract = await SocialLending.deploy();

    await SocialLendingContract.deployed();
  });

  describe("Deployment", function () {
    
    it("Should set the right owner", async function () {
      expect(await SocialLendingContract.owner()).to.equal(owner.address);
    });

    it("Should only allow valid loan amounts", async function () {
        await expect(
            SocialLendingContract.connect(owner).createLoanId(0)
        ).to.be.revertedWith("Loan amount must be greater than zero.");

      });

      it("Should increment loan ID by 1", async function () {
        await expect(
        console.log( await  SocialLendingContract.connect(owner).createLoanId(100))).to.equal(0)
      });

      // it("Should increment loan ID by 1", async function () {
      //   await expect(

 
      //     console.log(await SocialLendingContract.connect(owner).createLoanId(100)))
      //       // SocialLendingContract.connect(owner).createLoanId(100).then(function (x) {
      //       //   console.log(x);
      //       // }))
      //   //).to.be.revertedWith("Loan amount must be greater than zero.");

      // });

  });

});
