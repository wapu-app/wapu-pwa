import React from 'react';

import { useEffect, useState } from 'react'

import { connectWallet } from './sign';

function Wallet() {
  const [walletAddress, setWalletAddress] = useState("")

  useEffect (() => {
    getCurrentWalletConnected();
    addWalletListener();
  });

  const connectWallet = async () => {
    if (typeof window != 'undefined' && typeof window.ethereum != 'undefined') {
      try {
        /* Metamask is installed */
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setWalletAddress(accounts[0]);
        console.log(accounts[0]);
      } catch (err) {
        console.error(err.message);
    }
  } else {
    /* Metamask is not installed */
    console.log('Please install Metamask first');
  }
};


const getCurrentWalletConnected = async () => {
  if (typeof window != "undefined" && typeof window.ethereum != "undefined") {
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        console.log(accounts[0]);
      } else {
        console.log('Connect to Metamask using the Connect button')
      }
    } catch (err) {
      console.error(err.message);
  }
} else {
  /* Metamask is not installed */
  console.log('Please install Metamask first');
}
};


const addWalletListener = async () => {
  if (typeof window != 'undefined' && typeof window.ethereum != 'undefined') {
    window.ethereum.on("accountsChanged", (accounts) => {
      setWalletAddress(accounts[0]);
      console.log(accounts[0]);
    });
} else {
  /* Metamask is not installed */
  setWalletAddress("");
  console.log('Please install Metamask first');
}
};



  return (
    <div>
      <button className="downloadbtn" onClick={connectWallet}>
        <div>
          {walletAddress && walletAddress.length > 0
            ? `Connected: ${walletAddress.substring(
                0,
                6
              )}...${walletAddress.substring(38)}`
            : 'Connect'}
        </div>
      </button>
    </div>
  );
}

export default Wallet;