import React from "react";
import Button from '@mui/material/Button';
import { connectWallet } from "./utils/common";
import { Typography } from "@mui/material";


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

export default function ConnectWithMetaMaskButton({ setCurrentAccount }) {
  return (
    <Button size="large" color="info" aria-label="Connect to Meta Mask" component="span" onClick={() => connectWallet(setCurrentAccount)}>
        <FoxIcon /><Typography>Connect To Metamask</Typography>
    </Button>
  );
}