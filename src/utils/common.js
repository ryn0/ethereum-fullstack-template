import { ethers } from 'ethers';

export const getSignedContractAndProvider = (address, contractABI) => {
    const { ethereum } = window;

    if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(address, contractABI, signer);
        return [contract, provider];
    }

    return null
};

