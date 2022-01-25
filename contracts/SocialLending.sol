//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SocialLending {
    using Counters for Counters.Counter;

    address public owner;
    uint128 interestRate = 700; // 7.00%
    uint8 loanDurationInDays = 90;
    
    event LoanRequested(uint loanID);
    event LoanFunded(uint loanID);
    event LoanNeedsRepayment(uint loanID);
    event LenderDeposit(uint loanID, address lenderAddress);
    event LoanRepaid(uint loanID);

    // ETH borrower address -> loanID (note: assumes only 1 loan per address)
    mapping (address => uint) public borrowers;

    // loanID -> loan details (note: gets the details of a loan for a given loanID)
    mapping (uint => LoanDetail) public loanDetails;

    // loanID -> loan backers (note: gets all of the lenders for a given loanID)
    mapping (uint => Lender[]) public lenders;

    Counters.Counter public loanIDCounter;

    struct LoanDetail {
        uint256 loanID;
        uint256 tenor; // repayment date
        uint128 loanAmount;
        uint128 amountDeposited;
        uint128 amountDisbursed;
        uint128 amountRepaid;
        uint128 interestRate;
        address borrowerAddress;
        uint128 loanAmountWithInterest;
        LoanStatus loanStatus;
    }

    struct Lender {
        address lenderAddress;
        uint128 depositAmount;
        bool isRepaid;
        uint128 amountToRepay;
    }

    enum LoanStatus {
        New,
        PartiallyFunded,
        AwaitingDisbursement,
        NeedsRepayment,
        Repaid,
        FailedToRepayByDeadline
    }

    constructor() {
        owner  = msg.sender;
    }

    function createLoan(
        uint128 _loanAmount
    ) external payable returns (uint loanID) {
        
        require(_loanAmount > 0, "Loan amount must be greater than zero.");
        uint256 existingLoanID = borrowers[msg.sender];
        require(existingLoanID == 0, "Loan already exists for borrower.");
        loanIDCounter.increment();    
        uint256 currentLoanID = loanIDCounter.current();
        LoanDetail memory loanDetail = LoanDetail(
                                            currentLoanID,
                                            0,
                                            _loanAmount,
                                            0,
                                            0,
                                            0,
                                            interestRate,
                                            msg.sender,
                                            calculateLoanWithInterest(_loanAmount),
                                            LoanStatus.New);
        loanDetails[loanDetail.loanID] = loanDetail;
        borrowers[msg.sender] = loanDetail.loanID;
        emit LoanRequested(loanDetail.loanID);
        return loanID;
    }

    function depositToLoan(uint256 _loanID, uint128 _depositAmount) external payable {
        
        require(_depositAmount > 0, "Deposit amount must be greater than zero.");
        LoanDetail memory loanDetail = loanDetails[_loanID];
        require(loanDetail.loanID > 0, "Loan not found.");
        loanDetail.amountDeposited += _depositAmount;

        // TODO: caculate the amount which should be repaid to the lender, here we are just setting the amount to the deposit
        lenders[loanDetail.loanID].push(Lender(msg.sender, _depositAmount, false, _depositAmount));
        
        if (loanDetail.loanAmount > loanDetail.amountDeposited){
            loanDetails[loanDetail.loanID] = LoanDetail(
                                          loanDetail.loanID,
                                          loanDetail.tenor,
                                          loanDetail.loanAmount,
                                          loanDetail.amountDeposited,
                                          loanDetail.amountDisbursed,
                                          loanDetail.amountRepaid,
                                          loanDetail.interestRate,
                                          loanDetail.borrowerAddress,
                                          loanDetail.loanAmountWithInterest,
                                          LoanStatus.PartiallyFunded);
        } else if (loanDetail.amountDeposited >= loanDetail.loanAmount) {

            /* NOTE: it would be better to revert transaction if more than the
                amount requested is deposited into the loan but it's not clear
                how fees work right now so just allow any amount greater to or
                equal to the amount requested
            */
            loanDetails[loanDetail.loanID] = LoanDetail(
                                          loanDetail.loanID,
                                          (block.timestamp + loanDurationInDays * 1 days),
                                          loanDetail.loanAmount,
                                          loanDetail.amountDeposited,
                                          loanDetail.amountDisbursed,
                                          loanDetail.amountRepaid,
                                          loanDetail.interestRate,
                                          loanDetail.borrowerAddress,
                                          loanDetail.loanAmountWithInterest,
                                          LoanStatus.AwaitingDisbursement);
            emit LoanFunded(loanDetail.loanID);
        } else {
            revert("Something went wrong, amount deposited is unexpected.");
        }

        emit LenderDeposit(loanDetail.loanID, msg.sender);
    }

    function repayLoan(uint256 _loanID, uint128 _repaymentAmount) external payable {
        require(_repaymentAmount > 0, "Repayment amount must be greater than zero.");
        LoanDetail memory loanDetail = loanDetails[_loanID];
        require(loanDetail.loanID > 0, "Loan not found.");

        loanDetail.amountRepaid += _repaymentAmount;

        if (loanDetail.loanAmountWithInterest > loanDetail.amountRepaid){
            loanDetails[_loanID] = LoanDetail(
                                          loanDetail.loanID,
                                          loanDetail.tenor,
                                          loanDetail.loanAmount,
                                          loanDetail.amountDeposited,
                                          loanDetail.amountDisbursed,
                                          loanDetail.amountRepaid,
                                          loanDetail.interestRate,
                                          loanDetail.borrowerAddress,
                                          loanDetail.loanAmountWithInterest,
                                          LoanStatus.NeedsRepayment);
        } else if (loanDetail.loanAmountWithInterest >= loanDetail.amountRepaid) {
            loanDetails[_loanID] = LoanDetail(
                                          loanDetail.loanID,
                                          loanDetail.tenor,
                                          loanDetail.loanAmount,
                                          loanDetail.amountDeposited,
                                          loanDetail.amountDisbursed,
                                          loanDetail.amountRepaid,
                                          loanDetail.interestRate,
                                          loanDetail.borrowerAddress,
                                          loanDetail.loanAmountWithInterest,
                                          LoanStatus.Repaid);

            // TODO: remove the borrower address from the mapping so they could get another loan                              
            emit LoanRepaid(loanDetail.loanID);
        } else {
            revert("Something went wrong, amount repaid is unexpected.");
        }
    }

    function calculateLoanWithInterest(uint128 _amount) private view returns (uint128) {
        return ((_amount * interestRate) / 10000) + _amount;
    }

    function requestLoan() public {
/* The borrower connects to the dapp with his wallet
    The borrower specifies the terms of the loan he wants - amount and tenor
    Specifies the ethereum address of the backers
   Calls function createLoan()
   Calls a function to create a unique link that can be shared with the backer 
*/
    }


    function createUniqueLoanLink() public {
/* A request to be sent to the specified ethereum address? Or a regular link that can be shared on social media or emailed to the backers to request to connect and fund for the loan  
*/
    }

    function disburseLoan(uint256 _loanID) external {
        LoanDetail memory loanDetail = loanDetails[_loanID];
        require(loanDetail.loanAmount > 0, "Loan not found.");
        require(loanDetail.borrowerAddress == msg.sender, "Only the borrower may receive disbursements.");
        require(loanDetail.loanStatus != LoanStatus.NeedsRepayment, "The loan has already been disbursed.");
        require(loanDetail.amountDisbursed == 0, "The loan has already been disbursed.");
        require(loanDetail.loanStatus == LoanStatus.AwaitingDisbursement, "The loan has not yet been funded.");
        require(loanDetail.amountDeposited >= loanDetail.loanAmount, "The loan has not yet been funded.");

        (bool sent,) = msg.sender.call{value: loanDetail.loanAmount}("");
        require(sent, "Failed to send Ether");

        loanDetails[_loanID] = LoanDetail(
            loanDetail.loanID,
            loanDetail.tenor,
            loanDetail.loanAmount,
            loanDetail.amountDeposited,
            loanDetail.loanAmount,
            loanDetail.amountRepaid,
            loanDetail.interestRate,
            loanDetail.borrowerAddress,
            loanDetail.loanAmountWithInterest,
            LoanStatus.NeedsRepayment);
        emit LoanNeedsRepayment(loanDetail.loanID);
    }
}