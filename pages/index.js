import Head from 'next/head';
import styles from '../styles/Home.module.css';
import {useState, useEffect, useRef} from "react";
import {providers, Contract} from "ethers";
import Web3Modal from "web3modal";
import { ALLOWLIST_CONTRACT_ADDRESS, abi } from "../constants";

export default function Home() { 
  
  const [numOfAllowlisted, setNumOfAllowlisted] = useState(0);

  const [walletConnected, setWalletConnected] = useState(false);

  const [joinedAllowlist, setJoinedAllowlist] = useState(false);

 
  const [loading, setLoading] = useState(false);

  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();


    /**
   * Returns a Provider or Signer object representing the Ethereum RPC with or without the
   * signing capabilities of metamask attached
   *
   * A `Provider` is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc.
   *
   * A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to allow your website to
   * request signatures from the user using Signer functions.
   *
   */

  const getProviderOrSigner = async (needSigner = false) => {
   
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider);
      const {chainId} = await web3Provider.getNetwork();

    // Goerli Network's chainId is 5
    // If user is not connected to the Goerli network, let them know and throw an error
      if(chainId !== 5) {
        window.alert("Please connect to Goerli Network");
        throw new Error("Not connected to Goerli");
      } 

      if(needSigner) {

      const signer = await web3Provider.getSigner();
      return signer;
      }
    
      return web3Provider;
  };

//addAddressToAllowlist: Adds the current connected address to the Allowlist

  const addAddressToAllowlist = async () => {
    try {

      const signer = await getProviderOrSigner(true);
      // Create a new instance of the Contract with a Signer, which allows
      // update methods
      const allowlistContract = new Contract(ALLOWLIST_CONTRACT_ADDRESS, abi, signer);
      

       // calling addAllowist function of the solidity contract
      const tx = await allowlistContract.addAllowlist();
      setLoading(true);
      await tx.wait();
      setLoading(false);

      await getNumofAllowlisted();
      setJoinedAllowlist(true);

    } catch(err) {
      console.error(err);
     }
    };

//getNumberOfAllowlisted:  gets the number of allowlisted addresses
  
const getNumofAllowlisted = async () => {
  try {

    const provider = await getProviderOrSigner();
    const allowlistContract = new Contract(ALLOWLIST_CONTRACT_ADDRESS, abi, provider);

    const _numOfAllowlisted = await allowlistContract.noOfAddrAllowlisted();

    setNumOfAllowlisted(_numOfAllowlisted);
  } 
    catch(err) {
    console.error(err);
  }
};


const checkIfAddressInAllowlist = async () => {
  try {
    const signer = await getProviderOrSigner(true);
    const allowlistContract = new Contract (ALLOWLIST_CONTRACT_ADDRESS, abi ,signer);

    const address = signer.getAddress();
    const _joinedAllowlist = await allowlistContract.allowlistedAddrs(address);

    setJoinedAllowlist(_joinedAllowlist);
  }
  catch(err) {
    console.error(err);
  }
};

const connectWallet = async() => {
  try {

  // Get the provider from web3Modal, which in our case is MetaMask
  // When used for the first time, it prompts the user to connect their wallet
    await getProviderOrSigner();
    setWalletConnected(true);

    checkIfAddressInAllowlist();
    getNumofAllowlisted();
  }
  catch(err) {
    console.error(err);
  }
};


const renderButton =  () => {
  if(walletConnected){
    if(joinedAllowlist) {
      return (
      <div className = {styles.description}> 
       Hey degen, this address is already on the Allowlist 
      </div>
      );

    } else if(loading) {
      return (
      <button className={styles.button}> Loading... </button>
      );
    } else {
      return (
        <button className={styles.button} onClick = {addAddressToAllowlist} >
        Claim Allowlist 
        </button>
      );
    }
  } else {
    return (
    <button className={styles.button} onClick={connectWallet}>
     Connect your Wallet ser! 
    </button>
    );
  }
};

  // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called


  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if(!walletConnected) {
     // Assign the Web3Modal class to the reference object by setting it's `current` value
    // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      }),
      connectWallet();
    }
  }, [walletConnected]); 

  return (

    <div>
      <Head>
        <title> Allowlist Dapp</title>
        <meta name = "description" content = "Allowlist-Dapp" />
      </Head>

      <div className = {styles.main}>
      <div>
        <h1 className = {styles.title}> Welcome BUIDLER ! </h1> 
        <div className = {styles.description}>
          Lets build the Third Web. Together! 
        </div>
        <div className = {styles.description}>
          {numOfAllowlisted} Allowlists have been registered! 
          
        </div>
          {renderButton()}
        </div>
        <div>
        <img className = {styles.image} src="./builder-img.svg"/>
        </div>
      
      </div>
      <footer className={styles.footer}>
        Made With 💛 by AvantGard
      </footer>


    </div>

  );
}