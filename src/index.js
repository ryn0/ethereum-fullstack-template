import React, { useState } from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import App from './App';
import Borrow from './Borrow';
import Lend from './Lend';
import Repay from './Repay';
import { Web3Context } from './web3Context';

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

  return (
    <ThemeProvider theme={lightTheme}>
      <Web3Context.Provider value={getWeb3Context()}>
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