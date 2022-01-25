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
    AwaitingDisbursement: 2,
    NeedsRepayment: 3,
    Repaid: 4,
    FailedToRepayByDeadline: 5
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
            SocialLendingContract.connect(owner).createLoan(0)
        ).to.be.revertedWith("Loan amount must be greater than zero.");
    });

    it("Should not allow the same borrower to get more than 1 loan for their address", async function () {
      SocialLendingContract.connect(borrower1).createLoan(10000)
      await expect(
          SocialLendingContract.connect(borrower1).createLoan(10000)
      ).to.be.revertedWith("Loan already exists for borrower.");
    });    

    it("Should emit LoanRequested event when loan is created", async function () {
        await expect(
          SocialLendingContract.connect(sender).createLoan(1000)
        ).to.emit(SocialLendingContract, "LoanRequested")
        .withArgs(1);
    });

    it("Should get back loan details from borrower's address", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      let loanID = await SocialLendingContract.borrowers(borrower1.address);
      let loanDetails = await SocialLendingContract.loanDetails(loanID);

      expect(borrower1.address).to.equal(loanDetails.borrowerAddress)
    });    

    it("Should set interest rate to 7% more than the loan amount", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      let loanID = await SocialLendingContract.borrowers(borrower1.address);
      let loanDetails = await SocialLendingContract.loanDetails(loanID);

      expect(loanDetails.loanAmountWithInterest).to.equal(10700);
    });  

    it("Should get back correct loan values for first loan if one is created", async function () {
        await SocialLendingContract.connect(borrower1).createLoan(1000);
        let loanDetails = await SocialLendingContract.loanDetails(1);
      
        expect(loanDetails.loanID).to.equal(1) && expect(loanDetails.loanAmount).to.equal(1000);
    });

    it("Should get back correct loan values for second loan if two are created", async function () {
        await SocialLendingContract.connect(borrower1).createLoan(1000);
        await SocialLendingContract.connect(borrower2).createLoan(10000);
        let loanDetails2 = await SocialLendingContract.loanDetails(2);
    
      expect(loanDetails2.loanID).to.equal(2) && expect(loanDetails2.loanAmount).to.equal(10000);
    });

    it("Should have a loan status of New after initially created", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(1000);
      let loanDetails = await SocialLendingContract.loanDetails(1);
    
      expect(loanDetails.loanStatus).to.equal(LoanStatus.New);
    });
  });

  describe("Deposit To Loan", function () {
    it("Should revert if no ether is sent", async function() {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await expect(
          SocialLendingContract.connect(lender1).depositToLoan(1, 100)
      ).to.be.revertedWith("Amount sent does not equal declared deposit amount");
    })

    it("Should revert if the amount sent doesn't match _depositAmount", async function() {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await expect(
          SocialLendingContract.connect(lender1).depositToLoan(1, 100, {value: 95})
      ).to.be.revertedWith("Amount sent does not equal declared deposit amount");
    })

    it("Should only allow valid deposit amounts", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await expect(
          SocialLendingContract.connect(lender1).depositToLoan(0, 0)
      ).to.be.revertedWith("Deposit amount must be greater than zero.");
    });

    it("Should only allow deposits to an existing loan", async function () {
      await expect(
           SocialLendingContract.connect(lender1).depositToLoan(0, 10000, {value: 10000})
      ).to.be.revertedWith("Loan not found.");
    });

    it("Should update loan details to PartiallyFunded when less than total amount requested is deposited", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await SocialLendingContract.connect(lender1).depositToLoan(1, 100, {value: 100});
      let loanDetails = await SocialLendingContract.connect(owner).loanDetails(1);
    
      expect(loanDetails.loanStatus).to.equal(LoanStatus.PartiallyFunded);
    });

    it("Should update loan details to AwaitingDisbursement when requested amount is deposited in one deposit", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await SocialLendingContract.connect(lender1).depositToLoan(1, 10000, {value: 10000});
      let loanDetails = await SocialLendingContract.connect(owner).loanDetails(1);
    
      expect(loanDetails.loanStatus).to.equal(LoanStatus.AwaitingDisbursement);
    });

    it("Should update loan details to AwaitingDisbursement when requested amount is deposited in multiple deposits", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await SocialLendingContract.connect(lender1).depositToLoan(1, 5000, {value: 5000});
      await SocialLendingContract.connect(lender2).depositToLoan(1, 5000, {value: 5000});
      let loanDetails = await SocialLendingContract.connect(owner).loanDetails(1);
    
      expect(loanDetails.loanStatus).to.equal(LoanStatus.AwaitingDisbursement);
    });

    it("Should have the ability to let different accounts fund loan", async function () {
      let loanID = 1;

      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await SocialLendingContract.connect(lender1).depositToLoan(loanID, 2500, {value: 2500});
      await SocialLendingContract.connect(lender2).depositToLoan(loanID, 7500, {value: 7500});
     
      // TODO: find a way to loop through the array within a mapping without using a try/catch
      var hasValue = true;
      var i = 0;
      do {
        try {
          await SocialLendingContract.lenders(loanID, i);
          i++;
        }
        catch {
          hasValue = false;
        }
      } while(hasValue);

      expect(i).to.equal(2);
    });

    it("Should set the tenor to 90 days in the future once loan has requested funds", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await SocialLendingContract.connect(lender1).depositToLoan(1, 10000, {value: 10000});
      let loanDetails = await SocialLendingContract.connect(owner).loanDetails(1);
      var today = new Date();
      const expectedLoanRepaymentDateMin = new Date();
      expectedLoanRepaymentDateMin.setDate(today.getDate() + 89);
      const expectedLoanRepaymentDateMax = new Date();
      expectedLoanRepaymentDateMax.setDate(today.getDate() + 91);
      var loanRepaymentDate = new Date(parseInt(loanDetails.tenor * 1000));

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

    it("Should emit LoanFunded event when loan has requested funds", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(1000);
      await expect(
        SocialLendingContract.connect(lender1).depositToLoan(1, 1000, {value: 1000})
      ).to.emit(SocialLendingContract, "LoanFunded")
      .withArgs(1);
    });

  });

  describe("Repay Loan", function () {
    it("Should revert if no ether is sent", async function() {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      SocialLendingContract.connect(lender1).depositToLoan(1, 10000, {value: 10000})
      await expect(
          SocialLendingContract.connect(lender1).repayLoan(1, 10000)
      ).to.be.revertedWith("Amount sent does not equal declared repayment amount.");
    })

    it("Should revert if the amount sent doesn't match _repaymentAmount", async function() {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      SocialLendingContract.connect(lender1).depositToLoan(1, 10000, {value: 10000})
      await expect(
          SocialLendingContract.connect(lender1).repayLoan(1, 10000, {value: 9999})
      ).to.be.revertedWith("Amount sent does not equal declared repayment amount.");
    })

    it("Should only allow valid repayment amounts", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(10000);
      await SocialLendingContract.connect(lender1).depositToLoan(1, 10000, {value: 10000})
      await expect(
        SocialLendingContract.connect(borrower1).repayLoan(1, 0)
      ).to.be.revertedWith("Repayment amount must be greater than zero.");
    });

    it("Should only allow repayment to an existing loan", async function () {
      await expect(
           SocialLendingContract.connect(lender1).repayLoan(0, 10000, {value: 10000})
      ).to.be.revertedWith("Loan not found.");
    });

    it("Should keep loan status as NeedsRepayment if amount repaid is less than the amount to repay", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(1000);
      await SocialLendingContract.connect(lender1).depositToLoan(1, 1000, {value: 1000});
      await SocialLendingContract.connect(borrower1).repayLoan(1, 500, {value: 500});
      let loanDetails = await SocialLendingContract.connect(borrower1).loanDetails(1);

      expect(loanDetails.loanStatus).to.equal(LoanStatus.NeedsRepayment);
    });

    it("Should set loan status to Repaid if amount repaid was what was due", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(1000);
      await SocialLendingContract.connect(lender1).depositToLoan(1, 1000, {value: 1000});
      await SocialLendingContract.connect(borrower1).repayLoan(1, 1070, {value: 1070});
      let loanDetails = await SocialLendingContract.connect(borrower1).loanDetails(1);

      expect(loanDetails.loanStatus).to.equal(LoanStatus.Repaid);
    });

    it("Should emit event that loan was repaid if it was paid back fully", async function () {
      await SocialLendingContract.connect(borrower1).createLoan(1000);
      await SocialLendingContract.connect(lender1).depositToLoan(1, 1000, {value: 1000});

      await expect(
        SocialLendingContract.connect(borrower1).repayLoan(1, 1070, {value: 1070})
      ).to.emit(SocialLendingContract, "LoanRepaid")
      .withArgs(1);
    });
  });

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

  describe("Payout Deposits With Interest", function () {
    
    it("Should set isRepaid for lender to true once payout is complete", async function () {
      let loanAmount = 10000;
      let interestPercentage = .07;
      let loanAmountWithInterest = loanAmount + (loanAmount * interestPercentage);
      await SocialLendingContract.connect(borrower1).createLoan(loanAmount);
      await SocialLendingContract.connect(lender1).depositToLoan(1, loanAmount, {value: loanAmount});
      await SocialLendingContract.connect(borrower1).disburseLoan(1);
      await SocialLendingContract.connect(lender1).repayLoan(1, loanAmountWithInterest, {value: loanAmountWithInterest});
      await SocialLendingContract.connect(owner).payoutDepositsWithInterest(1);
      let lender = await SocialLendingContract.connect(owner).lenders(1, 0);
      expect(lender.isRepaid).to.equal(true);
    });
  });
});
