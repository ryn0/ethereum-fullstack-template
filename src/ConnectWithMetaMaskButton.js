import React, { useEffect, useState } from "react";
import { Button, Box , Typography, Alert } from "@mui/material";


const FoxIcon = () => 
  <img
      src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/MetaMask_Fox.svg/2048px-MetaMask_Fox.svg.png"
      style={{
          width: "40px",
          display: "inline",
          marginRight: "8px",
          color: '#eaf6de'
      }}
      alt="MetaMask Fox"
  />;

const MESSAGES = {
  CONNECTED: 'Metamask Wallet Connected',
  NOT_CONNECTED: 'Connect Metamask Wallet',
  INSTALL: 'Please install MetaMask browser extension to interact'
};

const ConnectWithMetaMaskButton = ({
  setCurrentAccount,
  currentAccount,
  contractOwner
}) => {
	const [errorMessage, setErrorMessage] = useState(null);
	const [defaultAccount, setDefaultAccount] = useState(null);
	const [connButtonText, setConnButtonText] = useState(MESSAGES.NOT_CONNECTED);

  // update account, will cause component re-render
	const accountChangedHandler = (newAccount) => {
		setDefaultAccount(newAccount.length > 0 ? newAccount : null);
    setConnButtonText(newAccount.length > 0 ? MESSAGES.CONNECTED : MESSAGES.NOT_CONNECTED);
    setCurrentAccount(Array.isArray(newAccount) ? newAccount[0]: newAccount);
	};

	const chainChangedHandler = () => {
		// reload the page to avoid any errors with chain change mid use of application
		window.location.reload();
	}

	const connectWalletHandler = () => {
		if (window.ethereum && window.ethereum.isMetaMask) {
			window.ethereum.request({ method: 'eth_requestAccounts'})
			.then(result => {
        const [account] = result;
				accountChangedHandler(account);
			})
			.catch(error => {
				setErrorMessage(error.message);
			});

		} else {
			console.error(MESSAGES.INSTALL);
			setErrorMessage(MESSAGES.INSTALL);
		}
	}

  const clickHandler = () => {
    if (!defaultAccount) {
      connectWalletHandler();
    }
  }

	// listen for account changes
	window.ethereum.on('accountsChanged', accountChangedHandler);
	window.ethereum.on('chainChanged', chainChangedHandler);

  useEffect(() => {
    if ((defaultAccount !== currentAccount) || (defaultAccount !== contractOwner)) {
      connectWalletHandler();
    }
  }, [currentAccount, contractOwner])
	

  return (
    <Box display="flex" flexDirection="column">
      <Button
        size="large"
        color="info"
        aria-label={connButtonText}
        component="div"
        onClick={clickHandler}
        disabled={!!defaultAccount}
      >
        <FoxIcon /><Typography>{connButtonText}</Typography>
      </Button>
      {defaultAccount && <Box padding={0} textAlign="center"><Typography fontWeight="bold" fontSize={14} color="#1c3f71">{defaultAccount}</Typography></Box>}
      {errorMessage && <Alert severity="error">{{errorMessage}}</Alert>}
    </Box>
  );
}

export default ConnectWithMetaMaskButton;