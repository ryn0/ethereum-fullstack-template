import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import { Typography, Box, Grid, TextField, Link } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ethers } from 'ethers';
import Panel from './Panel';
import { Web3Context } from './web3Context';

const getLoanLink = (loanId) => {
  return `/lend/${loanId}`;
};

function Borrow() {

  const {
    provider, setProvider,
    contract, setContract,
    contractOwner, setContractOwner,
    currentAccount, setCurrentAccount
  } = useContext(Web3Context);

  console.log("contract: ", contract);

  const navigate = useNavigate();
  const [amountRequested, setAmountRequested] = useState();
  const [loanId, setloanId] = useState();
  
  const routeToLend = () => {
    navigate(
      getLoanLink(loanId)
    );
  };

  const generateLink = async () => {
    debugger;
    console.log("generateLink() = contract: ", contract);
    const tx = await contract.createLoan(amountRequested);
    const rc = await tx.wait();
    const event = rc.events.find(event => event.event === 'LoanRequested');
    const [loanId] = event.args;
    console.log(ethers.BigNumber.from(loanId))
    setloanId(ethers.BigNumber.from(loanId));
  };

  const onChange = (e, field) => {
    const txt = e.target.value;
    if (field === 'amountRequested') {
      setAmountRequested(parseInt(txt));
    }
  };

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
                value={amountRequested}
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

        <Box>
          <Button sx={{ background: '#1c3f71', color: '#eaf6de' }} variant="contained" onClick={generateLink}>
            <Typography>Generate Loan Link</Typography>
          </Button>
        </Box>
      </Box>

      {loanId ? (
        <Link
          component="button"
          variant="body2"
          onClick={routeToLend}
        >
          {getLoanLink(loanId)}
        </Link>
      ) : null}
      
    </Panel>
  );
}

export default Borrow;