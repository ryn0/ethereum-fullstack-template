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

export const displayAddress = (addr = '') => {
    if (addr === null) return '';
  
    const frags = [
      addr.substr(0, 15),
      '...',
      addr.substr(addr.length - 6, addr.length - 1)
    ];
  
    return frags.join('');
};

export const getErrMessage = (errObj) => {
    if (errObj?.data?.message) return errObj?.data?.message;
    if (errObj?.message) return errObj?.message;
    debugger;
    return JSON.stringify(errObj);
};
