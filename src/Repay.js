import { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import { Typography, Box, Grid, TextField, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ethers } from 'ethers';
import Panel from './Panel';
import { Web3Context } from './web3Context';
import Loader from './Loader';
import { displayAddress, getErrMessage } from './utils/common';


function Repay() {
  const { contract, currentAccount } = useContext(Web3Context);
  let params = useParams();
  const [loanDetails, setloanDetails] = useState(null);
  const [loader, setLoader] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('0');
  const [appError, setAppError] = useState(null);
  const [lenderAlreadyDeposited, setLenderAlreadyDeposited] = useState(false);
  const [showLoanFunds, setShowLoanFunds] = useState(false);

  const onChange = (e, field) => {
    const txt = e.target.value;
    if (field === 'contributionAmount') {
      setContributionAmount(parseFloat(txt));
    }
  };


  const shouldDisableButton = () => {
    if (!contributionAmount) return true;
    const res = parseFloat(contributionAmount) <= 0;
    return res;
  };

const repayLoan = async () => {
  try {
    const depositAmount =  contributionAmount.toString(); // massage as needed
    console.log(depositAmount);

    // TODO - this function is throwing error
    const msg_value_amount = ethers.utils.parseEther(depositAmount); 
    console.log(msg_value_amount);
   // const tx = await contract.depositToLoan(parseFloat(params.loanId),depositAmount,{value: msg_value_amount});
  // const tx = await contract.depositToLoan(parseFloat(params.loanId), '100000000000000000000',{value: msg_value_amount});
    // const tx = await contract.depositToLoan(
    //   parseFloat(params.loanId),
    //   depositAmount
    // );
 
    const options = { value: ethers.utils.parseEther(depositAmount) };
 
    // TODO - this function is throwing error
    const tx = await contract.payoutDepositsWithInterest(
      parseFloat(params.loanId),
      options
    );


    const rc = await tx.wait();
    const event = await rc.events?.filter((x)=> x.event == 'LendersRepaid');
    const eventArgs = event[0].args;

    console.log(eventArgs);

  //  setLenderAlreadyDeposited(eventArgs.loanId);
  } catch (err) {
    setAppError(getErrMessage(err));
  }

  // try {

  //   console.log("repayLoan() = contract: ", contract);
  //   const loanId = window.location.href.split("/").pop();
  //   console.log(loanId);
  //   const repaymentAmont = contributionAmount; // massage as needed
  //   const tx = await contract.repayLoan(loanId, repaymentAmont);
  //   const rc = await tx.wait();
  //   const event = await rc.events?.filter((x)=>{return x.event=='LoanDetails'});
   
  //   // TODO: check that this is: 'Repaid' and that the amount please interest has been sent to lender
  //   console.log("Loan Status: " + event[0].args.loanStatus);
  // } catch (err) {
  //   setAppError(err?.data?.message);
  // }
};

  const navigate = useNavigate();

  return (
    <Panel>
      <Typography component="div" color="#1c3f71" fontSize="2rem"><h2>Repay</h2></Typography>
      
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={2}>
          <Grid item container xs={12} alignItems="center">
            <Grid item xs={6}>
              <Typography component="p">Total amount of ETH loaned:</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                style={{ width: '50%' }}
                hiddenLabel
              />
            </Grid>
          </Grid>

          <Grid item container xs={12} alignItems="center">
            <Grid item xs={6}>
              <Typography>Total repayment of ETH:</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                value={contributionAmount ? contributionAmount.toString() : ''}
                onChange={(e) => onChange(e, 'contributionAmount')}
                style={{ width: '50%' }}
                hiddenLabel
              />
            </Grid>
          </Grid>

          <Grid item container xs={12} alignItems="center">
            <Grid item xs={6}>
              <Typography>Total ETH still needed:</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                 style={{ width: '50%' }}
                hiddenLabel
              />
            </Grid>
          </Grid>

          <Grid item container xs={12} alignItems="center">
            <Grid item xs={6}>
              <Typography>Days to repay:</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                hiddenLabel
                style={{ width: '50%' }}
                placeholder="7%"
                disabled
              />
            </Grid>
          </Grid>


        </Grid>

        <Box>
          <Button sx={{ background: '#1c3f71', color: '#eaf6de' }} variant="contained"  disabled={shouldDisableButton()}  onClick={repayLoan}>
            <Typography>Repay Loan</Typography>
          </Button>
        </Box>
      </Box>
      

    </Panel>
  );
}

// function Repay() {
//   return null;
// }

export default Repay;