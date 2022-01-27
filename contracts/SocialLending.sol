//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";

contract SocialLending {
    using Counters for Counters.Counter;

    address public owner;
    uint128 interestRate = 700; // 7.00%
    uint8 loanDurationInDays = 90;
    
    event LoanRequested(uint loanID);
    event LoanNeedsRepayment(uint loanID);
    event LenderDeposit(uint loanID, address lenderAddress);
    event LoanRepaid(uint loanID);
    event LoanDetails(
        uint256 loanID,
        uint256 tenor,
        uint128 loanAmount,
        uint128 amountDeposited,
        uint128 amountRepaid,
        uint128 interestRate,
        address borrowerAddress,
        uint128 loanAmountWithInterest,
        LoanStatus loanStatus
    );
    event LenderDetails(
        address lenderAddress,
        uint128 depositAmount,
        bool isRepaid,
        uint128 amountToRepay);
    event LendersRepaid(uint loanID);

    // ETH borrower address -> loanID (note: assumes only 1 loan per address)
    mapping (address => uint) private borrowers;

    // loanID -> loan details (note: gets the details of a loan for a given loanID)
    mapping (uint => LoanDetail) private loanDetails;

    // loanID -> loan backers (note: gets all of the lenders for a given loanID)
    mapping (uint => Lender[]) private lenders;

    // borrower address -> loanIDs of previous loans
    mapping (address => uint[]) private previousLoans;

    Counters.Counter public loanIDCounter;

    struct LoanDetail {
        uint256 loanID;
        uint256 tenor; // repayment date
        uint128 loanAmount;
        uint128 amountDeposited;
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
        NeedsRepayment,
        Repaid,
        FailedToRepayByDeadline
    }

    constructor() {
        owner  = msg.sender;
    }

    function createLoan(
        uint128 _loanAmount
    ) external returns (uint loanID) {
        require(_loanAmount > 0, "No Loan Amount");
        uint256 existingLoanID = borrowers[msg.sender];

        // This value is reset to 0 when a previous loan is repaid, so this check
        // only prevents taking out a second loan while the first is still in progress.
        require(existingLoanID == 0, "Loan Exists");
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
                                            calculateLoanWithInterest(_loanAmount),
                                            LoanStatus.New);
        loanDetails[loanDetail.loanID] = loanDetail;
        borrowers[msg.sender] = loanDetail.loanID;

        emit LoanRequested(loanDetail.loanID);
        return loanDetail.loanID;
    }

    function depositToLoan(uint256 _loanID, uint128 _depositAmount) external payable {
        require(msg.value == _depositAmount, "Different Repayment Amount");
        require(_depositAmount > 0, "Invalid Deposit Amount");
        LoanDetail memory loanDetail = loanDetails[_loanID];
        require(loanDetail.loanID > 0, "Loan not found");

        // TODO: We should have a more robust check on this to make *absolutely* sure
        //       we don't disburse a loan multiple times.
        require(loanDetail.loanStatus == LoanStatus.New || loanDetail.loanStatus == LoanStatus.PartiallyFunded,
                "Loan Already Funded");

        loanDetail.amountDeposited += _depositAmount;
        lenders[loanDetail.loanID].push(Lender(msg.sender, _depositAmount, false, calculateLoanWithInterest(_depositAmount)));
        
        if (loanDetail.loanAmount > loanDetail.amountDeposited){
            loanDetails[loanDetail.loanID] = LoanDetail(
                                          loanDetail.loanID,
                                          loanDetail.tenor,
                                          loanDetail.loanAmount,
                                          loanDetail.amountDeposited,
                                          loanDetail.amountRepaid,
                                          loanDetail.interestRate,
                                          loanDetail.borrowerAddress,
                                          loanDetail.loanAmountWithInterest,
                                          LoanStatus.PartiallyFunded);
            emit LenderDeposit(loanDetail.loanID, msg.sender);
        } else if (loanDetail.amountDeposited >= loanDetail.loanAmount) {
            // TODO: This triggers the disbursement immediately when the loan is fully funded,
            //       but this means the last depositor will pay the gas to send the funds to
            //       the borrower. We should probably change this so that the borrower
            //       needs to trigger disburseLoan (thereby paying their own gas).
            //       We'll probably need a new LoanStatus to indicate AwaitingDisbursement.
            emit LenderDeposit(loanDetail.loanID, msg.sender);
            disburseLoan(loanDetail);
        } else {
            revert("Unexpected Deposit Amount");
        }
    }

    function repayLoan(uint256 _loanID, uint128 _repaymentAmount) external payable {
        require(msg.value == _repaymentAmount, "Different Repayment Amount");
        require(_repaymentAmount > 0, "No Repayment Amount");
        LoanDetail memory loanDetail = loanDetails[_loanID];
        require(loanDetail.loanID > 0, "Loan Not Found");

        loanDetail.amountRepaid += _repaymentAmount;

        if (loanDetail.loanAmountWithInterest > loanDetail.amountRepaid){
            loanDetails[_loanID] = LoanDetail(
                                          loanDetail.loanID,
                                          loanDetail.tenor,
                                          loanDetail.loanAmount,
                                          loanDetail.amountDeposited,
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
                                          loanDetail.amountRepaid,
                                          loanDetail.interestRate,
                                          loanDetail.borrowerAddress,
                                          loanDetail.loanAmountWithInterest,
                                          LoanStatus.Repaid);

            previousLoans[loanDetail.borrowerAddress].push(loanDetail.loanID);
            // borrowers is the list of current loans - clear this one so this user can borrow again:
            delete borrowers[loanDetail.borrowerAddress];
            emit LoanRepaid(loanDetail.loanID);
        } else {
            revert("Unexpcted Amount Paid");
        }
    }

    function getLendersFromLoanID(uint _loanID) public view returns (Lender[] memory) {
        return lenders[_loanID];
    }

    function getLoanDetailsFromLoanID(uint _loanID) public {

        emit LoanDetails(loanDetails[_loanID].loanID,
                         loanDetails[_loanID].tenor,
                         loanDetails[_loanID].loanAmount,
                         loanDetails[_loanID].amountDeposited,
                         loanDetails[_loanID].amountRepaid,
                         loanDetails[_loanID].interestRate,
                         loanDetails[_loanID].borrowerAddress,
                         loanDetails[_loanID].loanAmountWithInterest,
                         loanDetails[_loanID].loanStatus
                         );
    }

    function getLenderDetails(uint _loanID) public {
       
        for (uint i=0; i< lenders[_loanID].length; i++) {

            if (lenders[_loanID][i].lenderAddress == msg.sender) {
                 
                emit LenderDetails(
                        lenders[_loanID][i].lenderAddress,
                        lenders[_loanID][i].depositAmount,
                        lenders[_loanID][i].isRepaid,
                        lenders[_loanID][i].amountToRepay);

            }
        }
    }

    function getBorrowersLoanID(address _borrowerAddress) public view returns (uint) {
        return borrowers[_borrowerAddress];
    }

    function getPreviousLoanCount(address _borrowerAddress) public view returns (uint) {
        return previousLoans[_borrowerAddress].length;
    }

    // TODO: Make this external, and require the borrower to initiate it to disburse funds.
    //       That way, the borrower pays the cost of that gas, not the last depositor.
    //       The commented-out code represents checks that may be useful when this happens.
    function disburseLoan(LoanDetail memory loanDetail) private {
        // (For the below, this would be an external function with uint _loanID as its parameter.)
        // LoanDetail memory loanDetail = loanDetails[_loanID];
        // require(loanDetail.loanAmount > 0, "Loan not found.");
        // require(loanDetail.borrowerAddress == msg.sender, "Only the borrower may receive disbursements.");
        // require(loanDetail.loanStatus != LoanStatus.NeedsRepayment, "The loan has already been disbursed.");
        // require(loanDetail.amountDisbursed == 0, "The loan has already been disbursed.");
        // require(loanDetail.loanStatus == LoanStatus.AwaitingDisbursement, "The loan has not yet been funded.");
        // require(loanDetail.amountDeposited >= loanDetail.loanAmount, "The loan has not yet been funded.");

        loanDetails[loanDetail.loanID] = LoanDetail(
            loanDetail.loanID,
            (block.timestamp + loanDurationInDays * 1 days),
            loanDetail.loanAmount,
            loanDetail.amountDeposited,
            loanDetail.amountRepaid,
            loanDetail.interestRate,
            loanDetail.borrowerAddress,
            loanDetail.loanAmountWithInterest,
            LoanStatus.NeedsRepayment);
        emit LoanNeedsRepayment(loanDetail.loanID);

        // This must remain at the end to guard against re-entrancy attacks.
        (bool sent,) = loanDetail.borrowerAddress.call{value: loanDetail.loanAmount}("");
        require(sent, "Failed To Send Ether");
    }

    function payoutDepositsWithInterest(uint256 _loanID) external payable {
        for (uint i=0; i< lenders[_loanID].length; i++) {
            Lender memory lender = lenders[_loanID][i];
            if (!lender.isRepaid) {
                lender.isRepaid = true;
                lenders[_loanID][i] = lender;

                // This must remain at the end to guard against re-entrancy attacks.
                (bool sent,) = msg.sender.call{value: lender.amountToRepay}("");
                require(sent, "Failed To Send Ether");
            }
        }
        emit LendersRepaid(_loanID);
    }
    
    function calculateLoanWithInterest(uint128 _amount) private view returns (uint128) {
        return ((_amount * interestRate) / 10000) + _amount;
    }
}
