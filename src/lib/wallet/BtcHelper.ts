import { DataManager } from "../manager/DataManager";
import superagent from "superagent";
import { isMainnet } from "./constants";
import { WalletType, btc_AddressInfo, btc_TxInfo } from "../interface";
import { initConfig } from "@joyid/bitcoin";
import {
  requestAccounts,
  getPublicKey,
  signPsbt as joyID_signPsbt,
} from "@joyid/bitcoin";
import { accountStore } from "@/store/AccountStore";

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
      if (isMainnet) {
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
    initConfig({
      // your app name
      name: "JoyID demo",
      // your app logo
      logo: "https://fav.farm/🆔",
      // JoyID app URL, this is for testnet, for mainnet, use "https://app.joy.id"
      joyidAppURL: "https://testnet.joyid.dev",
    });

    const [address] = await requestAccounts();
    const publicKey = getPublicKey();
    console.log(address, publicKey);

    return { address, publicKey };
  }

  // TODO:transfer btc
  async transfer(toAddress: string, satoshis: number, feeRate?: number) {
    const curAccount = DataManager.instance.getCurAccount();

    if (!curAccount) {
      throw new Error("Please choose a wallet");
    }

    const wallet = accountStore.getWallet(curAccount);
    if (!wallet) {
      throw new Error("Please choose a wallet");
    }

    switch (wallet.type) {
      case "unisat":
        // eslint-disable-next-line no-case-declarations, @typescript-eslint/no-explicit-any
        const unisat = (window as any)["unisat"];
        if (typeof unisat !== "undefined") {
          console.log("UniSat Wallet is installed!");

          const curNetwork = await unisat.getNetwork();
          if (curNetwork == this._network) {
            return unisat.sendBitcoin(toAddress, satoshis, { feeRate });
          } else {
            await unisat.switchNetwork(this._network);
          }
        }
        break;
      case "okx":
        break;
      default:
        break;
    }
  }

  async getUtxo(address: string) {
    const result = await superagent
      .get(
        `https://mempool.space${
          isMainnet ? "" : "/testnet"
        }/api/address/${address}/utxo`
      )
      .catch((err) => {
        console.error(err.message);
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
        if (isMainnet) {
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
      const result = await joyID_signPsbt(hex);
      return result;
    }

    throw new Error("Please connect btc wallet");
  }

  async pushTx(rawtx: string, walletType: WalletType) {
    if (walletType == "unisat") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const unisat = (window as any)["unisat"];
      if (typeof unisat !== "undefined") {
        console.log("UniSat Wallet is installed!");

        const curNetwork = await unisat.getNetwork();
        if (curNetwork != this._network) {
          await unisat.switchNetwork(this._network);
        }

        return unisat.pushTx({
          rawtx: rawtx,
        });
      } else {
        throw new Error("UniSat Wallet is no installed!");
      }
    } else if (walletType == "okx") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const okxwallet = (window as any)["okxwallet"];
      if (typeof okxwallet !== "undefined") {
        console.log("OKX is installed!");

        // {address publicKey}
        if (isMainnet) {
          const result = await okxwallet.bitcoin.pushTx(rawtx);
          return result;
        } else {
          const result = await okxwallet.bitcoinTestnet.pushTx(rawtx);
          return result;
        }
      } else {
        throw new Error("OKX Wallet is no installed!");
      }
    } else if (walletType == "joyid") {
      console.log("TODO: joyid pushTx");
    }

    throw new Error("Please connect btc wallet");
  }

  async getTx(
    address: string,
    after_txid?: string
  ): Promise<btc_TxInfo[] | undefined> {
    const result = await superagent
      .get(
        `https://mempool.space${
          isMainnet ? "" : "/testnet"
        }/api/address/${address}/txs${
          after_txid ? `?after_txid=${after_txid}` : ""
        }`
      )
      .catch((err) => {
        console.error(err.message);
      });

    if (result && result.status == 200) {
      return JSON.parse(result.text);
    }
  }

  async getBTC(address: string): Promise<btc_AddressInfo | undefined> {
    const result = await superagent
      .get(
        `https://mempool.space${
          isMainnet ? "" : "/testnet"
        }/api/address/${address}`
      )
      .catch((err) => {
        console.error(err.message);
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

        // {address publicKey}
        if (isMainnet) {
          const result = await okxwallet.bitcoin.pushPsbt(psbtHex);
          return result;
        } else {
          const result = await okxwallet.bitcoinTestnet.pushPsbt(psbtHex);
          return result;
        }
      } else {
        throw new Error("OKX Wallet is no installed!");
      }
    } else if (walletType == "joyid") {
      console.log("TODO: joyid push psbt");
    }

    throw new Error("Please connect btc wallet");
  }
}
