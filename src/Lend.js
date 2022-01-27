import { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import { Typography, Box, Grid, TextField, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import Panel from './Panel';
import { displayAddress } from './utils/common';
import { Web3Context } from './web3Context';
import Loader from './Loader';


function Lend() {
  const { contract, currentAccount } = useContext(Web3Context);
  let params = useParams();
  const [loanDetails, setloanDetails] = useState(null);
  const [loader, setLoader] = useState(true);
  const [contributionAmount, setContributionAmount] = useState('0');
  const [appError, setAppError] = useState(null);

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

  const loadLoanDetails = async () => {
    // TODO populate details from the smart contract for the loanID
    setTimeout(() => {
      setloanDetails({})
      setLoader(false);
    }, 2000);
  };

  const loanFunds = async () => {
    try {
      console.log("loanFunds() = contract: ", contract);
      const loanId = 0; // get from loanDetails
      const depositAmount = contributionAmount; // massage as needed

      const tx = await contract.depositToLoan(loanId, depositAmount);
      const rc = await tx.wait();
      const event = rc.events.find(event => event.event === 'LoanRequested');
      // const [loanId] = event.args;
      // setloanId(ethers.BigNumber.from(loanId));
      console.log('event.args: ', event.args);
    } catch (err) {
      setAppError(err?.data?.message);
    }
  };

  useEffect(() => {
    loadLoanDetails();
  }, [])

  return (
    <Panel>
      <Typography component="div" color="#1c3f71" fontSize="2rem"><h2>Lend</h2></Typography>
      
      <Loader show={loader} />

      {loanDetails ? (
      <Box sx={{ flexGrow: 1 }}>
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
              <Typography>USDC Requested:</Typography>
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
              <Typography>USDC Amount remaining:</Typography>
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
              <Typography>USDC Amount Contribution:</Typography>
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