import { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import { Typography, Box, Grid, TextField, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ethers } from 'ethers';
import Panel from './Panel';
import { displayAddress, getErrMessage } from './utils/common';
import { Web3Context } from './web3Context';
import Loader from './Loader';


function Lend() {
  const { contract, currentAccount } = useContext(Web3Context);
  let params = useParams();
  const [loanDetails, setloanDetails] = useState(null);
  const [loader, setLoader] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('0');
  const [appError, setAppError] = useState(null);
  const [lenderAlreadyDeposited, setLenderAlreadyDeposited] = useState(false);
  const [showLoanFunds, setShowLoanFunds] = useState(false);

  const navigate = useNavigate();
  
  const onChange = (e, field) => {
    const txt = e.target.value;
    if (field === 'contributionAmount') {
      setContributionAmount(parseInt(txt));
    }
  };

  const shouldDisableButton = () => {
    if (!contributionAmount) return true;
    const res = parseInt(contributionAmount) <= 0;
    return res;
  };

  const getLoanDetailsFromLoanID = async () => {
    try {
      console.log("loanFunds() = contract: ", contract);
      const tx = await contract.getLenderDetails(params.loanId);
      const rc = await tx.wait();
      const event = await rc.events?.filter((x)=> x.event == 'LoanDetails');
      const eventArgs = event[0].args;
      debugger;
      return eventArgs;

    } catch (err) {
      throw Error(err?.message || err);
    }
  };

  const getLenderDetails = async () => {
    try {
      console.log("loanFunds() = contract: ", contract);
      const tx = await contract.getLenderDetails(parseInt(params.loanId));
      const rc = await tx.wait();

      // TODO: GETTING NO EVENTS here
      console.log('rc: ', rc.events);

      debugger;

      const event = rc.events.find(event => event.event === 'LenderDetails');
      console.log("event: ", event);

      // const event = await rc.events?.filter((x)=> x.event == 'LenderDetails');
      // const eventArgs = event[0].args;
      // console.log("eventArgs: ", eventArgs);

      debugger;
      return 100;
      // return ethers.BigNumber.from(eventArgs.lenderAddress);
    } catch (err) {
      throw Error(err?.message || err);
    }
  };

  const loadDetails = async () => {
    try {
      setLoader(true);
      debugger;
      const lenderAddress = await getLenderDetails();
      debugger;
      // if (!lenderAddress) { // lender has not deposited funds for this loan
      //   const { borrowerAddress, loanAmount, amountRemaining, interestRate } = await getLoanDetailsFromLoanID();
      //   setloanDetails({ borrowerAddress, loanAmount, amountRemaining, interestRate });
      //   setShowLoanFunds(true);
      // } else {
      //   setLenderAlreadyDeposited(true);
      //   setShowLoanFunds(false);
      //   console.log(`Lender ${currentAccount} has already deposited funds for loanId ${params.loanId}`);
      // }
    } catch (err) {
      setAppError(getErrMessage(err));
    }

    setLoader(false);
  };

  const loanFunds = async () => {
    try {
      console.log("loanFunds() = contract: ", contract);
      const depositAmount = contributionAmount; // massage as needed
      const tx = await contract.depositToLoan(params.loanId, depositAmount);
      const rc = await tx.wait();
      const event = await rc.events?.filter((x)=> x.event == 'LoanRequested');
      const eventArgs = event[0].args;
      setLenderAlreadyDeposited(eventArgs.loanId);
    } catch (err) {
      setAppError(getErrMessage(err));
    }
  };

  useEffect(() => {
    if (contract) {
      loadDetails();
    }
  }, [contract]);


  return (
    <Panel>
      <Typography component="div" color="#1c3f71" fontSize="2rem"><h2>Lend</h2></Typography>
      
      <Loader show={loader} />

      {contract && showLoanFunds ? (
        <Box sx={{ flexGrow: 1 }}>
          {!lenderAlreadyDeposited ? (
             <Grid container spacing={2}>
                <Grid item container xs={12} alignItems="center">
                  <Grid item xs={6}>
                    <Typography component="p">ETH Borrower Address:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    {/* TODO -- set here borrower address */}
                    <TextField
                      style={{ width: '50%' }}
                      hiddenLabel
                      value={displayAddress(currentAccount)}
                      disabled
                    />
                  </Grid>
                </Grid>
    
                <Grid item container xs={12} alignItems="center">
                  <Grid item xs={6}>
                    <Typography>ETH Requested:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      style={{ width: '50%' }}
                      hiddenLabel
                      disabled
                    />
                  </Grid>
                </Grid>
    
                <Grid item container xs={12} alignItems="center">
                  <Grid item xs={6}>
                    <Typography>ETH Amount remaining:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      style={{ width: '50%' }}
                      hiddenLabel
                      disabled
                    />
                  </Grid>
                </Grid>
    
                <Grid item container xs={12} alignItems="center">
                  <Grid item xs={6}>
                    <Typography>Interest rate:</Typography>
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
    
                <Grid item container xs={12} alignItems="center">
                  <Grid item xs={6}>
                    <Typography>ETH Amount Contribution:</Typography>
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
                
                <Grid item xs={12}>
                  <Button sx={{ background: '#1c3f71', color: '#eaf6de' }} variant="contained" disabled={shouldDisableButton()} onClick={loanFunds}>
                    <Typography>Loan Funds</Typography>
                  </Button>
                </Grid>
             </Grid>
           </Grid>     
          ) : null}

          {lenderAlreadyDeposited ? (
            <Grid container spacing={2}>
                <Grid item container xs={12} alignItems="center">
                  <Grid item xs={6}>
                    <Typography>Days Remaining:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      value={90}
                      style={{ width: '50%' }}
                      hiddenLabel
                      disabled
                    />
                  </Grid>
                </Grid>

                <Grid item container xs={12} alignItems="center">
                  <Grid item xs={6}>
                    <Typography>ETH Loan Amount:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      value={750}
                      style={{ width: '50%' }}
                      hiddenLabel
                      disabled
                    />
                  </Grid>
                </Grid>
            </Grid>
          ) : null}

        </Box>
      ) : null}

      {appError ? (
        <Box padding={3}>
          <Alert severity="error">{appError}</Alert>
        </Box>
      ) : null}

    </Panel>
  );
}

export default Lend;