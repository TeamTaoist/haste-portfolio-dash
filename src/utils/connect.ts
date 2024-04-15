import { getEnv } from '@/settings/env';
import { getPublicKey, initConfig as initBTCConfig, requestAccounts } from '@joyid/bitcoin' 
import { connect, initConfig } from '@joyid/ckb';

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
      const curNetwork = await unisat.getNetwork();
      if (process.env.NODE_ENV === 'development') {
        //@ts-ignore
        await unisat.switchNetwork('testnet');
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
      name: "JoyID demo",
      // your app logo
      logo: "https://fav.farm/🆔",
      // JoyID app URL, this is for testnet, for mainnet, use "https://app.joy.id"
      joyidAppURL: "https://testnet.joyid.dev",
    });

    const [address] = await requestAccounts();
    const publicKey = getPublicKey();
    return { address, publicKey };
}

export const JoyIDCKBConnect = async () => {
  initConfig({
    name: "JoyID demo",
      // your app logo
      logo: "https://fav.farm/🆔",
      // JoyID app URL, this is for testnet, for mainnet, use "https://app.joy.id"
      joyidAppURL: "https://testnet.joyid.dev",
  })
  const JoyIDCkbWallet = await connect();
  return {
    address: JoyIDCkbWallet.address,
    publickKey: JoyIDCkbWallet.pubkey
  }
}

