import { getEnv } from "../../settings/env";
import { WalletType } from "../../types/BTC";
import {
  // requestAccounts,
  // getPublicKey,
  signPsbt
} from "@joyid/bitcoin";
import { getBTC } from "./memepool";

export const signPsdt = async (hex: string, walletType: WalletType) => {
    if (walletType == "unisat") {
      const unisat = (window as any)["unisat"];
      if (typeof unisat !== "undefined") {

        const curNetwork = await unisat.getNetwork();
        if (curNetwork != getEnv().toLocaleLowerCase()) {
          await unisat.switchNetwork(getEnv().toLocaleLowerCase());
        }

        const newHex = await unisat.signPsbt(hex);
        return newHex;
      } else {
        throw new Error("UniSat Wallet is no installed!");
      }
    } else if (walletType == "okx") {
      const okxwallet = (window as any)["okxwallet"];
      if (typeof okxwallet !== "undefined") {
        console.log("OKX is installed!");

        // {address publicKey}
        if (getEnv() === 'Mainnet') {
          const result = await okxwallet.bitcoin.signPsbt(hex);
          return result;
        } else {
          const result = await okxwallet.bitcoinTestnet.signPsbt(hex);
          return result;
        }
      } else {
        throw new Error("OKX Wallet is no installed!");
      }
    } else if (walletType == "joyid") {
      const result = await signPsbt(hex);
      return result;
    }

    throw new Error("Please connect btc wallet");
}

export const getBTCAsset = async(address: string) => {
  let result = await getBTC(address)
  return result;
}
