import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import { Typography, Box, Grid, TextField, Link, Alert } from '@mui/material';
import { ethers } from 'ethers';
import Panel from './Panel';
import { Web3Context } from './web3Context';

const getLoanLink = (loanId) => {
  return `/lend/${loanId}`;
};

const displayAddress = (addr = '') => {
  if (addr === null) return '';

  const frags = [
    addr.substr(0, 15),
    '...',
    addr.substr(addr.length - 6, addr.length - 1)
  ];

  return frags.join('');
};

function Borrow() {
  const { contract, currentAccount } = useContext(Web3Context);

  const navigate = useNavigate();
  const [amountRequested, setAmountRequested] = useState('0');
  const [loanId, setloanId] = useState();
  const [appError, setAppError] = useState(null);
  
  const routeToLend = () => {
    navigate(
      getLoanLink(loanId)
    );
  };

  const generateLink = async () => {
    try {
      console.log("generateLink() = contract: ", contract);
      const tx = await contract.createLoan(amountRequested);
      const rc = await tx.wait();
      const event = rc.events.find(event => event.event === 'LoanRequested');
      const [loanId] = event.args;
      setloanId(ethers.BigNumber.from(loanId));
    } catch (err) {
      setAppError(err?.data?.message);
    }
  };

  const onChange = (e, field) => {
    const txt = e.target.value;
    if (field === 'amountRequested') {
      setAmountRequested(parseInt(txt));
    }
  };

  const shouldDisableButton = () => {
    if (!amountRequested) return true;
    const res = parseInt(amountRequested) <= 0;
    return res;
  };

  /**
   * TODO -- check if the address already has a loan
   */

  return (
    <Panel>
      <Typography component="div" color="#1c3f71" fontSize="2rem"><h2>Borrow</h2></Typography>

      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={2}>
          <Grid item container xs={12} alignItems="center">
            <Grid item xs={6}>
              <Typography component="p">Total amount of USDC requested:</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                value={amountRequested ? amountRequested.toString() : ''}
                onChange={(e) => onChange(e, 'amountRequested')}
                style={{ width: '50%' }}
                hiddenLabel
              />
            </Grid>
          </Grid>

          <Grid item container xs={12} alignItems="center">
            <Grid item xs={6}>
              <Typography>Ethereum address of the borrower:</Typography>
            </Grid>
            <Grid item xs={6}>
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


        </Grid>

        {!loanId ? (
          <Box>
            <Button sx={{ background: '#1c3f71', color: '#eaf6de' }} variant="contained" disabled={shouldDisableButton()} onClick={generateLink}>
              <Typography>Generate Loan Link</Typography>
            </Button>
          </Box>
        ) : null}
      </Box>

      {/* generated link */}
      {loanId ? (
        <Link
          component="button"
          variant="body2"
          onClick={routeToLend}
        >
          {getLoanLink(loanId)}
        </Link>
      ) : null}

      {appError ? (
        <Box padding={3}>
          <Alert severity="error">{appError}</Alert>
        </Box>
      ) : null}
      
    </Panel>
  );
}

export default Borrow;