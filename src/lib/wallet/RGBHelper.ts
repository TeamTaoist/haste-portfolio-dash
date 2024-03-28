import { Script, helpers, utils } from "@ckb-lumos/lumos";
import { btc_utxo } from "../interface";
import { BtcHepler } from "./BtcHelper";
import {
  buildRgbppLockArgs,
  genCkbJumpBtcVirtualTx,
  Collector,
  genBtcJumpCkbVirtualTx,
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
import {
  BTC_ASSETS_API_URL,
  BTC_ASSETS_TOKEN,
  CKB_INDEX_URL,
  CKB_RPC_URL,
  getSporeDep,
  getSporeTypeScript,
  isMainnet,
} from "./constants";
import {
  DataSource,
  NetworkType,
  sendRgbppUtxos,
  transactionToHex,
} from "@rgbpp-sdk/btc";
import { BtcAssetsApi } from "@rgbpp-sdk/service";
import { bitcoin } from "@rgbpp-sdk/btc/lib/bitcoin";

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

  async transfer_btc_to_ckb(
    btcAddress: string,
    toCkbAddress: string,
    typeScript: Script,
    transferAmount: bigint
  ) {
    const utxo = await this.getBtcToCkbUtxo(btcAddress);
    if (!utxo) {
      throw new Error("Not find utxo");
    }

    console.log(utxo);

    const txHash = await this.btc_to_ckb_buildTx(
      [buildRgbppLockArgs(utxo.vout, utxo.txid)],
      toCkbAddress,
      transferAmount,
      typeScript,
      btcAddress
    );

    return txHash;
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

    console.log(utxo);

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
      witnessLockPlaceholderSize: 1000,
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

  async btc_to_ckb_buildTx(
    rgbppLockArgsList: string[],
    toCkbAddress: string,
    transferAmount: bigint,
    typeScript: Script,
    btcAddress: string
  ) {
    console.log("rgbppLockArgsList", rgbppLockArgsList);

    const collector = new Collector({
      ckbNodeUrl: CKB_RPC_URL,
      ckbIndexerUrl: CKB_INDEX_URL,
    });

    const networkType = NetworkType.TESTNET;
    const service = BtcAssetsApi.fromToken(
      BTC_ASSETS_API_URL,
      BTC_ASSETS_TOKEN,
      "http://localhost"
    );
    const source = new DataSource(service, networkType);

    const balance = await CkbHepler.instance.sudtBalance(
      "ckt1qzkakgw0gqw35cy7vqvclpgvgstl7qles33t5j3lzq06yaqlfqfzsqgpqqqqqlhqe8h4wsz5qx8hwn9h7qf4kgclkvexza4q6h2ht24t36xfpz9a9mlxqh",
      typeScript
    );
    console.log(balance.toString());

    const ckbVirtualTxResult = await genBtcJumpCkbVirtualTx({
      collector,
      rgbppLockArgsList,
      xudtTypeBytes: serializeScript(typeScript),
      transferAmount,
      toCkbAddress,
      isMainnet: isMainnet,
    });

    const { commitment, ckbRawTx } = ckbVirtualTxResult;

    // Send BTC tx
    let psbt = await sendRgbppUtxos({
      ckbVirtualTx: ckbRawTx,
      commitment,
      tos: [btcAddress!],
      ckbCollector: collector,
      from: btcAddress!,
      source,
    });
    // psbt.signAllInputs(keyPair);
    const psbtHex = await BtcHepler.instance.signPsdt(psbt.toHex());
    psbt = bitcoin.Psbt.fromHex(psbtHex);
    psbt.finalizeAllInputs();

    const btcTx = psbt.extractTransaction();
    // Remove the witness from BTC tx for RGBPP unlock
    const btcTxBytes = transactionToHex(btcTx, false);
    const { txid: btcTxId } = await BtcHepler.instance.pushTx(btcTx.toHex());

    console.log("BTC Tx bytes: ", btcTxBytes);
    console.log("BTC TxId: ", btcTxId);
    console.log("ckbRawTx", JSON.stringify(ckbRawTx));
    return btcTxId;

    // const newCkbRawTx = updateCkbTxWithRealBtcTxId({
    //   ckbRawTx,
    //   btcTxId,
    //   isMainnet: false,
    // });

    // const spvService = new SPVService(SPV_SERVICE_URL);
    // Use an exist BTC transaction id to get the tx proof and the contract will not verify the tx proof now
    // btcTxId =
    //   "018025fb6989eed484774170eefa2bef1074b0c24537f992a64dbc138277bc4a";

    // const ckbTx = await appendCkbTxWitnesses({
    //   ckbRawTx: newCkbRawTx,
    //   btcTxBytes,
    //   btcTxIndexInBlock: 0, // ignore spv proof now
    //   btcTxId,
    // });

    // console.log("BTC time lock args: ", newCkbRawTx.outputs[0].lock.args);

    // const txHash = await sendCkbTx({ collector, signedTx: ckbTx });
    // console.info(
    //   `gbpp asset has been jumped from BTC to CKB and tx hash is ${txHash}`
    // );

    // return txHash;
    // >>
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

  async getBtcToCkbUtxo(address: string) {
    const result: btc_utxo[] | undefined = await BtcHepler.instance.getUtxo(
      address
    );

    if (result && result.length > 0) {
      // TODO 这里需要找到已绑定的rgb
      return result[0];
    }
  }
}
