import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import { Typography, Box } from '@mui/material';
import Panel from './Panel';
import { Web3Context } from './web3Context';

const ButtonLinks = ({ text, onClick, style }) => {
  return (
    <Button sx={{ background: '#1c3f71', color: '#eaf6de', ...style }} variant="contained" onClick={onClick}>
      <Typography sx={{ fontSize: '1.5rem' }}>{text}</Typography>
    </Button>
  );
};

function App() {
  const {
    provider,
    contract,
    contractOwner,
    currentAccount
  } = useContext(Web3Context);

  const navigate = useNavigate();

  const isMetamaskConnected = provider && contract && contractOwner;

  return (
    <Panel>
      <Typography component="div" color="#1c3f71" textTransform="uppercase" fontSize="2rem"><h1>Social Lending App</h1></Typography>
     
      {isMetamaskConnected && currentAccount? (
        <Box>
          <ButtonLinks text="REQUEST A LOAN" style={{ marginRight: '2rem' }} onClick={() => navigate('borrow')} />
        </Box>
      ) : null}
   
    </Panel>
  );


}

export default App;