import { BI, Cell, CellDep, Script, helpers, utils } from "@ckb-lumos/lumos";
import { RgbAssert, WalletInfo, btc_utxo } from "../interface";
import { BtcHepler } from "./BtcHelper";
import {
  buildRgbppLockArgs,
  genCkbJumpBtcVirtualTx,
  Collector,
  genBtcJumpCkbVirtualTx,
  isBtcTimeCellsSpent,
  genRgbppLockScript,
  genBtcTransferCkbVirtualTx,
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
import { DataSource, sendBtc, sendRgbppUtxos } from "@rgbpp-sdk/btc";
import { BtcAssetsApi } from "@rgbpp-sdk/service";
import { AccountType, accountStore } from "@/store/AccountStore";
import {
  getCotaTypeScript,
  isTestNet,
  mainConfig,
  testConfig,
} from "./constants";

export class RGBHelper {
  private static _instance: RGBHelper;
  private constructor() {}

  public static get instance() {
    if (!RGBHelper._instance) {
      RGBHelper._instance = new RGBHelper();
    }
    return this._instance;
  }

  // transfer btc
  async transferBTC(toAddress: string, amount: BI) {
    const curAccount = DataManager.instance.getCurAccount();

    if (!curAccount) {
      throw new Error("Please choose a wallet");
    }

    const wallet = accountStore.getWallet(curAccount);
    if (!wallet) {
      throw new Error("Please choose a wallet");
    }

    const txHash = await this.buildSendBTC(
      wallet as WalletInfo,
      toAddress,
      amount
    );

    return txHash;
  }

  async buildSendBTC(wallet: WalletInfo, toAddress: string, amount: BI) {
    const cfg = isTestNet() ? testConfig : mainConfig;

    const networkType = cfg.rgb_networkType;
    const service = BtcAssetsApi.fromToken(
      cfg.BTC_ASSETS_API_URL,
      cfg.BTC_ASSETS_TOKEN,
      cfg.BTC_ASSETS_ORGIN
    );
    const source = new DataSource(service, networkType);

    const psbt = await sendBtc({
      tos: [
        {
          address: toAddress,
          value: amount.toNumber(),
        },
      ],
      source,
      from: wallet.address,
      fromPubkey: wallet.pubkey,
    });

    const psbtHex = await BtcHepler.instance.signPsdt(
      psbt.toHex(),
      wallet.type
    );
    const btcTxId = await BtcHepler.instance.pushPsbt(psbtHex, wallet.type);

    return btcTxId;
  }

  async transfer_btc_to_btc(
    btcTxHash: string,
    btcTxIdx: number,
    toAddress: string,
    typeScript: Script,
    amount: bigint = 0n
  ) {
    const curAccount = DataManager.instance.getCurAccount();
    if (!curAccount) {
      throw new Error("Please choose a wallet");
    }

    const wallet = accountStore.getWallet(curAccount);
    if (!wallet) {
      throw new Error("Please choose a wallet");
    }

    if (wallet.chain != "BTC") return;

    const txHash = await this.btc_to_btc_buildTx(
      [buildRgbppLockArgs(btcTxIdx, btcTxHash)],
      toAddress,
      wallet as WalletInfo,
      typeScript,
      amount
    );

    return txHash;
  }

  async transfer_ckb_to_btc(
    btcTxHash: string,
    btcTxIdx: number,
    typeScript: Script,
    amount: bigint = 0n
  ) {
    const curAccount = DataManager.instance.getCurAccount();
    if (!curAccount) {
      throw new Error("Please choose a wallet");
    }

    const wallet = accountStore.getWallet(curAccount);
    if (!wallet) {
      throw new Error("Please choose a wallet");
    }

    console.log("cur wallet", curAccount, wallet);

    const unsignedRawTx = await this.ckb_to_btc_buildTx(
      buildRgbppLockArgs(btcTxIdx, btcTxHash),
      wallet as AccountType,
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
    transferAmount: bigint,
    btcTxHash: string,
    btcTxIdx: number
  ) {
    const curAccount = DataManager.instance.getCurAccount();
    if (!curAccount) {
      throw new Error("Please choose a wallet");
    }

    const wallet = accountStore.getWallet(curAccount);
    if (!wallet) {
      throw new Error("Please choose a wallet");
    }

    if (wallet.chain != "BTC") return;

    const txHash = await this.btc_to_ckb_buildTx(
      [buildRgbppLockArgs(btcTxIdx, btcTxHash)],
      toCkbAddress,
      transferAmount,
      typeScript,
      wallet as WalletInfo
    );

    return txHash;
  }

  async btc_to_btc_buildTx(
    rgbppLockArgsList: string[],
    toAddress: string,
    btc_wallet: WalletInfo,
    typeScript: Script,
    transferAmount: bigint = 0n
  ) {
    const cfg = isTestNet() ? testConfig : mainConfig;

    const collector = new Collector({
      ckbNodeUrl: cfg.CKB_RPC_URL,
      ckbIndexerUrl: cfg.CKB_INDEX_URL,
    });

    const networkType = cfg.rgb_networkType;
    const service = BtcAssetsApi.fromToken(
      cfg.BTC_ASSETS_API_URL,
      cfg.BTC_ASSETS_TOKEN,
      cfg.BTC_ASSETS_ORGIN
    );
    const source = new DataSource(service, networkType);

    const ckbVirtualTxResult = await genBtcTransferCkbVirtualTx({
      collector,
      rgbppLockArgsList,
      xudtTypeBytes: serializeScript(typeScript),
      transferAmount,
      isMainnet: cfg.isMainnet,
    });

    const { commitment, ckbRawTx } = ckbVirtualTxResult;

    // Send BTC tx
    const psbt = await sendRgbppUtxos({
      ckbVirtualTx: ckbRawTx,
      commitment,
      tos: [toAddress],
      ckbCollector: collector,
      from: btc_wallet.address!,
      fromPubkey: btc_wallet.pubkey,
      source,
    });

    const psbtHex = await BtcHepler.instance.signPsdt(
      psbt.toHex(),
      btc_wallet.type
    );

    const btcTxId = await BtcHepler.instance.pushPsbt(psbtHex, btc_wallet.type);

    const rgbppState = await service.sendRgbppCkbTransaction({
      btc_txid: btcTxId,
      ckb_virtual_result: ckbVirtualTxResult,
    });
    console.log("rgbppState", rgbppState);

    await this.retryBtcTxId(btcTxId);

    return btcTxId;
  }

  async ckb_to_btc_buildTx(
    toRgbppLockArgs: string,
    ckb_wallet: AccountType,
    typeScript: Script,
    amount: bigint = 0n
  ) {
    if (ckb_wallet.chain == "BTC") return;

    const cfg = isTestNet() ? testConfig : mainConfig;

    const sudtBalance = await CkbHepler.instance.sudtBalance(
      ckb_wallet.address,
      typeScript
    );
    console.log(sudtBalance.toString());

    const collector = new Collector({
      ckbNodeUrl: cfg.CKB_RPC_URL,
      ckbIndexerUrl: cfg.CKB_INDEX_URL,
    });

    // let assertCellDeps = helpers.locateCellDep(typeScript);
    // if (assertCellDeps == null) {
    //   const sporeScript = getSporeTypeScript(isMainnet);
    //   if (sporeScript.codeHash == typeScript.codeHash) {
    //     assertCellDeps = getSporeDep(isMainnet);
    //   }
    //   if (assertCellDeps == null) {
    //     throw new Error("No cell deps");
    //   }
    // }

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
    const lock = helpers.parseAddress(ckb_wallet.address, {
      config: cfg.CONFIG,
    });
    const joyidScropt = getJoyIDLockScript(cfg.isMainnet);
    if (lock.codeHash == joyidScropt.codeHash) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let newWitnessArgs: any = {
        lock: "0x",
      };

      let cotaCellDep: CellDep | undefined = undefined;
      if (ckb_wallet.keyType == "sub_key") {
        const aggregator = new Aggregator(cfg.aggregatorUrl);
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

        const cotaType = getCotaTypeScript(isTestNet() ? false : true);
        const cotaCollector = CkbHepler.instance.indexer.collector({
          lock: lock,
          type: cotaType,
        });

        const cotaCells: Cell[] = [];
        if (cotaCollector) {
          for await (const cotaCell of cotaCollector.collect()) {
            cotaCells.push(cotaCell);
          }
        }

        if (!cotaCells || cotaCells.length === 0) {
          throw new Error("Cota cell doesn't exist");
        }
        const cotaCell = cotaCells[0];
        cotaCellDep = {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          outPoint: cotaCell.outPoint as any,
          depType: "code",
        };

        // note: COTA cell MUST put first
      }

      const witness = bytes.hexify(blockchain.WitnessArgs.pack(newWitnessArgs));
      const unsignedTx = {
        ...ckbRawTx,
        cellDeps: [
          ...ckbRawTx.cellDeps,
          getJoyIDCellDep(cfg.isMainnet),
          // assertCellDeps,
        ],
        witnesses: [witness, ...ckbRawTx.witnesses.slice(1)],
      };

      if (cotaCellDep != undefined) {
        unsignedTx.cellDeps.unshift(cotaCellDep);
      }

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
    const cfg = isTestNet() ? testConfig : mainConfig;

    console.log("rgbppLockArgsList", rgbppLockArgsList, toCkbAddress);

    const collector = new Collector({
      ckbNodeUrl: cfg.CKB_RPC_URL,
      ckbIndexerUrl: cfg.CKB_INDEX_URL,
    });

    const networkType = cfg.rgb_networkType;
    const service = BtcAssetsApi.fromToken(
      cfg.BTC_ASSETS_API_URL,
      cfg.BTC_ASSETS_TOKEN,
      cfg.BTC_ASSETS_ORGIN
    );
    const source = new DataSource(service, networkType);

    // let assertCellDeps = helpers.locateCellDep(typeScript);
    // if (assertCellDeps == null) {
    //   const sporeScript = getSporeTypeScript(isMainnet);
    //   if (sporeScript.codeHash == typeScript.codeHash) {
    //     assertCellDeps = getSporeDep(isMainnet);
    //   }
    //   if (assertCellDeps == null) {
    //     throw new Error("No cell deps");
    //   }
    // }

    const ckbVirtualTxResult = await genBtcJumpCkbVirtualTx({
      collector,
      rgbppLockArgsList,
      xudtTypeBytes: serializeScript(typeScript),
      transferAmount,
      toCkbAddress,
      isMainnet: cfg.isMainnet,
    });

    const { commitment, ckbRawTx } = ckbVirtualTxResult;

    // ckbRawTx.cellDeps.push(assertCellDeps);

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
    const psbtHex = await BtcHepler.instance.signPsdt(
      psbt.toHex(),
      btcWallet.type
    );
    const btcTxId = await BtcHepler.instance.pushPsbt(psbtHex, btcWallet.type);

    // console.log("BTC Tx bytes: ", psbtHex);
    // console.log("BTC TxId: ", btcTxId);
    // console.log("ckbRawTx", JSON.stringify(ckbRawTx));

    const rgbppState = await service.sendRgbppCkbTransaction({
      btc_txid: btcTxId,
      ckb_virtual_result: ckbVirtualTxResult,
    });

    console.log("rgbppState", rgbppState);

    await this.retryBtcTxId(btcTxId);

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
    const cfg = isTestNet() ? testConfig : mainConfig;

    const result: btc_utxo[] | undefined = await BtcHepler.instance.getUtxo(
      address
    );

    const rgbAssertList: RgbAssert[] = [];

    if (result) {
      const rgbppLockArgsList: {
        args: string;
        txHash: string;
        idx: number;
        value: number;
      }[] = [];
      for (let i = 0; i < result.length; i++) {
        const element = result[i];
        const rgbArgs = buildRgbppLockArgs(element.vout, element.txid);
        rgbppLockArgsList.push({
          args: rgbArgs,
          txHash: element.txid,
          idx: element.vout,
          value: element.value,
        });
      }
      const rgbppLocks = rgbppLockArgsList.map((item) => {
        const lock = genRgbppLockScript(item.args, cfg.isMainnet);

        return {
          lock,
          txHash: item.txHash,
          idx: item.idx,
          value: item.value,
        };
      });
      // const xudtTypeScript = getXudtTypeScript(isMainnet);
      for await (const rgbppLock of rgbppLocks) {
        const address = helpers.encodeToAddress(rgbppLock.lock, {
          config: cfg.CONFIG,
        });
        const { xudtList, sporeList } =
          await CkbHepler.instance.getXudtAndSpore(address);

        if (xudtList.length > 0) {
          for (let i = 0; i < xudtList.length; i++) {
            const xudt = xudtList[i];
            rgbAssertList.push({
              txHash: rgbppLock.txHash,
              idx: rgbppLock.idx,
              ckbCellInfo: xudt,
              value: rgbppLock.value,
            });
          }
        } else if (sporeList.length > 0) {
          for (let i = 0; i < sporeList.length; i++) {
            const spore = sporeList[i];
            rgbAssertList.push({
              txHash: rgbppLock.txHash,
              idx: rgbppLock.idx,
              ckbCellInfo: spore,
              value: rgbppLock.value,
            });
          }
        } else {
          rgbAssertList.push({
            txHash: rgbppLock.txHash,
            idx: rgbppLock.idx,
            value: rgbppLock.value,
          });
        }
      }
    }

    console.log(rgbAssertList);

    return rgbAssertList;
  }

  async getIsBtcTimeCellSpent(ckbAddress: string, btcTxId: string) {
    const cfg = isTestNet() ? testConfig : mainConfig;

    const collector = new Collector({
      ckbNodeUrl: cfg.CKB_RPC_URL,
      ckbIndexerUrl: cfg.CKB_INDEX_URL,
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

  async retryBtcTxId(txId: string) {
    const cfg = isTestNet() ? testConfig : mainConfig;

    const service = BtcAssetsApi.fromToken(
      cfg.BTC_ASSETS_API_URL,
      cfg.BTC_ASSETS_TOKEN,
      cfg.BTC_ASSETS_ORGIN
    );

    const rs = await service.retryRgbppCkbTransaction({
      btc_txid: txId,
    });

    console.log("retry rs", rs);
    return rs;
  }

  async getRgbAssertByService(txId: string, address: string) {
    const cfg = isTestNet() ? testConfig : mainConfig;

    const service = BtcAssetsApi.fromToken(
      cfg.BTC_ASSETS_API_URL,
      cfg.BTC_ASSETS_TOKEN,
      cfg.BTC_ASSETS_ORGIN
    );

    const assertList = await service.getRgbppAssetsByBtcTxId(txId);

    const addr_assertList = await service.getRgbppAssetsByBtcAddress(address);

    console.log("tx", assertList);
    console.log("addr", addr_assertList);

    const jobStat = await service.getRgbppTransactionState(txId);
    console.log("jobStat", jobStat);
  }
}
