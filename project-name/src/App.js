import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import { Typography, Box, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import Panel from './Panel';

const ButtonLinks = ({ text, onClick, style }) => {
  return (
    <Button sx={{ background: '#1c3f71', color: '#eaf6de', ...style }} variant="contained" onClick={onClick}>
      <Typography sx={{ fontSize: '1.5rem' }}>{text}</Typography>
    </Button>
  );
};

function App() {
  const navigate = useNavigate();

  return (
    <Panel>
      <Typography component="div" color="#1c3f71" textTransform="uppercase" fontSize="2rem"><h1>Social Lending App</h1></Typography>
      
      <Box>
        <ButtonLinks text="REQUEST A LOAN" style={{ marginRight: '2rem' }} onClick={() => navigate('borrow')} />
        <ButtonLinks text="LEND" onClick={() => navigate('lend/12345')} />
      </Box>
    </Panel>
  );
}

export default App;
