//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract SocialLending {

    address public owner;
    uint8 interestRate = 7; // TODO: this needs to be a percentage, might need to use a library because we can't use decimals

    event LoanRequested(uint loanID, LoanDetail loanDetails);

    // ETH borrower address -> loanID (note: assumes only 1 loan per address)
    mapping (address => uint) public borrowers;

    // loanID -> loan details (note: gets the details of a loan for a given loanID)
    mapping (uint => LoanDetail) public loanDetails;

    // loanID -> loan backers (note: gets all of the backers for a given loanID)
    mapping (uint => LoanBacker[]) public loanBackers;

    struct LoanDetail {
        uint256 loanID;
        uint tenor;
        uint128 amount;
        uint8 interestRate;
        address borrowerAddress;
        address[] loanBackers;
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
        NotFunded,
        NotFullyFunded,
        Funded,
        NeedsRepayment,
        Repaid,
        FailedToRepay
    }

    constructor() {
        owner  = msg.sender;
    }

    function requestLoan() public {
/* The borrower connects to the dapp with his wallet
    The borrower specifies the terms of the loan he wants - amount and tenor
    Specifies the ethereum address of the backers
   Calls function CreateLoanID()
   Calls a function to create a unique link that can be shared with the backer 
*/
    }

    function createLoanId(
        address borrower,
        uint256 loanAmount
    ) external payable returns (uint loanID) {
        // TODO: create a new LoanDetail which will default the loan to the NotFunded status

        // note: The loan would start once the loan amount requested is met
        
        //let loanDetail = LoanDetail(loanID, tenor, amount, interestRate, borrowerAddress, loanBackers, LoanStatus.NotFunded);
        //LoanRequested()
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

    function backerCommits() public {
/* The backer confirms the amount of ETH he is willing to commit
    The backer is shown his share of the total funding pool, the expected daily yield, and terms that this is value at risk if the borrower defaults
The backer agrees to the terms and transfers funds to the smart contract
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