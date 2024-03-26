import { Script, helpers, utils } from "@ckb-lumos/lumos";
import { btc_utxo } from "../interface";
import { BtcHepler } from "./BtcHelper";
import {
  buildRgbppLockArgs,
  genCkbJumpBtcVirtualTx,
  Collector,
} from "@rgbpp-sdk/ckb";
import { serializeScript } from "@nervosnetwork/ckb-sdk-utils";
import {
  Aggregator,
  CKBTransaction,
  getJoyIDCellDep,
  getJoyIDLockScript,
  signRawTransaction,
} from "@joyid/ckb";
import { CkbHepler } from "./CkbHelper";
import { DataManager } from "../manager/DataManager";
import { bytes } from "@ckb-lumos/codec";
import { blockchain } from "@ckb-lumos/base";
import { getSporeDep, getSporeTypeScript } from "./constants";

const CKB_RPC_URL = "https://testnet.ckb.dev/rpc";
const CKB_INDEX_URL = "https://testnet.ckb.dev/indexer";

const isMainnet = false;

export class RGBHelper {
  private static _instance: RGBHelper;
  private constructor() {}

  public static get instance() {
    if (!RGBHelper._instance) {
      RGBHelper._instance = new RGBHelper();
    }
    return this._instance;
  }

  async btc_connect() {
    const { accounts, pubkey } = await BtcHepler.instance.unisat_onConnect();

    this.btcAddress = accounts[0];
    this.btcPubKey = pubkey;

    console.log("RGB btc connect", this.btcAddress, this.btcPubKey);
  }

  async ckb_connect() {}

  private _btcAddress: string = "";
  public get btcAddress(): string {
    return this._btcAddress;
  }
  public set btcAddress(v: string) {
    this._btcAddress = v;
  }

  private _btcPubKey: string | null = "";
  public get btcPubKey(): string | null {
    return this._btcPubKey;
  }
  public set btcPubKey(v: string | null) {
    this._btcPubKey = v;
  }

  async transfer_ckb_to_btc(
    btc_address: string,
    ckb_address: string,
    typeScript: Script,
    amount: bigint = 0n
  ) {
    const unsignedRawTx = await this.ckb_to_btc_buildTx(
      btc_address,
      ckb_address,
      typeScript,
      amount
    );

    if (DataManager.instance.curWalletType == "joyid") {
      const signed = await signRawTransaction(
        unsignedRawTx as CKBTransaction,
        ckb_address
      );

      return CkbHepler.instance.sendTransaction(signed);
    }

    throw new Error("Please connect wallet");
  }

  async ckb_to_btc_buildTx(
    btc_address: string,
    ckb_address: string,
    typeScript: Script,
    amount: bigint = 0n
  ) {
    const utxo = await this.getCanUseUtxo(btc_address);
    if (!utxo) {
      throw new Error("No can use utxo");
    }

    const collector = new Collector({
      ckbNodeUrl: CKB_RPC_URL,
      ckbIndexerUrl: CKB_INDEX_URL,
    });

    const toRgbppLockArgs = buildRgbppLockArgs(utxo.vout, utxo.txid);

    let assertCellDeps = helpers.locateCellDep(typeScript);
    if (assertCellDeps == null) {
      const sporeScript = getSporeTypeScript(isMainnet);
      if (sporeScript.codeHash == typeScript.codeHash) {
        assertCellDeps = getSporeDep(isMainnet);
      }
      if (assertCellDeps == null) {
        throw new Error("No sudt cell deps");
      }
    }

    const ckbRawTx = await genCkbJumpBtcVirtualTx({
      collector,
      fromCkbAddress: ckb_address,
      toRgbppLockArgs,
      xudtTypeBytes: serializeScript(typeScript),
      transferAmount: amount,
      witnessLockPlaceholderSize: 2000,
    });

    // joy id
    // <<
    const lock = helpers.parseAddress(ckb_address);
    const joyidScropt = getJoyIDLockScript(isMainnet);
    if (lock.codeHash == joyidScropt.codeHash) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let newWitnessArgs: any = {
        lock: "0x",
      };
      if (DataManager.instance.joyIdConnectionType == "sub_key") {
        const aggregator = new Aggregator(
          "https://cota.nervina.dev/aggregator"
        );
        const pubkeyHash = bytes
          .bytify(utils.ckbHash("0x" + DataManager.instance.curWalletPubKey))
          .slice(0, 20);

        console.log(DataManager.instance.curWalletPubKey);

        const { unlock_entry: unlockEntry } =
          await aggregator.generateSubkeyUnlockSmt({
            // TODO TBD
            alg_index: 1,
            pubkey_hash: bytes.hexify(pubkeyHash),
            lock_script: bytes.hexify(blockchain.Script.pack(lock)),
          });
        newWitnessArgs = {
          lock: "0x",
          inputType: "0x",
          outputType: "0x" + unlockEntry,
        };
      }

      const witness = bytes.hexify(blockchain.WitnessArgs.pack(newWitnessArgs));
      const unsignedTx = {
        ...ckbRawTx,
        cellDeps: [
          ...ckbRawTx.cellDeps,
          getJoyIDCellDep(isMainnet),
          assertCellDeps,
        ],
        witnesses: [witness, ...ckbRawTx.witnesses.slice(1)],
      };

      return unsignedTx;
    }
    // >>

    throw new Error("Now Just support joyid");
  }

  async getCanUseUtxo(address: string) {
    const result: btc_utxo[] | undefined = await BtcHepler.instance.getUtxo(
      address
    );

    if (result && result.length > 0) {
      // TODO 这里需要对已绑定的rgb做过滤
      return result[0];
    }
  }
}
