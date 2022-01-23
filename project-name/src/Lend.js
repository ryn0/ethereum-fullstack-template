import { useNavigate, useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import { Typography, Box, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import Panel from './Panel';


function Lend() {
  let params = useParams();

  return (
    <Panel>
      <Typography component="div" color="#1c3f71" fontSize="2rem"><h2>Lend</h2></Typography>
      <Typography component="h3">Lend your money for <b>{params.loanId}</b></Typography>

    </Panel>
  );
}

export default Lend;
