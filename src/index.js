import React, { useState, useEffect } from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import App from './App';
import Borrow from './Borrow';
import Lend from './Lend';
import Repay from './Repay';
import ConnectWithMetaMaskButton from "./ConnectWithMetaMaskButton";
import { Web3Context } from './web3Context';
import {
  getSignedContractAndProvider,
} from "./utils/common.js";

import abiJson from "./abis/SocialLendingContract.json";
import addressJson from "./abis/contract-address.json";

const rootElement = document.getElementById('root');

const Wrapper = () => {
  const lightTheme = createTheme({ palette: { mode: 'light' } });

  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [contractOwner, setContractOwner] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);

  const getWeb3Context = () => {
    return {
      provider, setProvider,
      contract, setContract,
      contractOwner, setContractOwner,
      currentAccount, setCurrentAccount
    };
  };

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

  useEffect(() => {
    getContractOwner();
  }, [currentAccount]);

  return (
    <ThemeProvider theme={lightTheme}>
      <Web3Context.Provider value={getWeb3Context()}>
        <ConnectWithMetaMaskButton
          contractOwner={contractOwner}
          currentAccount={currentAccount}
          setCurrentAccount={setCurrentAccount}
        />

        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/borrow" element={<Borrow />}/>
            <Route path="lend/:loanId" element={<Lend />} />
            <Route path="repay/:loanId" element={<Repay />} />
            <Route path="*" element={<App />} />
          </Routes>
        </BrowserRouter>
      </Web3Context.Provider>
    </ThemeProvider>
   
  );
};

ReactDOM.render(<Wrapper />, rootElement);