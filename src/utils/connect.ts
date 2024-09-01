import { getEnv } from '../settings/env';
import { getPublicKey, initConfig as initBTCConfig, requestAccounts } from '@joyid/bitcoin'
import { connect, initConfig } from '@joyid/ckb';
import { mainConfig, testConfig } from '../lib/wallet/constants';
import store from "../store/store.ts";
import {saveJoyidInfo} from "../store/wallet/walletSlice.ts";


export const OKXConnect = async () => {

  const okxwallet = (window as any)["okxwallet"];
    if (typeof okxwallet !== "undefined") {
      if (getEnv()==='Mainnet') {
        const result = await okxwallet.bitcoin.connect();
        return result;
      } else {
        const result = await okxwallet.bitcoinTestnet.connect();
        return result;
      }
    } else {
      throw new Error("OKX Wallet is no installed!");
    }
}

export const UnisatConnect = async () => {
  const unisat = (window as any)["unisat"];
    if (typeof unisat !== "undefined") {
      // const curNetwork = await unisat.getNetwork();

      if (getEnv() === 'Testnet') {
        //@ts-ignore
        await unisat.switchNetwork('testnet');
      }else{
          await unisat.switchNetwork('livenet');
      }

      const accounts: string[] = await unisat.requestAccounts();
      const pubkey: string = await unisat.getPublicKey();
      return { accounts, pubkey };
    } else {
      throw new Error("UniSat Wallet is no installed!");
    }
}

export const JoyIDBTCconnect = async () => {
   initBTCConfig({
      // your app name
      name: "Haste Pro",
      // your app logo
      logo: "https://fav.farm/🆔",
      // JoyID app URL, this is for testnet, for mainnet, use "https://app.joy.id"
      // joyidAppURL: "https://testnet.joyid.dev",
      // joyidAppURL: process.env.NODE_ENV === 'development' ? testConfig.joyIdUrl : mainConfig.joyIdUrl,
      joyidAppURL: getEnv() === 'Testnet' ? testConfig.joyIdUrl : mainConfig.joyIdUrl,
    });

    const [address] = await requestAccounts();
    const publicKey = getPublicKey();
    return { address, publicKey };
}

export const JoyIDCKBConnect = async () => {
  initConfig({
      name: "Haste Pro",
      // your app logo
      logo: "https://fav.farm/🆔",
      // JoyID app URL, this is for testnet, for mainnet, use "https://app.joy.id"
      // joyidAppURL: "https://testnet.joyid.dev",
      // joyidAppURL: process.env.NODE_ENV === 'development' ? testConfig.joyIdUrl : mainConfig.joyIdUrl,
      joyidAppURL: getEnv() === 'Testnet' ? testConfig.joyIdUrl : mainConfig.joyIdUrl,
  })

  const JoyIDCkbWallet = await connect();

  store.dispatch(saveJoyidInfo(JoyIDCkbWallet))


  return {
    address: JoyIDCkbWallet.address,
    publickKey: JoyIDCkbWallet.pubkey
  }
}

export const ReiConnect = async () =>{

    const {ckb} = window as any;
    if (typeof ckb !== "undefined") {

        let netData = getEnv() === 'Testnet' ?'testnet':"mainnet";
        await ckb.request({method:"ckb_switchNetwork",data:netData})

        const account: string = await ckb.request({method:"ckb_requestAccounts"});
        const pubkey: string = await ckb.request({method:"ckb_getPublicKey"});
        return { account, pubkey };
    } else {
        throw new Error("REI Wallet is no installed!");
    }

}
