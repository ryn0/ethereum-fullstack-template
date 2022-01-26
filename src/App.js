import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import { Typography, Box } from '@mui/material';
import Panel from './Panel';
import ConnectWithMetaMaskButton from "./ConnectWithMetaMaskButton";
import { Web3Context } from './web3Context';

import abiJson from "./abis/SocialLendingContract.json";
import addressJson from "./abis/contract-address.json";

import {
  getSignedContractAndProvider,
} from "./utils/common.js";

const ButtonLinks = ({ text, onClick, style }) => {
  return (
    <Button sx={{ background: '#1c3f71', color: '#eaf6de', ...style }} variant="contained" onClick={onClick}>
      <Typography sx={{ fontSize: '1.5rem' }}>{text}</Typography>
    </Button>
  );
};

function App() {
  const {
    provider, setProvider,
    contract, setContract,
    contractOwner, setContractOwner,
    currentAccount, setCurrentAccount
  } = useContext(Web3Context);

  const navigate = useNavigate();

  const address = addressJson.SocialLendingContract;
  const contractABI = abiJson.abi;

  const getContractOwner = async () => {
    try {
      const contractAndProvider = getSignedContractAndProvider(address, contractABI);

      if (!contractAndProvider) {
        return;
      }

      const [contract, provider] = contractAndProvider;

      setProvider(provider);
      setContract(contract);

      const owner = await contract.owner();

      setContractOwner(owner.toLowerCase());

    } catch (err) {
      console.error(err);
    }
  };

  const testFunction = async () => {
     const txn = await contract.Hello();
     //console.log(id);
     //const loanID = await txn.wait();
    console.log(txn);
  }

  const isMetamaskConnected = provider && contract && contractOwner;

  useEffect(() => {
    getContractOwner();
  }, [currentAccount]);

  // console.log(provider);
  // console.log(contract);
  // console.log(contractOwner);
 
//console.log(currentAccount);
  return (
    <Panel>
      <Typography component="div" color="#1c3f71" textTransform="uppercase" fontSize="2rem"><h1>Social Lending App</h1></Typography>
     
      <ConnectWithMetaMaskButton
        contractOwner={contractOwner}
        currentAccount={currentAccount}
        setCurrentAccount={setCurrentAccount}
      />
 
      {isMetamaskConnected && currentAccount? (
        <Box>
          <ButtonLinks text="REQUEST A LOAN" style={{ marginRight: '2rem' }} onClick={() => testFunction()} />
        </Box>
      ) : null}
   
    </Panel>
  );


}

export default App;