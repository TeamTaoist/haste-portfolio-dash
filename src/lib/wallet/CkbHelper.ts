import {
  BI,
  Indexer,
  RPC,
  Transaction,
  commons,
  config,
  helpers,
  utils,
} from "@ckb-lumos/lumos";
import { ckb_TransferOptions } from "../interface";
import { DataManager } from "../manager/DataManager";
import { CKBTransaction, connect, signRawTransaction } from "@joyid/ckb";
import { createJoyIDScriptInfo } from "./joyid";

export const CONFIG = config.predefined.AGGRON4;
config.initializeConfig(CONFIG);

const CKB_RPC_URL = "https://testnet.ckb.dev";
const CKB_INDEX_URL = "https://testnet.ckb.dev";

const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_INDEX_URL, CKB_RPC_URL);

export class CkbHepler {
  private static _instance: CkbHepler;
  private constructor() {}

  public static get instance() {
    if (!CkbHepler._instance) {
      CkbHepler._instance = new CkbHepler();
    }
    return this._instance;
  }

  async joyid_onConnect() {
    const connection = await connect();

    commons.common.registerCustomLockScriptInfos([
      createJoyIDScriptInfo({ connection }),
    ]);

    return connection.address;
  }

  // transfer ckb
  async transfer_ckb(options: ckb_TransferOptions) {
    const unsigned = await this.buildTransfer(options);
    const tx = helpers.createTransactionFromSkeleton(unsigned);

    if (DataManager.instance.curWalletType == "joyid") {
      const signed = await signRawTransaction(
        tx as CKBTransaction,
        options.from
      );

      console.log("sign raw tx", signed);

      console.log("amount", options.amount.toString());

      return this.sendTransaction(signed);
    }

    throw new Error("Please connect wallet");
  }

  // transfer sudt
  async transfer_sudt(options: ckb_TransferOptions) {
    const unsigned = await this.sudt_buildTransfer(options);
    const tx = helpers.createTransactionFromSkeleton(unsigned);

    if (DataManager.instance.curWalletType == "joyid") {
      const signed = await signRawTransaction(
        tx as CKBTransaction,
        options.from
      );

      console.log("sign raw tx", signed);

      console.log("amount", options.amount.toString());

      return this.sendTransaction(signed);
    }

    throw new Error("Please connect wallet");
  }

  // deploy new sudt token
  async deploy_sudt(issuer: string, amount: number) {
    const unsigned = await this.sudt_buildIssueNewToken(issuer, amount);
    const tx = helpers.createTransactionFromSkeleton(unsigned);

    if (DataManager.instance.curWalletType == "joyid") {
      const signed = await signRawTransaction(tx as CKBTransaction, issuer);

      console.log("[deploy_sudt]sign raw tx", signed);

      console.log("[deploy_sudt]amount", amount);

      return this.sendTransaction(signed);
    }

    throw new Error("Please connect wallet");
  }

  // TODO:transfer xudt
  async transfer_xudt() {}

  // TODO:transfer spore
  async transfer_spore() {}

  // build ckb transfer
  async buildTransfer(options: ckb_TransferOptions) {
    let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });

    const fromScript = helpers.parseAddress(options.from);
    const fromAddress = helpers.encodeToAddress(fromScript, { config: CONFIG });

    console.log(fromAddress);

    const toScript = helpers.parseAddress(options.to);
    const toAddress = helpers.encodeToAddress(toScript, { config: CONFIG });

    console.log(toAddress);

    txSkeleton = await commons.common.transfer(
      txSkeleton,
      [fromAddress],
      toAddress,
      options.amount,
      undefined,
      undefined,
      { config: CONFIG }
    );

    txSkeleton = await commons.common.payFee(
      txSkeleton,
      [fromAddress],
      1000,
      undefined,
      { config: CONFIG }
    );

    return txSkeleton;
  }

  // build sudt transfer
  async sudt_buildTransfer(options: ckb_TransferOptions) {
    let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });

    const sudtToken = utils.computeScriptHash(
      helpers.parseAddress(
        "ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqqyse9w5xpgupt7q6sru8dcq9q8k4lktsegcsxjqm"
      )
    );

    const fromScript = helpers.parseAddress(options.from);
    const fromAddress = helpers.encodeToAddress(fromScript, { config: CONFIG });

    console.log(fromAddress);

    const toScript = helpers.parseAddress(options.to);
    const toAddress = helpers.encodeToAddress(toScript, { config: CONFIG });

    console.log(toAddress);

    txSkeleton = await commons.sudt.transfer(
      txSkeleton,
      [fromAddress],
      sudtToken,
      toAddress,
      options.amount,
      undefined,
      undefined,
      undefined,
      { config: CONFIG }
    );

    txSkeleton = await commons.common.payFee(
      txSkeleton,
      [fromAddress],
      1000,
      undefined,
      { config: CONFIG }
    );

    return txSkeleton;
  }

  // send transaction
  async sendTransaction(tx: Transaction) {
    return rpc.sendTransaction(tx, "passthrough");
  }

  // capacityOf
  async capacityOf(address: string) {
    const collector = indexer.collector({
      lock: helpers.parseAddress(address),
    });
    let balance = BI.from(0);
    for await (const cell of collector.collect()) {
      balance = balance.add(cell.cellOutput.capacity);
    }
    return balance;
  }

  // issue a new token
  async sudt_buildIssueNewToken(issuer: string, amount: number) {
    let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });

    const issuerScript = helpers.parseAddress(issuer);
    const issuerAddress = helpers.encodeToAddress(issuerScript, {
      config: CONFIG,
    });

    txSkeleton = await commons.sudt.issueToken(
      txSkeleton,
      issuerAddress,
      amount,
      undefined,
      undefined,
      { config: CONFIG }
    );

    txSkeleton = await commons.common.payFee(
      txSkeleton,
      [issuerAddress],
      1000,
      undefined,
      { config: CONFIG }
    );

    return txSkeleton;
  }
}
