import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import { Typography, Box, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import Panel from './Panel';
import ConnectWithMetaMaskButton from "./ConnectWithMetaMaskButton";

// import abiJson from "./abis/abi.json";
// import addressJson from "./abis/address.json";

const ButtonLinks = ({ text, onClick, style }) => {
  return (
    <Button sx={{ background: '#1c3f71', color: '#eaf6de', ...style }} variant="contained" onClick={onClick}>
      <Typography sx={{ fontSize: '1.5rem' }}>{text}</Typography>
    </Button>
  );
};

function App() {
  const navigate = useNavigate();

  // const [contractOwner, setContractOwner] = useState("");
  // const [currentAccount, setCurrentAccount] = useState("");
  // const [provider, setProvider] = useState(null);
  // const [contract, setContract] = useState(null);

  // const address = addressJson.address;
  // const contractABI = abiJson.abi;

  // useEffect(() => {
  //   checkIfWalletIsConnected(setCurrentAccount);
  //   updateProviderAndContract(address, contractABI, setProvider, setContract);
  // }, []);

  // useEffect(() => {
  //   getContractOwner(setContractOwner);
  // }, [currentAccount]);

  // const getContractOwner = async (setContractOwner) => {
  //   try {
  //     const contract = getSignedContract(address, contractABI);

  //     if (!contract) {
  //       return;
  //     }

  //     const owner = await contract.owner();

  //     setContractOwner(owner.toLowerCase());
  //   } catch (err) {
  //     console.log(err);
  //   }
  // };

  // const isOwner = contractOwner !== "" && contractOwner.toLowerCase() === currentAccount.toLowerCase();
  // const isMetamaskConnected = !!currentAccount;

  const isMetamaskConnected = false;

  return (
    <Panel>
      <Typography component="div" color="#1c3f71" textTransform="uppercase" fontSize="2rem"><h1>Social Lending App</h1></Typography>
      
      {!isMetamaskConnected && (
        <ConnectWithMetaMaskButton
          setCurrentAccount={() => {}}
          isMetamaskConnected={isMetamaskConnected}
        />
      )}

      <Box>
        <ButtonLinks text="REQUEST A LOAN" style={{ marginRight: '2rem' }} onClick={() => navigate('borrow')} />
        {/* just for testing remove later */}
        <ButtonLinks text="LEND" onClick={() => navigate('lend/12345')} />
      </Box>
    </Panel>
  );
}

export default App;