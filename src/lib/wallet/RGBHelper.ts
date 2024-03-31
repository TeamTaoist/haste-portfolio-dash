import { Script, helpers, utils } from "@ckb-lumos/lumos";
import { RgbAssert, WalletInfo, btc_utxo } from "../interface";
import { BtcHepler } from "./BtcHelper";
import {
  buildRgbppLockArgs,
  genCkbJumpBtcVirtualTx,
  Collector,
  genBtcJumpCkbVirtualTx,
  isBtcTimeCellsSpent,
  genRgbppLockScript,
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
import { DataSource, NetworkType, sendRgbppUtxos } from "@rgbpp-sdk/btc";
import { BtcAssetsApi } from "@rgbpp-sdk/service";

export class RGBHelper {
  private static _instance: RGBHelper;
  private constructor() {}

  public static get instance() {
    if (!RGBHelper._instance) {
      RGBHelper._instance = new RGBHelper();
    }
    return this._instance;
  }

  async transfer_ckb_to_btc(
    btc_address: string,
    typeScript: Script,
    amount: bigint = 0n
  ) {
    const curAccount = DataManager.instance.getCurAccount();
    const wallet = DataManager.instance.walletInfo[curAccount.addr];

    const unsignedRawTx = await this.ckb_to_btc_buildTx(
      btc_address,
      wallet,
      typeScript,
      amount
    );

    if (wallet.type == "joyid") {
      const signed = await signRawTransaction(
        unsignedRawTx as CKBTransaction,
        wallet.address
      );

      return CkbHepler.instance.sendTransaction(signed);
    }

    throw new Error("Please connect wallet");
  }

  async transfer_btc_to_ckb(
    toCkbAddress: string,
    typeScript: Script,
    transferAmount: bigint
  ) {
    const curAccount = DataManager.instance.getCurAccount();
    const wallet = DataManager.instance.walletInfo[curAccount.addr];

    if (wallet.chain != "BTC") return;

    const txHash = await this.btc_to_ckb_buildTx(
      [
        buildRgbppLockArgs(
          1,
          "e68477d85e80bbdd66985d3f774f6674eb8b9d40df4a04eb07ba5dd3ab644636"
        ),
      ],
      toCkbAddress,
      transferAmount,
      typeScript,
      wallet
    );

    return txHash;
  }

  async ckb_to_btc_buildTx(
    btc_address: string,
    ckb_wallet: WalletInfo,
    typeScript: Script,
    amount: bigint = 0n
  ) {
    if (ckb_wallet.chain == "BTC") return;

    await this.getCanUseUtxo(btc_address);
    // if (!utxo) {
    //   throw new Error("No can use utxo");
    // }

    // console.log(utxo);

    const sudtBalance = await CkbHepler.instance.sudtBalance(
      ckb_wallet.address,
      typeScript
    );
    console.log(sudtBalance.toString());

    const collector = new Collector({
      ckbNodeUrl: CKB_RPC_URL,
      ckbIndexerUrl: CKB_INDEX_URL,
    });

    const toRgbppLockArgs = buildRgbppLockArgs(
      1,
      "e68477d85e80bbdd66985d3f774f6674eb8b9d40df4a04eb07ba5dd3ab644636"
    );

    console.log(toRgbppLockArgs);

    let assertCellDeps = helpers.locateCellDep(typeScript);
    if (assertCellDeps == null) {
      const sporeScript = getSporeTypeScript(isMainnet);
      if (sporeScript.codeHash == typeScript.codeHash) {
        assertCellDeps = getSporeDep(isMainnet);
      }
      if (assertCellDeps == null) {
        throw new Error("No cell deps");
      }
    }

    const ckbRawTx = await genCkbJumpBtcVirtualTx({
      collector,
      fromCkbAddress: ckb_wallet.address,
      toRgbppLockArgs,
      xudtTypeBytes: serializeScript(typeScript),
      transferAmount: amount,
      witnessLockPlaceholderSize: 1000,
    });

    // joy id
    // <<
    const lock = helpers.parseAddress(ckb_wallet.address);
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
          .bytify(utils.ckbHash("0x" + ckb_wallet.pubkey))
          .slice(0, 20);

        console.log(ckb_wallet.pubkey);

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
    btcWallet: WalletInfo
  ) {
    console.log("rgbppLockArgsList", rgbppLockArgsList, toCkbAddress);

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

    let assertCellDeps = helpers.locateCellDep(typeScript);
    if (assertCellDeps == null) {
      const sporeScript = getSporeTypeScript(isMainnet);
      if (sporeScript.codeHash == typeScript.codeHash) {
        assertCellDeps = getSporeDep(isMainnet);
      }
      if (assertCellDeps == null) {
        throw new Error("No cell deps");
      }
    }

    const ckbVirtualTxResult = await genBtcJumpCkbVirtualTx({
      collector,
      rgbppLockArgsList,
      xudtTypeBytes: serializeScript(typeScript),
      transferAmount,
      toCkbAddress,
      isMainnet: isMainnet,
    });

    const { commitment, ckbRawTx } = ckbVirtualTxResult;

    ckbRawTx.cellDeps.push(assertCellDeps);

    // Send BTC tx
    const psbt = await sendRgbppUtxos({
      ckbVirtualTx: ckbRawTx,
      commitment,
      tos: [btcWallet.address!],
      ckbCollector: collector,
      from: btcWallet.address!,
      fromPubkey: btcWallet.pubkey,
      source,
    });
    // psbt.signAllInputs(keyPair);
    const psbtHex = await BtcHepler.instance.signPsdt(psbt.toHex(), "unisat");
    const btcTxId = await BtcHepler.instance.pushPsbt(psbtHex, "unisat");

    console.log("BTC Tx bytes: ", psbtHex);
    console.log("BTC TxId: ", btcTxId);
    console.log("ckbRawTx", JSON.stringify(ckbRawTx));

    const rgbppState = await service.sendRgbppCkbTransaction({
      btc_txid: btcTxId,
      ckb_virtual_result: ckbVirtualTxResult,
    });

    console.log("rgbppState", rgbppState);

    return btcTxId;
  }

  async getCanUseUtxo(address: string) {
    const result: btc_utxo[] | undefined = await BtcHepler.instance.getUtxo(
      address
    );

    if (result && result.length > 0) {
      for (let i = 0; i < result.length; i++) {
        const item = result[i];
        console.log(item);
      }
    }

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
      for (let i = 0; i < result.length; i++) {
        const item = result[i];
        console.log(item);
      }
    }

    if (result && result.length > 0) {
      // TODO 这里需要找到已绑定的rgb
      return result[0];
    }
  }

  async getRgbppAssert(address: string) {
    const result: btc_utxo[] | undefined = await BtcHepler.instance.getUtxo(
      address
    );

    const rgbAssertList: RgbAssert[] = [];

    if (result) {
      const rgbppLockArgsList: { args: string; txHash: string; idx: number }[] =
        [];
      for (let i = 0; i < result.length; i++) {
        const element = result[i];
        const rgbArgs = buildRgbppLockArgs(element.vout, element.txid);
        rgbppLockArgsList.push({
          args: rgbArgs,
          txHash: element.txid,
          idx: element.vout,
        });
      }
      const rgbppLocks = rgbppLockArgsList.map((item) => {
        const lock = genRgbppLockScript(item.args, isMainnet);

        return {
          lock,
          txHash: item.txHash,
          idx: item.idx,
        };
      });
      // const xudtTypeScript = getXudtTypeScript(isMainnet);
      for await (const rgbppLock of rgbppLocks) {
        const address = helpers.encodeToAddress(rgbppLock.lock);
        const addressInfo = await CkbHepler.instance.getAddressInfo(address);
        if (addressInfo) {
          if (addressInfo.data.attributes.udt_accounts) {
            for (
              let i = 0;
              i < addressInfo.data.attributes.udt_accounts.length;
              i++
            ) {
              const udt = addressInfo.data.attributes.udt_accounts[i];
              rgbAssertList.push({
                txHash: rgbppLock.txHash,
                idx: rgbppLock.idx,
                ckbCellInfo: udt,
              });
            }
          }
        }
      }
    }

    console.log(rgbAssertList);

    return rgbAssertList;
  }

  async getIsBtcTimeCellSpent(ckbAddress: string, btcTxId: string) {
    const collector = new Collector({
      ckbNodeUrl: CKB_RPC_URL,
      ckbIndexerUrl: CKB_INDEX_URL,
    });

    const stat = await isBtcTimeCellsSpent({
      collector,
      ckbAddress,
      btcTxId,
    });

    console.log(
      "isBtcTimeCellsSpent",
      "ckbAddress:",
      ckbAddress,
      "btcTxId:",
      btcTxId,
      "stat:",
      stat
    );
  }
}
