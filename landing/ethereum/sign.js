//export const web3 = new Web3(window.web3.currentProvider)

import { ethers } from 'ethers';

const Web3 = require('web3');
let web3;

if (typeof window !== 'undefined' && window.ethereum) {
  web3 = new Web3(window.ethereum);
} else {
  // Aquí puedes configurar una instancia de Web3 con un proveedor predeterminado si lo necesitas
  // Por ejemplo, puedes usar un proveedor de Infura para la comunicación con la cadena de bloques
  // const infuraProvider = new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID');
  // web3 = new Web3(infuraProvider);
  console.error('No se pudo acceder a window.ethereum. Asegúrese de que la aplicación se esté ejecutando en el navegador y de que MetaMask esté instalado.');
}
export async function connectWallet() {
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts[0];

    // Obtén la dirección de la cuenta conectada
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const address = await signer.getAddress();

    // Actualiza el estado con la dirección de la cuenta conectada
    setWalletAddress(address);
  } catch (error) {
    console.error(error);
  }
}

async function signPermitMessage(web3, account, tokenAddress, spender, value, nonce, deadline) {
    const domain = {
      name: 'USDC Token',
      version: '1',
      chainId: await web3.eth.getChainId(),
      verifyingContract: tokenAddress,
    };
  
    const types = {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    };
  
    const message = {
      owner: account,
      spender,
      value: value.toString(),
      nonce: nonce.toString(),
      deadline: deadline.toString(),
    };
  
    const data = JSON.stringify({
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        ...types,
      },
      domain,
      primaryType: 'Permit',
      message,
    });
  
    const signature = await new Promise((resolve, reject) => {
      web3.currentProvider.sendAsync(
        {
          method: 'eth_signTypedData_v4',
          params: [account, data],
          from: account,
        },
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result.result);
          }
        }
      );
    });
  
    const r = signature.slice(0, 66);
    const s = '0x' + signature.slice(66, 130);
    const v = '0x' + signature.slice(130, 132);
    const v_decimal = web3.utils.hexToNumber(v);
    

    return { v, r, s };
  }