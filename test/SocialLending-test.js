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
    New: 0,
    PartiallyFunded: 1,
    NeedsRepayment: 2,
    Repaid: 3,
    FailedToRepayByDeadline: 4
}

  let owner;
  let sender;
  let borrower1, borrower2;
  let lender1, lender2;

  beforeEach(async () => {
    // Get the ContractFactory and Signers here.
    SocialLending = await ethers.getContractFactory("SocialLending", accounts => {
       borrower1 = accounts[0];
       borrower2 = accounts[1];
       lender1 = accounts[2];
       lender2 = accounts[3];
    });
    [owner, sender, borrower1, borrower2, lender1, lender2] = await ethers.getSigners();

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
            SocialLendingContract.connect(borrower1).createLoan(0)
        ).to.be.revertedWith("No Loan Amount");
    });

    it("Should not allow the same borrower to get more than 1 loan at a time", async function () {
      SocialLendingContract.connect(borrower1).createLoan(10000)
      await expect(
          SocialLendingContract.connect(borrower1).createLoan(10000)
      ).to.be.revertedWith("Loan Exists");
    });    

    it("Should emit LoanRequested event when loan is created", async function () {
        await expect(
          SocialLendingContract.connect(borrower1).createLoan(1000)
        ).to.emit(SocialLendingContract, "LoanRequested")
        .withArgs(1);
    });

    it("Should get back correct loan details once created", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(10000);

      await expect(
        SocialLendingContract.connect(sender).getLoanDetailsFromLoanID(1)
      ).to.emit(SocialLendingContract, "LoanDetails")
      .withArgs(1, 0, 10000, 0, 0, 700, borrower1.address, 10700, LoanStatus.New);
    });    

    it("Should get back correct loan values for second loan if two are created", async function () {
        await SocialLendingContract.connect(borrower1).createLoan(1000);
        await SocialLendingContract.connect(borrower2).createLoan(10000);
  
        await expect(
          SocialLendingContract.connect(sender).getLoanDetailsFromLoanID(2)
        ).to.emit(SocialLendingContract, "LoanDetails")
        .withArgs(2, 0, 10000, 0, 0, 700, borrower2.address, 10700, LoanStatus.New);
    });
  });

  describe("Deposit To Loan", function () {
    it("Should revert if no ether is sent", async function() {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await expect(
          SocialLendingContract.connect(lender1).depositToLoan(1, 100)
      ).to.be.revertedWith("Different Repayment Amount");
    })

    it("Should revert if the amount sent doesn't match _depositAmount", async function() {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await expect(
          SocialLendingContract.connect(lender1).depositToLoan(1, 100, {value: 95})
      ).to.be.revertedWith("Different Repayment Amount");
    })

    it("Should only allow valid deposit amounts", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await expect(
          SocialLendingContract.connect(lender1).depositToLoan(0, 0)
      ).to.be.revertedWith("Invalid Deposit Amount");
    });

    it("Should only allow deposits to an existing loan", async function () {
      await expect(
          SocialLendingContract.connect(lender1).depositToLoan(0, 10000, {value: 10000})
      ).to.be.revertedWith("Loan not found");
    });

    it("Should revert if the loan is already fully funded", async function() {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await SocialLendingContract.connect(lender1).depositToLoan(1, 10000, {value: 10000});
      await expect(
          SocialLendingContract.connect(lender2).depositToLoan(1, 5000, {value: 5000})
      ).to.be.revertedWith("Loan Already Funded");
    });

    it("Should update loan details to PartiallyFunded when less than total amount requested is deposited", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await SocialLendingContract.connect(lender1).depositToLoan(1, 100, {value: 100});
      await expect(
        SocialLendingContract.connect(sender).getLoanDetailsFromLoanID(1)
      ).to.emit(SocialLendingContract, "LoanDetails")
      .withArgs(1, 0, 10000, 100, 0, 700, borrower1.address, 10700, LoanStatus.PartiallyFunded);

    });

    it("Should update loan details to NeedsRepayment when requested amount is deposited in one deposit", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await SocialLendingContract.connect(lender1).depositToLoan(1, 10000, {value: 10000});
      const tx = await SocialLendingContract.connect(sender).getLoanDetailsFromLoanID(1);
      const receipt = await tx.wait();
      const loanDetails = await receipt.events?.filter((x)=>{return x.event=='LoanDetails'});
      await expect(
        SocialLendingContract.connect(sender).getLoanDetailsFromLoanID(1)
      ).to.emit(SocialLendingContract, "LoanDetails")
      .withArgs(1, loanDetails[0].args.tenor, 10000, 10000, 0, 700, borrower1.address, 10700, LoanStatus.NeedsRepayment);

    });

    it("Should update loan details to NeedsRepayment when requested amount is deposited in multiple deposits", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await SocialLendingContract.connect(lender1).depositToLoan(1, 5000, {value: 5000});
      await SocialLendingContract.connect(lender2).depositToLoan(1, 5000, {value: 5000});
      const tx = await SocialLendingContract.connect(sender).getLoanDetailsFromLoanID(1);
      const receipt = await tx.wait();
      const loanDetails = await receipt.events?.filter((x)=>{return x.event=='LoanDetails'});
      await expect(
        SocialLendingContract.connect(sender).getLoanDetailsFromLoanID(1)
      ).to.emit(SocialLendingContract, "LoanDetails")
      .withArgs(1, loanDetails[0].args.tenor, 10000, 10000, 0, 700, borrower1.address, 10700, LoanStatus.NeedsRepayment);
    });
    
    it("Should emit lender details of connected account", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await SocialLendingContract.connect(sender).depositToLoan(1, 10000, {value: 10000});
      const tx = await SocialLendingContract.connect(sender).getLoanDetailsFromLoanID(1);
      const receipt = await tx.wait();
      const loanDetails = await receipt.events?.filter((x)=>{return x.event=='LenderDetails'});
      await expect(
        SocialLendingContract.connect(sender).getLenderDetails(1)
      ).to.emit(SocialLendingContract, "LenderDetails")
      .withArgs(sender.address, 10000, false, 10700);
    });

    it("Should emit lender details of connected account 2", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await SocialLendingContract.connect(sender).depositToLoan(1, 500, {value: 500});
      await SocialLendingContract.connect(sender).depositToLoan(1, 500, {value: 500});
      const tx = await SocialLendingContract.connect(sender).getLoanDetailsFromLoanID(1);
      const receipt = await tx.wait();
      const loanDetails = await receipt.events?.filter((x)=>{return x.event=='LenderDetails'});
      await expect(
        SocialLendingContract.connect(sender).getLenderDetails(1)
      ).to.emit(SocialLendingContract, "LenderDetails")
      .withArgs(sender.address, 500, false, 535);
    });

    it("Should have the ability to let different accounts fund loan", async function () {
      let loanID = 1;

      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await SocialLendingContract.connect(lender1).depositToLoan(loanID, 2500, {value: 2500});
      await SocialLendingContract.connect(lender2).depositToLoan(loanID, 7500, {value: 7500});
      var lenders = await SocialLendingContract.getLendersFromLoanID(loanID);
      expect(lenders.length).to.equal(2);
    });


    it("Should set the tenor to 90 days in the future once loan has requested funds", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await SocialLendingContract.connect(lender1).depositToLoan(1, 10000, {value: 10000});
      const tx = await SocialLendingContract.connect(sender).getLoanDetailsFromLoanID(1);
      const receipt = await tx.wait();
      const loanDetails = await receipt.events?.filter((x)=>{return x.event=='LoanDetails'});
      
      var today = new Date();
      const expectedLoanRepaymentDateMin = new Date();
      expectedLoanRepaymentDateMin.setDate(today.getDate() + 89);
      const expectedLoanRepaymentDateMax = new Date();
      expectedLoanRepaymentDateMax.setDate(today.getDate() + 91);
      var loanRepaymentDate = new Date(parseInt(loanDetails[0].args.tenor * 1000));

      // NOTE: due to block.timestamp, we are just saying it's between 89 and 91 days
      expect(loanRepaymentDate).to.lessThan(expectedLoanRepaymentDateMax).and.
                                 greaterThan(expectedLoanRepaymentDateMin);
    });


    it("Should emit LenderDeposit event when a lender deposits", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(1000);
      await expect(
        SocialLendingContract.connect(sender).depositToLoan(1, 1000, {value: 1000})
      ).to.emit(SocialLendingContract, "LenderDeposit")
      .withArgs(1, sender.address);
    });
  });

  describe("Repay Loan", function () {
    it("Should revert if no ether is sent", async function() {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      SocialLendingContract.connect(lender1).depositToLoan(1, 10000, {value: 10000})
      await expect(
          SocialLendingContract.connect(lender1).repayLoan(1, 10000)
      ).to.be.revertedWith("Different Repayment Amount");
    })

    it("Should revert if the amount sent doesn't match _repaymentAmount", async function() {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      SocialLendingContract.connect(lender1).depositToLoan(1, 10000, {value: 10000})
      await expect(
          SocialLendingContract.connect(lender1).repayLoan(1, 10000, {value: 9999})
      ).to.be.revertedWith("Different Repayment Amount");
    })

    it("Should only allow valid repayment amounts", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await SocialLendingContract.connect(lender1).depositToLoan(1, 10000, {value: 10000})
      await expect(
        SocialLendingContract.connect(borrower1).repayLoan(1, 0)
      ).to.be.revertedWith("No Repayment Amount");
    });

    it("Should only allow repayment to an existing loan", async function () {
      await expect(
           SocialLendingContract.connect(lender1).repayLoan(0, 10000, {value: 10000})
      ).to.be.revertedWith("Loan Not Found");
    });

    it("Should keep loan status as NeedsRepayment if amount repaid is less than the amount to repay", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await SocialLendingContract.connect(lender1).depositToLoan(1, 10000, {value: 10000});
      await SocialLendingContract.connect(borrower1).repayLoan(1, 500, {value: 500});
      const tx = await SocialLendingContract.connect(sender).getLoanDetailsFromLoanID(1);
      const receipt = await tx.wait();
      const loanDetails = await receipt.events?.filter((x)=>{return x.event=='LoanDetails'});
      await expect(
        SocialLendingContract.connect(sender).getLoanDetailsFromLoanID(1)
      ).to.emit(SocialLendingContract, "LoanDetails")
      .withArgs(1, loanDetails[0].args.tenor, 10000, 10000, 500, 700, borrower1.address, 10700, LoanStatus.NeedsRepayment);;
    });

    it("Should set loan status to Repaid if amount repaid was what was due", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await SocialLendingContract.connect(lender1).depositToLoan(1, 10000, {value: 10000});
      await SocialLendingContract.connect(borrower1).repayLoan(1, 10700, {value: 10700});
    
      const tx = await SocialLendingContract.connect(sender).getLoanDetailsFromLoanID(1);
      const receipt = await tx.wait();
      const loanDetails = await receipt.events?.filter((x)=>{return x.event=='LoanDetails'});
      await expect(
        SocialLendingContract.connect(sender).getLoanDetailsFromLoanID(1)
      ).to.emit(SocialLendingContract, "LoanDetails")
      .withArgs(1, loanDetails[0].args.tenor, 10000, 10000, 10700, 700, borrower1.address, 10700, LoanStatus.Repaid);;
    });

    it("Should emit event that loan was repaid if it was paid back fully", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(1000);
      await SocialLendingContract.connect(lender1).depositToLoan(1, 1000, {value: 1000});

      await expect(
        SocialLendingContract.connect(borrower1).repayLoan(1, 1070, {value: 1070})
      ).to.emit(SocialLendingContract, "LoanRepaid")
      .withArgs(1);
    });

    it("Should update history and enable the borrower to borrow again", async function() {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await SocialLendingContract.connect(borrower2).createLoan(25000);
      await SocialLendingContract.connect(lender1).depositToLoan(1, 10000, {value: 10000});
      await expect(
          await SocialLendingContract.connect(borrower1).getPreviousLoanCount(borrower1.address)
      ).to.equal(0);
      await expect(
          await SocialLendingContract.connect(borrower1).getBorrowersLoanID(borrower1.address)
      ).to.equal(1);

      await SocialLendingContract.connect(borrower1).repayLoan(1, 10700, {value: 10700});

      await expect(
          await SocialLendingContract.connect(borrower1).getPreviousLoanCount(borrower1.address)
      ).to.equal(1);
      await expect(
          await SocialLendingContract.connect(borrower1).getBorrowersLoanID(borrower1.address)
      ).to.equal(0);
      // ensure that other borrowers' loan data has not been reset
      await expect(
          await SocialLendingContract.connect(borrower2).getBorrowersLoanID(borrower2.address)
      ).to.equal(2);

      await SocialLendingContract.connect(borrower1).createLoan(50000);
      await expect(
          await SocialLendingContract.connect(borrower1).getBorrowersLoanID(borrower1.address)
      ).to.equal(3);
    });
  });

  /*
   //Bring these back when the borrower needs to trigger the disbursement:

  describe("Disburse Loan", function () {
    it("Should revert if the loan ID is invalid", async function () {
      await expect(
          SocialLendingContract.connect(borrower1).disburseLoan(470)
      ).to.be.revertedWith("Loan not found.");
    });

    it("Should revert if called by other than the borrower", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await expect(
          SocialLendingContract.connect(borrower2).disburseLoan(1)
      ).to.be.revertedWith("Only the borrower may receive disbursements.");
    });

    it("Should revert if the loan has no funding", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await expect(
          SocialLendingContract.connect(borrower1).disburseLoan(1)
      ).to.be.revertedWith("The loan has not yet been funded.");
    });

    it("Should revert if the loan is partially funded", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await SocialLendingContract.connect(lender1).depositToLoan(1, 9999, {value: 9999});
      await expect(
          SocialLendingContract.connect(borrower1).disburseLoan(1)
      ).to.be.revertedWith("The loan has not yet been funded.");
    });

    it("Should disburse the loan", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await SocialLendingContract.connect(lender1).depositToLoan(1, 10000, {value: 10000});
      await expect(
          await SocialLendingContract.provider.getBalance(SocialLendingContract.address)
      ).to.equal(10000);
      await expect(
          SocialLendingContract.connect(borrower1).disburseLoan(1)
      ).to.emit(SocialLendingContract, "LoanNeedsRepayment");
      await expect(
          await SocialLendingContract.provider.getBalance(SocialLendingContract.address)
      ).to.equal(0);
    });

    it("Should revert if the loan has already been disbursed", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await SocialLendingContract.connect(lender1).depositToLoan(1, 10000, {value: 10000});
      await SocialLendingContract.connect(borrower1).disburseLoan(1);
      await expect(
          SocialLendingContract.connect(borrower1).disburseLoan(1)
      ).to.be.revertedWith("The loan has already been disbursed.");
    });
  });
*/

  describe("Payout Deposits With Interest", function () {
    
    it("Should set isRepaid for lender to true once payout is complete", async function () {
      let loanAmount = 10000;
      let interestPercentage = .07;
      let loanAmountWithInterest = loanAmount + (loanAmount * interestPercentage);
      await SocialLendingContract.connect(borrower1).createLoan(loanAmount);
      await SocialLendingContract.connect(lender1).depositToLoan(1, loanAmount, {value: loanAmount});
      await SocialLendingContract.connect(lender1).repayLoan(1, loanAmountWithInterest, {value: loanAmountWithInterest});
      await SocialLendingContract.connect(owner).payoutDepositsWithInterest(1);
      let lenders = await SocialLendingContract.connect(owner).getLendersFromLoanID(1);
      expect(lenders[0].isRepaid).to.equal(true);
    });
  });
});
