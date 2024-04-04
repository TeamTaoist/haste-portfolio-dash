import superagent from "superagent";

import { WalletType, btc_AddressInfo, btc_TxInfo } from "../interface";
import { initConfig, sendPsbt } from "@joyid/bitcoin";
import {
  requestAccounts,
  getPublicKey,
  // signPsbt as joyID_signPsbt,
} from "@joyid/bitcoin";
import { isTestNet, mainConfig, testConfig } from "./constants";

export class BtcHepler {
  private static _instance: BtcHepler;
  private _network: string = "testnet";
  private constructor() {}

  public static get instance() {
    if (!BtcHepler._instance) {
      BtcHepler._instance = new BtcHepler();
    }
    return this._instance;
  }

  async unisat_onConnect() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unisat = (window as any)["unisat"];
    if (typeof unisat !== "undefined") {
      console.log("UniSat Wallet is installed!");

      const curNetwork = await unisat.getNetwork();
      if (curNetwork != this._network) {
        await unisat.switchNetwork(this._network);
      }

      const accounts: string[] = await unisat.requestAccounts();
      const pubkey: string = await unisat.getPublicKey();
      return { accounts, pubkey };
    } else {
      throw new Error("UniSat Wallet is no installed!");
    }
  }

  async okx_onConnect() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const okxwallet = (window as any)["okxwallet"];
    if (typeof okxwallet !== "undefined") {
      console.log("OKX is installed!");

      // {address publicKey}
      const cfg = isTestNet() ? testConfig : mainConfig;
      if (cfg.isMainnet) {
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

  async joyId_onConnect() {
    const cfg = isTestNet() ? testConfig : mainConfig;

    initConfig({
      // your app name
      name: "JoyID demo",
      // your app logo
      logo: "https://fav.farm/🆔",
      // JoyID app URL, this is for testnet, for mainnet, use "https://app.joy.id"
      joyidAppURL: cfg.joyIdUrl,
    });

    const [address] = await requestAccounts();
    const publicKey = getPublicKey();
    console.log(address, publicKey);

    return { address, publicKey };
  }

  async getUtxo(address: string) {
    const cfg = isTestNet() ? testConfig : mainConfig;

    const result = await superagent
      .get(
        `https://mempool.space${
          cfg.isMainnet ? "" : "/testnet"
        }/api/address/${address}/utxo`
      )
      .catch((err) => {
        console.error(err);
      });

    if (result && result.status == 200) {
      return JSON.parse(result.text);
    }
  }

  async signPsdt(hex: string, walletType: WalletType) {
    if (walletType == "unisat") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const unisat = (window as any)["unisat"];
      if (typeof unisat !== "undefined") {
        console.log("UniSat Wallet is installed!");

        const curNetwork = await unisat.getNetwork();
        if (curNetwork != this._network) {
          await unisat.switchNetwork(this._network);
        }

        const newHex = await unisat.signPsbt(hex);
        return newHex;
      } else {
        throw new Error("UniSat Wallet is no installed!");
      }
    } else if (walletType == "okx") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const okxwallet = (window as any)["okxwallet"];
      if (typeof okxwallet !== "undefined") {
        console.log("OKX is installed!");

        // {address publicKey}
        const cfg = isTestNet() ? testConfig : mainConfig;
        if (cfg.isMainnet) {
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
      // const result = await joyID_signPsbt(hex);
      return hex;
    }

    throw new Error("Please connect btc wallet");
  }

  async getTx(
    address: string,
    after_txid?: string
  ): Promise<btc_TxInfo[] | undefined> {
    const cfg = isTestNet() ? testConfig : mainConfig;

    const result = await superagent
      .get(
        `https://mempool.space${
          cfg.isMainnet ? "" : "/testnet"
        }/api/address/${address}/txs${
          after_txid ? `?after_txid=${after_txid}` : ""
        }`
      )
      .catch((err) => {
        console.error(err);
      });

    if (result && result.status == 200) {
      return JSON.parse(result.text);
    }
  }

  async getBTC(address: string): Promise<btc_AddressInfo | undefined> {
    const cfg = isTestNet() ? testConfig : mainConfig;

    const result = await superagent
      .get(
        `https://mempool.space${
          cfg.isMainnet ? "" : "/testnet"
        }/api/address/${address}`
      )
      .catch((err) => {
        console.error(err);
      });

    if (result && result.status == 200) {
      return JSON.parse(result.text);
    }
  }

  // async getRGBAsset(address: string) {}

  async pushPsbt(psbtHex: string, walletType: WalletType) {
    if (walletType == "unisat") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const unisat = (window as any)["unisat"];
      if (typeof unisat !== "undefined") {
        console.log("UniSat Wallet is installed!");

        const curNetwork = await unisat.getNetwork();
        if (curNetwork != this._network) {
          await unisat.switchNetwork(this._network);
        }

        return unisat.pushPsbt(psbtHex);
      } else {
        throw new Error("UniSat Wallet is no installed!");
      }
    } else if (walletType == "okx") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const okxwallet = (window as any)["okxwallet"];
      if (typeof okxwallet !== "undefined") {
        console.log("OKX is installed!");

        console.log(okxwallet.bitcoinTestnet);

        // {address publicKey}
        const cfg = isTestNet() ? testConfig : mainConfig;
        if (cfg.isMainnet) {
          const result = await okxwallet.bitcoin.pushPsbt(psbtHex);
          return result;
        } else {
          throw new Error("OKX Wallet is no testnet push psbt");
        }
      } else {
        throw new Error("OKX Wallet is no installed!");
      }
    } else if (walletType == "joyid") {
      const result = await sendPsbt(psbtHex);
      return result;
    }

    throw new Error("Please connect btc wallet");
  }
}
