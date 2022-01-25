import { useNavigate, useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import { Typography, Box, Grid, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import Panel from './Panel';


function Lend() {
  let params = useParams();

  const navigate = useNavigate();
  
  const buttonClick = () => {
    
  };

  return (
    <Panel>
      <Typography component="div" color="#1c3f71" fontSize="2rem"><h2>Lend</h2></Typography>
      
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={2}>
          <Grid item container xs={12} alignItems="center">
            <Grid item xs={6}>
              <Typography component="p">Ethereum address to fund:</Typography>
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
              <Typography>Total amount of USDC requested:</Typography>
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
              <Typography>Total amount of USDC remaining:</Typography>
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
          <Button sx={{ background: '#1c3f71', color: '#eaf6de' }} variant="contained" onClick={buttonClick}>
            <Typography>Action?</Typography>
          </Button>
        </Box>
      </Box>
      

    </Panel>
  );
}

export default Lend;