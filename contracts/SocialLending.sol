//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SocialLending {
    using Counters for Counters.Counter;

    address public owner;
    uint8 interestRate = 7; // TODO: this needs to be a percentage, might need to use a library because we can't use decimals
    uint8 loanDurationInDays = 90;
    
    event LoanRequested(uint loanID);
    event LoanNeedsRepayment(uint loanID);

    // ETH borrower address -> loanID (note: assumes only 1 loan per address)
    mapping (address => uint) public borrowers;

    // loanID -> loan details (note: gets the details of a loan for a given loanID)
    mapping (uint => LoanDetail) public loanDetails;

    // loanID -> loan backers (note: gets all of the backers for a given loanID)
    mapping (uint => LoanBacker[]) public loanBackers;

    Counters.Counter public loanIDCounter;

    struct LoanDetail {
        uint256 loanID;
        uint256 tenor; // repayment date
        uint128 loanAmount;
        uint128 amountDeposited;
        uint128 amountRepaid;
        uint8 interestRate;
        address borrowerAddress;
        // address[] loanBackers; // TODO: not sure how to store this, will need to map from loan to loan backers somehow
        // uint256 protocolFees; // TODO: don't think about this until everything else is implemented
        LoanStatus loanStatus;
    }

    struct LoanBacker {
        address backerAddress;
        uint256 backerAmount;
        uint256 borrowerInterestDue;
        uint256 backerInterestEarned;
    }

    enum LoanStatus {
        New,
        PartiallyFunded,
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
                                            interestRate,
                                            msg.sender,
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

        // TODO: add the backer/lender to a list and determine how to deal with more than 1 deposit by address

        if (loanDetail.loanAmount > loanDetail.amountDeposited){
            loanDetails[_loanID] = LoanDetail(
                                          loanDetail.loanID,
                                          loanDetail.tenor,
                                          loanDetail.loanAmount,
                                          loanDetail.amountDeposited,
                                          loanDetail.amountRepaid,
                                          loanDetail.interestRate,
                                          loanDetail.borrowerAddress,
                                          LoanStatus.PartiallyFunded);
        } else if (loanDetail.amountDeposited >= loanDetail.loanAmount) {

            /* NOTE: it would be better to revert transaction if more than the
                amount requested is deposited into the loan but it's not clear
                how fees work right now so just allow any amount greater to or
                equal to the amount requested
            */
            loanDetails[_loanID] = LoanDetail(
                                          loanDetail.loanID,
                                          (block.timestamp + loanDurationInDays * 1 days),
                                          loanDetail.loanAmount,
                                          loanDetail.amountDeposited,
                                          loanDetail.amountRepaid,
                                          loanDetail.interestRate,
                                          loanDetail.borrowerAddress,
                                          LoanStatus.NeedsRepayment);
            emit LoanNeedsRepayment(_loanID);
        } else {
            revert("Something went wrong, amount deposited is unexpected.");
        }
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

    function inviteBackers() public {
/* The backer connects to the dapp with his wallet
    The backer is shown the shortfall amount of the loan needed for the borrower

   Calls function BackersCommit()
  
*/
    }



    function loanBackingSecured() public {
/* Checks if loan requested = sum (backerAmount) for all backerAddresses tagged to the specific loanID. If yes, return true to go to the disbursal phase. If no, the loan needs to be in wait mode.    
*/
    }

    function disburseLoan() public {
/* This function is to be called when LoanBackingSecured() returns true. 
   Loan amount is transferred from backers to the borrower.
   Calls LoanRunning() function to calculate and post daily yields (only in accounting data, no transfer of funds)
borrowerInterestDue and backerInterestEarned updated daily
*/
    }

        function repayLoan() public {

/* Anytime on or before the due date of the loan, the borrower can choose to repay the loan. Call this function.
Transfer loan amount from borrower’s wallet to internal variable.
Allocate funds equal to/in proportion to the original funding from the backers. 
Recover interest due from the borrower’s wallet.
Allocate interest earned in proportion to the backer’s funding share. A fraction goes to the protocol fees.

*/

    }
}