import Head from 'next/head';
import { Contract,ethers,providers,utils } from 'ethers';
import styles from '@/styles/Home.module.css';
import React, {useEffect,useState,useRef} from 'react';
import Web3Modal from "web3modal";
import {abi, NFT_CONTRACT_ADDRESS} from "../constants";

export default function Home() {

 const[walletConnected, setWalletConnected] = useState(false);
 const[presaleStarted, setPresaleStarted] = useState(false);
 const[presaleEnded, setPresaleEnded] =  useState(false);
 const[loading, setLoading] = useState(false);
 const[isOwner, setIsOwner] = useState(false);
 const[tokenIdsMinted, setTokenIdsMinted] = useState("0");

 const web3ModalRef = useRef();

 const getProviderOrSigner = async(needSigner = false) => {

   const provider = await web3ModalRef.current.connect();
   const web3Provider = new providers.Web3Provider(provider);

   const {chainId} =await web3Provider.getNetwork();
    if(chainId !== 5){
     window.alert("Change network to Goerli");
     throw new Error("Change network to Goerli");
    }

    if(needSigner){
     const signer = web3Provider.getSigner();
     return signer;
    }

    return web3Provider;
 
 }

 const presaleMint = async() => {
  try{
    const signer = await getProviderOrSigner(true);

    const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi,signer);

    const tx = await nftContract.presaleMint({
      value: utils.parseEther("0.01"),
    });

    setLoading(true);

    await tx.wait();

    setLoading(false);
    window.alert("You've successfully minted a CryptoDev nft");

  }catch(e){
    console.error(e);
  }
 }

 const publicMint = async() => {
  try{
    const signer = await getProviderOrSigner(true);
    const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi,signer);

    const tx = await nftContract.mint({
      value: utils.parseEther("0.01")
    });

    setLoading(true);
    await tx.wait();
    setLoading(false);
    window.alert("You successfully minted a Crypto Dev!");

  }catch(e){
    console.error(e)
  }
 }

 const connectWallet = async() =>{
  try{
    await getProviderOrSigner();
    setWalletConnected(true);

  } catch(e){
    console.error(e);
  }
 }

 const startPresale = async() => {
  try{
    const signer = await getProviderOrSigner(true);

    const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi,signer);

    const tsx = await nftContract.startPresale();

    setLoading(true);
    await tsx.wait();
    setLoading(false);

    await checkIfPresaleStarted();


  } catch(e){
    console.error(e);
  }
 }

 const checkIfPresaleStarted = async() => {
  try{
    const provider = await getProviderOrSigner(false);
    const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi,provider);

    const _presaleStarted = await nftContract.presaleStarted();

    if(!_presaleStarted){
      await getOwner();
    }

    setPresaleStarted(_presaleStarted);
    return presaleStarted;

  }catch(e){
    console.error(e);
    return false;
  }
 }

 const checkIfPresaleEnded = async() => {
  try{
    const provider = await getProviderOrSigner(false);
    const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi, provider);

    const _presaleEnded = await nftContract.presaleEnded();

    const hasEnded = _presaleEnded.lt(Math.floor(Date.now()/1000));

    if(hasEnded){
      setPresaleEnded(hasEnded);
    }else{
      setPresaleEnded(hasEnded);
    }

    return hasEnded;

  } catch(e){
    console.error(e);
    return false;
  }
 }

 const getOwner = async() =>{
  try{
    const provider = await getProviderOrSigner(false);
    const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi,provider);
    const _owner = await nftContract.owner();
  
    const signer = await getProviderOrSigner(true);
    const _address = await signer.getAddress();
  
    if(_owner.toLowerCase() === _address.toLowerCase())
    {
     setIsOwner(true);
    }

  } catch(e){
    console.error(e);
  }

 }

 const getTokenIdsMinted = async() => {
  try{
    const provider = await getProviderOrSigner(false);
    const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
  
    const _tokenIds = await nftContract.tokenIds();
  
    setTokenIdsMinted(_tokenIds.toString());
  }catch(e){
    console.error(e);
  }

 }

 useEffect(() => {
  // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
  if (!walletConnected) {
    // Assign the Web3Modal class to the reference object by setting it's `current` value
    // The `current` value is persisted throughout as long as this page is open
    web3ModalRef.current = new Web3Modal({
      network: "goerli",
      providerOptions: {},
      disableInjectedProvider: false,
    });
    connectWallet();

    // Check if presale has started and ended
    const _presaleStarted = checkIfPresaleStarted();
    if (_presaleStarted) {
      checkIfPresaleEnded();
    }

    getTokenIdsMinted();

    // Set an interval which gets called every 5 seconds to check presale has ended
    const presaleEndedInterval = setInterval(async function () {
      const _presaleStarted = await checkIfPresaleStarted();
      if (_presaleStarted) {
        const _presaleEnded = await checkIfPresaleEnded();
        if (_presaleEnded) {
          clearInterval(presaleEndedInterval);
        }
      }
    }, 5 * 1000);

    // set an interval to get the number of token Ids minted every 5 seconds
    setInterval(async function () {
      await getTokenIdsMinted();
    }, 5 * 1000);
  }
}, [walletConnected]);

/*
    renderButton: Returns a button based on the state of the dapp
  */
const renderButton = () => {
  // If wallet is not connected, return a button which allows them to connect their wllet
  if (!walletConnected) {
    return (
      <button onClick={connectWallet} className={styles.button}>
        Connect your wallet
      </button>
    );
  }

  // If we are currently waiting for something, return a loading button
  if (loading) {
    return <button className={styles.button}>Loading...</button>;
  }

  // If connected user is the owner, and presale hasnt started yet, allow them to start the presale
  if (isOwner && !presaleStarted) {
    return (
      <button className={styles.button} onClick={startPresale}>
        Start Presale!
      </button>
    );
  }

  // If connected user is not the owner but presale hasn't started yet, tell them that
  if (!presaleStarted) {
    return (
      <div>
        <div className={styles.description}>Presale hasnt started!</div>
      </div>
    );
  }

  // If presale started, but hasn't ended yet, allow for minting during the presale period
  if (presaleStarted && !presaleEnded) {
    return (
      <div>
        <div className={styles.description}>
          Presale has started!!! If your address is whitelisted, Mint a Crypto
          Dev 🥳
        </div>
        <button className={styles.button} onClick={presaleMint}>
          Presale Mint 🚀
        </button>
      </div>
    );
  }

  // If presale started and has ended, its time for public minting
  if (presaleStarted && presaleEnded) {
    return (
      <button className={styles.button} onClick={publicMint}>
        Public Mint 🚀
      </button>
    );
  }
};

return (
  <div>
    <Head>
      <title>Crypto Devs</title>
      <meta name="description" content="Whitelist-Dapp" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <div className={styles.main}>
      <div>
        <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
        <div className={styles.description}>
          Its an NFT collection for developers in Crypto.
        </div>
        <div className={styles.description}>
          {tokenIdsMinted}/20 have been minted
        </div>
        {renderButton()}
      </div>
      <div>
        <img className={styles.image} src="./cryptodevs/0.svg" />
      </div>
    </div>

    <footer className={styles.footer}>
      Made with &#10084; by Crypto Devs
    </footer>
  </div>
);
}



