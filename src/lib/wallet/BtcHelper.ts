import { DataManager } from "../manager/DataManager";
import superagent from "superagent";

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

  // TODO:transfer btc
  async transfer(toAddress: string, satoshis: number, feeRate?: number) {
    switch (DataManager.instance.curWalletType) {
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
      .get(`https://mempool.space/testnet/api/address/${address}/utxo`)
      .catch((err) => {
        console.error(err.message);
      });

    if (result && result.status == 200) {
      return JSON.parse(result.text);
    }
  }
}
