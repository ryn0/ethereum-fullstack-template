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

  const LoanStatus = {
    NotFunded: 0,
    PartiallyFunded: 1,
    NeedsRepayment: 2,
    Repaid: 3,
    FailedToRepayByDeadline: 4
}

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
  });

  describe("Create Loan", function () {

      it("Should only allow valid loan amounts", async function () {
        await expect(
            SocialLendingContract.connect(owner).createLoan(0)
        ).to.be.revertedWith("Loan amount must be greater than zero.");
    });

    it("Should emit LoanRequested event when loan is created", async function () {
        await expect(
          SocialLendingContract.connect(sender).createLoan(1000)
        ).to.emit(SocialLendingContract, "LoanRequested")
        .withArgs(1);
    });

    it("Should should get back correct loan values for first loan if one is created", async function () {
        await SocialLendingContract.connect(sender).createLoan(1000);
        let loanDetails = await SocialLendingContract.loanDetails(1);
      
        expect(loanDetails.loanID).to.equal(1) && expect(loanDetails.loanAmount).to.equal(1000);
    });

    it("Should should get back correct loan values for second loan if two are created", async function () {
        await SocialLendingContract.connect(sender).createLoan(1000);
        await SocialLendingContract.connect(sender).createLoan(10000);
        let loanDetails2 = await SocialLendingContract.loanDetails(2);
      
        expect(loanDetails2.loanID).to.equal(2) && expect(loanDetails2.loanAmount).to.equal(10000);
    });
  });

  describe("Deposit To Loan", function () {

    it("Should only allow valid deposit amounts", async function () {
      await SocialLendingContract.connect(sender).createLoan(10000);
      await expect(
          SocialLendingContract.connect(owner).depositToLoan(0, 0)
      ).to.be.revertedWith("Deposit amount must be greater than zero.");
    });

    it("Should only allow deposits to an existing loan", async function () {
      await expect(
           SocialLendingContract.connect(owner).depositToLoan(0, 10000) 
      ).to.be.revertedWith("Loan not found.");
    });

    it("Should update loan details to PartiallyFunded when less than total is deposited", async function () {
      await SocialLendingContract.connect(sender).createLoan(10000);
      await SocialLendingContract.connect(owner).depositToLoan(1, 100);
      let loanDetails = await SocialLendingContract.connect(owner).loanDetails(1);
    
      expect(loanDetails.loanStatus).to.equal(LoanStatus.PartiallyFunded)
    });

    it("Should update loan details to NeedsRepayment funded when requested amount is deposited in one deposit", async function () {
      await SocialLendingContract.connect(sender).createLoan(10000);
      await SocialLendingContract.connect(owner).depositToLoan(1, 10000);
      let loanDetails = await SocialLendingContract.connect(owner).loanDetails(1);
    
      expect(loanDetails.loanStatus).to.equal(LoanStatus.NeedsRepayment)
    });

    it("Should update loan details to NeedsRepayment funded when requested amount is deposited in multiple deposits", async function () {
      await SocialLendingContract.connect(sender).createLoan(10000);
      await SocialLendingContract.connect(owner).depositToLoan(1, 5000);
      await SocialLendingContract.connect(owner).depositToLoan(1, 5000);
      let loanDetails = await SocialLendingContract.connect(owner).loanDetails(1);
    
      expect(loanDetails.loanStatus).to.equal(LoanStatus.NeedsRepayment)
    });

    it("Should set the tenor to 90 days in the future once loan has requested funds", async function () {
      await SocialLendingContract.connect(sender).createLoan(10000);
      await SocialLendingContract.connect(owner).depositToLoan(1, 10000);
      let loanDetails = await SocialLendingContract.connect(owner).loanDetails(1);
      const today = new Date();
      const expectedLoanRepaymentDateMin = new Date();
      expectedLoanRepaymentDateMin.setDate(today.getDate() + 89);
      const expectedLoanRepaymentDateMax = new Date();
      expectedLoanRepaymentDateMax.setDate(today.getDate() + 91);
      var loanRepaymentDate = new Date(parseInt(loanDetails.tenor * 1000));

    // note: due to block.timestamp, we are just saying it's between 89 and 91 days
    expect(loanRepaymentDate).to.lessThan(expectedLoanRepaymentDateMax).and.
                                 greaterThan(expectedLoanRepaymentDateMin)
  });

  it("Should emit LoanNeedsRepayment event when loan has requested funds", async function () {
    await SocialLendingContract.connect(sender).createLoan(1000);
    await expect(
      SocialLendingContract.connect(owner).depositToLoan(1, 1000)
    ).to.emit(SocialLendingContract, "LoanNeedsRepayment")
    .withArgs(1);
});

  // it("Should be able to retrieve a created loan", async function () {
  //   await SocialLendingContract.connect(sender).createLoan(10000);
  //   await expect(
  //          SocialLendingContract.connect(owner).depositToLoan(0, 10000) 
  //   );
  // });

  // it("Should only allow deposits to existing loans  2", async function () {
  //   await SocialLendingContract.connect(sender).createLoan(10000);
  //   await expect(
  //     console.log(await  SocialLendingContract.connect(owner).depositToLoan(1, 10000) )
  //   ).to.be.revertedWith("Loan not found.");
  // });

  // it("Should only allow deposits to existing loans", async function () {
  //   await SocialLendingContract.connect(sender).createLoan(10000);
  //   await expect(
  //       SocialLendingContract.connect(owner).depositToLoan(1, 1)
  //   ).to.be.revertedWith("Loan not found.");
  // });

  // it("Should emit LoanRequested event when loan is created", async function () {
  //     await expect(
  //       SocialLendingContract.connect(sender).createLoan(1000)
  //     ).to.emit(SocialLendingContract, "LoanRequested")
  //     .withArgs(1);
  // });

  // it("Should should get back correct loan values for first loan if one is created", async function () {
  //     await SocialLendingContract.connect(sender).createLoan(1000);
  //     let loanDetails = await SocialLendingContract.loanDetails(1);
    
  //     expect(loanDetails.loanID).to.equal(1) && expect(loanDetails.loanAmount).to.equal(1000);
  // });

  // it("Should should get back correct loan values for second loan if two are created", async function () {
  //     await SocialLendingContract.connect(sender).createLoan(1000);
  //     await SocialLendingContract.connect(sender).createLoan(10000);
  //     let loanDetails2 = await SocialLendingContract.loanDetails(2);
    
  //     expect(loanDetails2.loanID).to.equal(2) && expect(loanDetails2.loanAmount).to.equal(10000);
  // });
});

});
