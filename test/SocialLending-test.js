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

      it("Should emit LoanRequested event when loan is created", async function () {
        await expect(
          SocialLendingContract.connect(sender).createLoanId(1000)
        ).to.emit(SocialLendingContract, "LoanRequested")
        .withArgs(1);
      });

      it("Should should get back correct loan values for first loan if one is created", async function () {
        await SocialLendingContract.connect(sender).createLoanId(1000);
        let loanDetails = await SocialLendingContract.loanDetails(1);
      
        expect(loanDetails.loanID).to.equal(1) && expect(loanDetails.loanAmount).to.equal(1000);
    });

      it("Should should get back correct loan values for second loan if two are created", async function () {
        await SocialLendingContract.connect(sender).createLoanId(1000);
        await SocialLendingContract.connect(sender).createLoanId(10000);
        let loanDetails2 = await SocialLendingContract.loanDetails(2);
      
        expect(loanDetails2.loanID).to.equal(2) && expect(loanDetails2.loanAmount).to.equal(10000);
    });
  });

});
