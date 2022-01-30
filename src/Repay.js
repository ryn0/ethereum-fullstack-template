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
 

  const onChange = (e, field) => {
    const txt = e.target.value;
    if (field === 'contributionAmount') {
      setContributionAmount(txt);
    }
  };

  const shouldDisableButton = () => {
    if (!contributionAmount) return true;
    if (contributionAmount.slice(-1) === '.') return true;
    const res = parseFloat(contributionAmount) <= 0;
    return res;
  };

  
  const getLoanDetailsFromLoanID = async () => {
    try {
      const tx = await contract.getLoanDetailsFromLoanID(parseFloat(params.loanId));
      const rc = await tx.wait();

      const event = await rc.events?.filter((x)=> x.event == 'LoanDetails');
      const eventArgs = event[0].args;
      return eventArgs;

    } catch (err) {
      throw Error(err?.message || err);
    }
  };


  const loadDetails = async () => {
    try {
      setLoader(true);
     
      const { loanAmount  } = await getLoanDetailsFromLoanID();
   
        setloanDetails({
 
          loanAmount: ethers.BigNumber.from(loanAmount),
        });

        console.log(loanAmount);


    } catch (err) {
      setAppError(getErrMessage(err));
    }

    setLoader(false);
  };
 
const repayLoan = async () => {
  try {
    const depositAmount =  contributionAmount.toString(); // massage as needed
    const options = { value: ethers.utils.parseEther(depositAmount) };

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

};


  useEffect(() => {
    if (contract) {
     // loadDetails();
    }
  }, [contract]);

  return (
    <Panel>
      <Typography component="div" color="#1c3f71" fontSize="2rem"><h2>Repay</h2></Typography>

      <Loader show={loader} />


      {contract   ? (
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
                
                      disabled
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
                
                      disabled
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


        </Grid>

        <Box>
          <Button sx={{ background: '#1c3f71', color: '#eaf6de' }} variant="contained"  disabled={shouldDisableButton()}  onClick={repayLoan}>
            <Typography>Repay Loan</Typography>
          </Button>
        </Box>
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

export default Repay;