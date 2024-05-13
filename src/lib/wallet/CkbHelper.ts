import {
  BI,
  Indexer,
  RPC,
  Script,
  Transaction,
  commons,
  config,
  helpers,
  utils,
} from "@ckb-lumos/lumos";
import {
  CellOutPutData, ckb_SporeInfo,
  ckb_TransferOptions,
  ckb_TxInfo_new,
  ckb_UDTInfo,
} from "../interface";
import { DataManager } from "../manager/DataManager";
import {
  CKBTransaction,
  connect,
  initConfig,
  signRawTransaction,
} from "@joyid/ckb";
import { createJoyIDScriptInfo } from "./joyid";
import {
  backend,
  getSporeTypeScript,
  getXudtTypeScript,
  mainConfig,
  testConfig,
} from "./constants";
import { number, bytes } from "@ckb-lumos/codec";

import superagent from "superagent";
// import { accountStore } from "@/store/AccountStore";
import {

  genBtcTimeLockArgs,
  getBtcTimeLockScript,
} from "@rgbpp-sdk/ckb";
import {getEnv} from "../../settings/env";
import store from "../../store/store";

export class CkbHepler {
  private static _instance: CkbHepler;
  private constructor() {}

  private static _rpc: RPC;
  private static _indexer: Indexer;

  public get rpc() {
    return CkbHepler._rpc;
  }

  public get indexer() {
    return CkbHepler._indexer;
  }

  public static get instance() {
    if (!CkbHepler._instance) {
      const cfg = getEnv() ? testConfig : mainConfig;

      initConfig({
        // your app name
        name: "JoyID demo",
        // your app logo
        logo: "https://fav.farm/🆔",
        // JoyID app URL, this is for testnet, for mainnet, use "https://app.joy.id"
        joyidAppURL: cfg.joyIdUrl,
      });

      CkbHepler._instance = new CkbHepler();

      commons.common.registerCustomLockScriptInfos([createJoyIDScriptInfo()]);

      config.initializeConfig(cfg.CONFIG);

      CkbHepler._rpc = new RPC(cfg.CKB_RPC_URL);
      CkbHepler._indexer = new Indexer(cfg.CKB_INDEX_URL, cfg.CKB_RPC_URL);
    }
    return this._instance;
  }

  async joyid_onConnect() {
    const connection = await connect();

    console.log("JoyId connect", connection);

    DataManager.instance.joyIdConnectionType = connection.keyType;
    return {
      account: connection.address,
      pubkey: connection.pubkey,
      keyType: connection.keyType,
    };
  }

  // transfer ckb
  async transfer_ckb(options: ckb_TransferOptions) {
    // const curAccount = DataManager.instance.getCurAccount();
    const curAccount = store.getState().wallet.currentWalletAddress;
    if (!curAccount) {
      throw new Error("Please choose a wallet");
    }

    // const wallet = accountStore.getWallet(curAccount);
    const wallets = store.getState().wallet.wallets;
    const wallet = wallets.find((wallet) => wallet.address === curAccount);

    if (!wallet) {
      throw new Error("Please choose a wallet");
    }

    const unsigned = await this.buildTransfer(options);
    const tx = helpers.createTransactionFromSkeleton(unsigned);

    if (wallet.walletName.indexOf("joyid") > -1 ) {
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

  // transfer udt
  // async transfer_udt(options: ckb_TransferOptions) {
  //   // const curAccount = DataManager.instance.getCurAccount();
  //   const wallet = accountStore.getWallet(options.from);
  //   if (!wallet) {
  //     throw new Error("Please choose a wallet");
  //   }
  //
  //   const unsigned = await this.buildTransfer(options);
  //   const tx = helpers.createTransactionFromSkeleton(unsigned);
  //
  //   if (wallet.type == "joyid") {
  //     const signed = await signRawTransaction(
  //       tx as CKBTransaction,
  //       options.from
  //     );
  //
  //     console.log("sign raw tx", signed);
  //
  //     console.log("amount", options.amount.toString());
  //
  //     return this.sendTransaction(signed);
  //   }
  //
  //   throw new Error("Please connect wallet");
  // }

  // deploy new sudt token
  // async deploy_sudt(issuer: string, amount: number) {
  //   const curAccount = DataManager.instance.getCurAccount();
  //   if (!curAccount) {
  //     throw new Error("Please choose a wallet");
  //   }
  //
  //   const wallet = accountStore.getWallet(curAccount);
  //   if (!wallet) {
  //     throw new Error("Please choose a wallet");
  //   }
  //
  //   const unsigned = await this.sudt_buildIssueNewToken(issuer, amount);
  //   const tx = helpers.createTransactionFromSkeleton(unsigned);
  //
  //   if (wallet.address == "joyid") {
  //     const signed = await signRawTransaction(tx as CKBTransaction, issuer);
  //
  //     console.log("[deploy_sudt]sign raw tx", signed);
  //
  //     console.log("[deploy_sudt]amount", amount);
  //
  //     return this.sendTransaction(signed);
  //   }
  //
  //   throw new Error("Please connect wallet");
  // }

  // transfer spore
  // async transfer_spore(options: ckb_TransferOptions) {
  //   const unsigned = await this.buildTransfer(options);
  //   const tx = helpers.createTransactionFromSkeleton(unsigned);
  //
  //   // const curAccount = DataManager.instance.getCurAccount();
  //   const wallet = accountStore.getWallet(options.from);
  //   if (!wallet) {
  //     throw new Error("Please choose a wallet");
  //   }
  //
  //   if (wallet.type == "joyid") {
  //     const signed = await signRawTransaction(
  //       tx as CKBTransaction,
  //       options.from
  //     );
  //
  //     console.log("sign raw tx", signed);
  //
  //     console.log("spore type script", options.typeScript);
  //
  //     return this.sendTransaction(signed);
  //   }
  //
  //   throw new Error("Please connect wallet");
  // }

  // build ckb transfer
  async buildTransfer(options: ckb_TransferOptions) {
    const cfg =  getEnv() === 'Testnet' ? testConfig : mainConfig;

    // const sudtScript = getSudtTypeScript(cfg.isMainnet);
    // const xudtScript = getXudtTypeScript(cfg.isMainnet);
    // const sporeScript = getSporeTypeScript(cfg.isMainnet);

    // if (
    //   options.typeScript &&
    //   (options.typeScript.codeHash == sudtScript.codeHash ||
    //     options.typeScript.codeHash == xudtScript.codeHash)
    // ) {
    //   // sudt
    //   const txSkeleton = await this.sudt_xudt_buildTransfer(options);
    //
    //   return txSkeleton;
    // } else if (
    //   options.typeScript &&
    //   options.typeScript.codeHash == sporeScript.codeHash
    // ) {
    //   // spore
    //   const txSkeleton = await this.spore_buildTransfer(options);
    //   return txSkeleton;
    // } else
    {
      // ckb
      let txSkeleton = helpers.TransactionSkeleton({
        cellProvider: CkbHepler.instance.indexer,
      });

      const fromScript = helpers.parseAddress(options.from, {
        config: cfg.CONFIG,
      });
      const fromAddress = helpers.encodeToAddress(fromScript, {
        config: cfg.CONFIG,
      });

      console.log(fromAddress);

      const toScript = helpers.parseAddress(options.to, {
        config: cfg.CONFIG,
      });
      const toAddress = helpers.encodeToAddress(toScript, {
        config: cfg.CONFIG,
      });

      console.log(toAddress);
      txSkeleton = await commons.common.transfer(
        txSkeleton,
        [fromAddress],
        toAddress,
        //@ts-ignore
        options.amount,
        undefined,
        undefined,
        { config: cfg.CONFIG }
      );

      txSkeleton = await commons.common.payFee(
        txSkeleton,
        [fromAddress],
        1000,
        undefined,
        { config: cfg.CONFIG }
      );
      return txSkeleton;
    }
  }

  // build spore transfer
  // async spore_buildTransfer(options: ckb_TransferOptions) {
  //   const cfg = isTestNet() ? testConfig : mainConfig;
  //
  //   let txSkeleton = helpers.TransactionSkeleton({
  //     cellProvider: CkbHepler.instance.indexer,
  //   });
  //
  //   const sporeTS = options.typeScript;
  //   if (!sporeTS) {
  //     throw new Error("No spore type script");
  //   }
  //
  //   const spore_cellDeps = getSporeDep(cfg.isMainnet);
  //   if (spore_cellDeps == null) {
  //     throw new Error("No spore cell deps");
  //   }
  //
  //   txSkeleton = addCellDep(txSkeleton, spore_cellDeps);
  //
  //   const fromScript = helpers.parseAddress(options.from, {
  //     config: cfg.CONFIG,
  //   });
  //   const fromAddress = helpers.encodeToAddress(fromScript, {
  //     config: cfg.CONFIG,
  //   });
  //
  //   console.log(fromAddress);
  //
  //   const toScript = helpers.parseAddress(options.to, {
  //     config: cfg.CONFIG,
  //   });
  //   const toAddress = helpers.encodeToAddress(toScript, { config: cfg.CONFIG });
  //
  //   console.log(toAddress);
  //
  //   // find spore cells
  //   // <<
  //   const spore_collect = CkbHepler.instance.indexer.collector({
  //     lock: fromScript,
  //     type: sporeTS,
  //   });
  //   const inputs_spore: Cell[] = [];
  //   let spore_sumCapacity = BI.from(0);
  //   for await (const cell of spore_collect.collect()) {
  //     inputs_spore.push(cell);
  //     spore_sumCapacity = spore_sumCapacity.add(cell.cellOutput.capacity);
  //   }
  //   if (inputs_spore.length <= 0) {
  //     throw new Error("Not find spore");
  //   }
  //   // >>
  //
  //   let output_sumCapacity = BI.from(0);
  //   const spore_inputCellOutput: {
  //     capacity: string;
  //     lock: Script;
  //     type?: Script;
  //   }[] = [];
  //   for (let i = 0; i < inputs_spore.length; i++) {
  //     const input = inputs_spore[i];
  //     const inputCellOutput = input.cellOutput;
  //     input.cellOutput = {
  //       capacity: inputCellOutput.capacity,
  //       lock: toScript,
  //       type: inputCellOutput.type,
  //     };
  //     spore_inputCellOutput.push(inputCellOutput);
  //     txSkeleton = await commons.common.setupInputCell(
  //       txSkeleton,
  //       input,
  //       undefined,
  //       { config: cfg.CONFIG }
  //     );
  //     output_sumCapacity = output_sumCapacity.add(input.cellOutput.capacity);
  //   }
  //   const sporeCoBuild = generateSporeCoBuild(
  //     inputs_spore,
  //     spore_inputCellOutput
  //   );
  //
  //   const minEmptyCapacity = calculateEmptyCellMinCapacity(fromScript);
  //   const needCapacity = output_sumCapacity
  //     .sub(spore_sumCapacity)
  //     .add(minEmptyCapacity)
  //     .add(2000); // fee
  //
  //   // find ckb
  //   // <<
  //   const collect_ckb = CkbHepler.instance.indexer.collector({
  //     lock: {
  //       script: fromScript,
  //       searchMode: "exact",
  //     },
  //     type: "empty",
  //   });
  //   const inputs_ckb: Cell[] = [];
  //   let ckb_sum = BI.from(0);
  //   for await (const collect of collect_ckb.collect()) {
  //     inputs_ckb.push(collect);
  //     ckb_sum = ckb_sum.add(collect.cellOutput.capacity);
  //     if (ckb_sum.gte(needCapacity)) {
  //       break;
  //     }
  //   }
  //   // >>
  //   if (ckb_sum.lt(needCapacity)) {
  //     throw new Error("No enough capacity");
  //   }
  //   for (let i = 0; i < inputs_ckb.length; i++) {
  //     const element = inputs_ckb[i];
  //     element.cellOutput.capacity = "0x0";
  //     txSkeleton = await commons.common.setupInputCell(txSkeleton, element);
  //   }
  //   const ckb_change = ckb_sum.sub(needCapacity);
  //   if (ckb_change.gt(0)) {
  //     const output_ckb_change: Cell = {
  //       cellOutput: {
  //         lock: fromScript,
  //         capacity: ckb_change.toHexString(),
  //       },
  //       data: "0x",
  //     };
  //     txSkeleton = txSkeleton.update("outputs", (outputs) =>
  //       outputs.push(output_ckb_change)
  //     );
  //   }
  //
  //   txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
  //     witnesses.push(sporeCoBuild)
  //   );
  //   return txSkeleton;
  // }

  // build sudt and xudt transfer
  // async sudt_xudt_buildTransfer(options: ckb_TransferOptions) {
  //   const cfg = isTestNet() ? testConfig : mainConfig;
  //
  //   let txSkeleton = helpers.TransactionSkeleton({
  //     cellProvider: CkbHepler.instance.indexer,
  //   });
  //
  //   const sudtToken = options.typeScript;
  //   if (!sudtToken) {
  //     throw new Error("No sudt or xudt type script");
  //   }
  //
  //   let isXUDT = false;
  //   const xudtScript = getXudtTypeScript(cfg.isMainnet);
  //   if (sudtToken.codeHash == xudtScript.codeHash) {
  //     isXUDT = true;
  //   }
  //   console.log("script is xudt", isXUDT);
  //
  //   const fromScript = helpers.parseAddress(options.from, {
  //     config: cfg.CONFIG,
  //   });
  //   const fromAddress = helpers.encodeToAddress(fromScript, {
  //     config: cfg.CONFIG,
  //   });
  //
  //   console.log(fromAddress);
  //
  //   const toScript = helpers.parseAddress(options.to, {
  //     config: cfg.CONFIG,
  //   });
  //   const toAddress = helpers.encodeToAddress(toScript, { config: cfg.CONFIG });
  //
  //   console.log(toAddress);
  //
  //   // const sudt_from = await this.sudtBalance(fromAddress, sudtToken);
  //   // const sudt_to = await this.sudtBalance(toAddress, sudtToken);
  //
  //   // const ckb_from = await this.capacityOf(fromAddress);
  //
  //   // console.log(sudt_from.toString(), sudt_to.toString(), ckb_from.toString());
  //
  //   let sudt_cellDeps = helpers.locateCellDep(sudtToken);
  //   if (sudt_cellDeps == null) {
  //     if (isXUDT) {
  //       sudt_cellDeps = getXudtDep(cfg.isMainnet);
  //     } else {
  //       throw new Error("No sudt cell deps");
  //     }
  //   }
  //
  //   txSkeleton = addCellDep(txSkeleton, sudt_cellDeps);
  //
  //   // find sudt
  //   // <<
  //   const collect_sudt = CkbHepler.instance.indexer.collector({
  //     lock: {
  //       script: fromScript,
  //       searchMode: "exact",
  //     },
  //     type: {
  //       script: sudtToken,
  //       searchMode: "exact",
  //     },
  //   });
  //   const inputs_sudt: Cell[] = [];
  //   let sudt_sumCapacity = BI.from(0);
  //   let sudt_sumAmount = BI.from(0);
  //
  //   for await (const collect of collect_sudt.collect()) {
  //     inputs_sudt.push(collect);
  //
  //     sudt_sumCapacity = sudt_sumCapacity.add(collect.cellOutput.capacity);
  //     let addNum: BI | undefined = undefined;
  //     try {
  //       addNum = number.Uint128LE.unpack(collect.data);
  //       // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //     } catch (error: any) {
  //       console.warn(error.message);
  //     }
  //
  //     if (addNum) {
  //       sudt_sumAmount = sudt_sumAmount.add(addNum);
  //
  //       if (sudt_sumAmount.gte(options.amount)) {
  //         break;
  //       }
  //     }
  //   }
  //   // >>
  //   if (sudt_sumAmount.lt(options.amount)) {
  //     throw new Error("Not enough sudt amount");
  //   }
  //
  //   for (let i = 0; i < inputs_sudt.length; i++) {
  //     const input = inputs_sudt[i];
  //     input.cellOutput.capacity = "0x0";
  //     txSkeleton = await commons.common.setupInputCell(txSkeleton, input);
  //   }
  //
  //   let outputCapacity = BI.from(0);
  //
  //   const outputData = number.Uint128LE.pack(options.amount);
  //   const newOutputData = outputData;
  //
  //   const outputs_sudt: Cell = {
  //     cellOutput: {
  //       capacity: "0x0",
  //       lock: toScript,
  //       type: options.typeScript,
  //     },
  //     data: bytes.hexify(newOutputData),
  //   };
  //   const outputs_sudt_capacity = BI.from(
  //     helpers.minimalCellCapacity(outputs_sudt)
  //   );
  //   outputs_sudt.cellOutput.capacity = outputs_sudt_capacity.toHexString();
  //   outputCapacity = outputCapacity.add(outputs_sudt_capacity);
  //
  //   const change_amount = sudt_sumAmount.sub(options.amount);
  //   if (change_amount.gt(0)) {
  //     const changeData = number.Uint128LE.pack(change_amount);
  //     const newChangeData = changeData;
  //
  //     const outputs_sudt_change: Cell = {
  //       cellOutput: {
  //         capacity: "0x0",
  //         lock: fromScript,
  //         type: options.typeScript,
  //       },
  //       data: bytes.hexify(newChangeData),
  //     };
  //     const outputs_sudt_change_capacity = BI.from(
  //       helpers.minimalCellCapacity(outputs_sudt_change)
  //     );
  //     outputs_sudt_change.cellOutput.capacity =
  //       outputs_sudt_change_capacity.toHexString();
  //
  //     outputCapacity = outputCapacity.add(outputs_sudt_change_capacity);
  //
  //     txSkeleton = txSkeleton.update("outputs", (outputs) =>
  //       outputs.push(outputs_sudt, outputs_sudt_change)
  //     );
  //   } else {
  //     txSkeleton = txSkeleton.update("outputs", (outputs) =>
  //       outputs.push(outputs_sudt)
  //     );
  //   }
  //
  //   const minEmptyCapacity = calculateEmptyCellMinCapacity(fromScript);
  //   const needCapacity = outputCapacity
  //     .sub(sudt_sumCapacity)
  //     .add(minEmptyCapacity)
  //     .add(2000); // fee
  //
  //   // find ckb
  //   // <<
  //   const collect_ckb = CkbHepler.instance.indexer.collector({
  //     lock: {
  //       script: fromScript,
  //       searchMode: "exact",
  //     },
  //     type: "empty",
  //   });
  //   const inputs_ckb: Cell[] = [];
  //   let ckb_sum = BI.from(0);
  //   for await (const collect of collect_ckb.collect()) {
  //     inputs_ckb.push(collect);
  //     ckb_sum = ckb_sum.add(collect.cellOutput.capacity);
  //     if (ckb_sum.gte(needCapacity)) {
  //       break;
  //     }
  //   }
  //   // >>
  //   if (ckb_sum.lt(needCapacity)) {
  //     throw new Error("No enough capacity");
  //   }
  //   for (let i = 0; i < inputs_ckb.length; i++) {
  //     const element = inputs_ckb[i];
  //     element.cellOutput.capacity = "0x0";
  //     txSkeleton = await commons.common.setupInputCell(txSkeleton, element);
  //   }
  //   const ckb_change = ckb_sum.sub(needCapacity);
  //   if (ckb_change.gt(0)) {
  //     const output_ckb_change: Cell = {
  //       cellOutput: {
  //         lock: fromScript,
  //         capacity: ckb_change.toHexString(),
  //       },
  //       data: "0x",
  //     };
  //     txSkeleton = txSkeleton.update("outputs", (outputs) =>
  //       outputs.push(output_ckb_change)
  //     );
  //   }
  //
  //   return txSkeleton;
  // }

  // send transaction
  async sendTransaction(tx: Transaction) {
    return CkbHepler.instance.rpc.sendTransaction(tx, "passthrough");
  }

  // capacityOf
  // async capacityOf(address: string) {
  //   const cfg = isTestNet() ? testConfig : mainConfig;
  //
  //   const collector = CkbHepler.instance.indexer.collector({
  //     lock: helpers.parseAddress(address, {
  //       config: cfg.CONFIG,
  //     }),
  //     type: "empty",
  //   });
  //   let balance = BI.from(0);
  //   for await (const cell of collector.collect()) {
  //     balance = balance.add(cell.cellOutput.capacity);
  //   }
  //   return balance;
  // }

  // sudt balance
  async sudtBalance(address: string, typeScript: Script) {
    const cfg = getEnv() ? testConfig : mainConfig;


    const collector = CkbHepler.instance.indexer.collector({
      lock: helpers.parseAddress(address, {
        config: cfg.CONFIG,
      }),
      type: typeScript,
      scriptSearchMode: "exact",
    });


    let balance = BI.from(0);
    for await (const cell of collector.collect()) {
      balance = balance.add(number.Uint128LE.unpack(cell.data).toString());
    }
    return balance;
  }

  // issue a new token
  // async sudt_buildIssueNewToken(issuer: string, amount: number) {
  //   const cfg = isTestNet() ? testConfig : mainConfig;
  //
  //   let txSkeleton = helpers.TransactionSkeleton({
  //     cellProvider: CkbHepler.instance.indexer,
  //   });
  //
  //   const issuerScript = helpers.parseAddress(issuer, {
  //     config: cfg.CONFIG,
  //   });
  //   const issuerAddress = helpers.encodeToAddress(issuerScript, {
  //     config: cfg.CONFIG,
  //   });
  //
  //   txSkeleton = await commons.sudt.issueToken(
  //     txSkeleton,
  //     issuerAddress,
  //     amount,
  //     undefined,
  //     undefined,
  //     { config: cfg.CONFIG }
  //   );
  //
  //   txSkeleton = await commons.common.payFee(
  //     txSkeleton,
  //     [issuerAddress],
  //     1000,
  //     undefined,
  //     { config: cfg.CONFIG }
  //   );
  //
  //   return txSkeleton;
  // }

  // udt balance
  // async getUdtBalance(address: string) {
  //   const cfg = isTestNet() ? testConfig : mainConfig;
  //
  //   const lock = helpers.parseAddress(address, {
  //     config: cfg.CONFIG,
  //   });
  //
  //   const sudtType = getSudtTypeScript(cfg.isMainnet);
  //
  //   const xudtType = getXudtTypeScript(cfg.isMainnet);
  //
  //   const sudtCellList: Cell[] = [];
  //
  //   const xudtCellList: Cell[] = [];
  //
  //   const sudtUtxoCollector = CkbHepler.instance.indexer.collector({
  //     lock,
  //     type: {
  //       script: {
  //         codeHash: sudtType.codeHash,
  //         hashType: sudtType.hashType,
  //         args: "0x",
  //       },
  //       searchMode: "prefix",
  //     },
  //   });
  //
  //   const xudtUtxoCollector = CkbHepler.instance.indexer.collector({
  //     lock,
  //     type: {
  //       script: {
  //         codeHash: xudtType.codeHash,
  //         hashType: xudtType.hashType,
  //         args: "0x",
  //       },
  //       searchMode: "prefix",
  //     },
  //   });
  //
  //   for await (const sudt_cell of sudtUtxoCollector.collect()) {
  //     sudtCellList.push(sudt_cell);
  //   }
  //
  //   for await (const xudt_cell of xudtUtxoCollector.collect()) {
  //     xudtCellList.push(xudt_cell);
  //   }
  //
  //   const udtMap: { [key: string]: UdtInfo } = {};
  //
  //   for (let i = 0; i < sudtCellList.length; i++) {
  //     const sudtCell = sudtCellList[i];
  //     if (sudtCell.cellOutput.type) {
  //       const typeScriptHex = bytes.hexify(
  //         blockchain.Script.pack(sudtCell.cellOutput.type)
  //       );
  //       if (!udtMap[typeScriptHex]) {
  //         udtMap[typeScriptHex] = {
  //           type: "sudt",
  //           typeScriptHex: typeScriptHex,
  //           balance: BI.from(0),
  //         };
  //       }
  //
  //       let addNum: BI | undefined = undefined;
  //       try {
  //         addNum = number.Uint128LE.unpack(sudtCell.data);
  //         // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //       } catch (error: any) {
  //         console.warn(error.message);
  //       }
  //
  //       if (addNum)
  //         udtMap[typeScriptHex].balance =
  //           udtMap[typeScriptHex].balance.add(addNum);
  //     }
  //   }
  //
  //   for (let i = 0; i < xudtCellList.length; i++) {
  //     const xudtCell = xudtCellList[i];
  //     if (xudtCell.cellOutput.type) {
  //       const typeScriptHex = bytes.hexify(
  //         blockchain.Script.pack(xudtCell.cellOutput.type)
  //       );
  //       if (!udtMap[typeScriptHex]) {
  //         udtMap[typeScriptHex] = {
  //           type: "xUDT",
  //           typeScriptHex: typeScriptHex,
  //           balance: BI.from(0),
  //         };
  //       }
  //
  //       let addNum: BI | undefined = undefined;
  //       try {
  //         addNum = number.Uint128LE.unpack(xudtCell.data);
  //         // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //       } catch (error: any) {
  //         console.warn(error.message);
  //       }
  //
  //       if (addNum)
  //         udtMap[typeScriptHex].balance = udtMap[typeScriptHex].balance.add(
  //           number.Uint128LE.unpack(xudtCell.data)
  //         );
  //     }
  //   }
  //
  //   return udtMap;
  // }

  // spore
  // async getSpore(address: string) {
  //   const cfg = isTestNet() ? testConfig : mainConfig;
  //
  //   const lock = helpers.parseAddress(address, {
  //     config: cfg.CONFIG,
  //   });
  //
  //   const sporeType = getSporeTypeScript(cfg.isMainnet);
  //
  //   const sporeCellList: Cell[] = [];
  //
  //   const sporeCollector = CkbHepler.instance.indexer.collector({
  //     lock,
  //     type: {
  //       script: {
  //         codeHash: sporeType.codeHash,
  //         hashType: sporeType.hashType,
  //         args: "0x",
  //       },
  //       searchMode: "prefix",
  //     },
  //   });
  //
  //   for await (const sporeCell of sporeCollector.collect()) {
  //     sporeCellList.push(sporeCell);
  //   }
  //
  //   return sporeCellList;
  // }

  // transactions
  // async getTx(address: string, page: number = 0) {
  //   const cfg = isTestNet() ? testConfig : mainConfig;
  //
  //   const rs = await superagent
  //     .post(`${backend}/api/explore`)
  //     .set("Content-Type", "application/json")
  //     .send({
  //       req: `https://${
  //         cfg.ckb_explorer_api
  //       }/api/v1/address_transactions/${address}?page=${
  //         page + 1
  //       }&page_size=10&sort=time.desc`,
  //     })
  //     .catch((err) => {
  //       console.error(err);
  //     });
  //
  //   if (rs && rs.status == 200) {
  //     return JSON.parse(rs.text);
  //   }
  // }

  // async getPendingTx(address: string) {
  //   const cfg = isTestNet() ? testConfig : mainConfig;
  //
  //   const rs = await superagent
  //     .post(`${backend}/api/explore`)
  //     .set("Content-Type", "application/json")
  //     .send({
  //       req: `https://${cfg.ckb_explorer_api}/api/v1/address_pending_transactions/${address}?page=1&page_size=10&sort=time.desc`,
  //     })
  //     .catch((err) => {
  //       console.error(err);
  //     });
  //
  //   if (rs && rs.status == 200) {
  //     return JSON.parse(rs.text);
  //   }
  // }

  // send explore api
  async sendExploreApi(url: string) {
    const rs = await superagent
      .post(`${backend}/api/explore`)
      .set("Content-Type", "application/json")
      .send({
        req: url,
      })
      .catch((err) => {
        console.error(err);
      });

    if (rs && rs.status == 200) {
      return JSON.parse(rs.text);
    }
  }

  // async getAddressInfo(address: string): Promise<ckb_AddressInfo | undefined> {
  //   const cfg = isTestNet() ? testConfig : mainConfig;
  //
  //   const result = await this.sendExploreApi(
  //     `https://${cfg.ckb_explorer_api}/api/v1/suggest_queries?q=${address}`
  //   );
  //   return result;
  // }

  async getUDTInfo(type_hash: string) {
    const cfg = getEnv() ? testConfig : mainConfig;

    const result = await this.sendExploreApi(
      `https://${cfg.ckb_explorer_api}/api/v1/udts/${type_hash}`
    );
    return result;
  }

  // async getAddress(address: string) {
  //   const cfg = isTestNet() ? testConfig : mainConfig;
  //
  //   const result = await this.sendExploreApi(
  //     `https://${cfg.ckb_explorer_api}/api/v1/addresses?q=${address}`
  //   );
  //   return result;
  // }

  async getCellOutPutData(id: string): Promise<CellOutPutData | undefined> {
    const cfg = getEnv() ? testConfig : mainConfig;

    const result = await this.sendExploreApi(
      `https://${cfg.ckb_explorer_api}/api/v1/cell_output_data/${id}`
    );
    return result;
  }

  async getTxInfo(txHash: string): Promise<ckb_TxInfo_new | undefined> {
    const cfg = getEnv() ? testConfig : mainConfig;

    const result = await this.sendExploreApi(
      `https://${cfg.ckb_explorer_api}/api/v1/transactions/${txHash}`
    );
    return result;
  }

  async getXudtAndSpore(address: string) {
    const cfg = getEnv() ? testConfig : mainConfig;

    const xudtTypeScript = getXudtTypeScript(cfg.isMainnet);
    const sporeTypeScript = getSporeTypeScript(cfg.isMainnet);

    const xudt_collector = CkbHepler.instance.indexer.collector({
      lock: helpers.parseAddress(address, {
        config: cfg.CONFIG,
      }),
      type: {
        script: {
          codeHash: xudtTypeScript.codeHash,
          hashType: xudtTypeScript.hashType,
          args: "0x",
        },
        searchMode: "prefix",
      },
    });

    const spore_collector = CkbHepler.instance.indexer.collector({
      lock: helpers.parseAddress(address, {
        config: cfg.CONFIG,
      }),
      type: {
        script: {
          codeHash: sporeTypeScript.codeHash,
          hashType: sporeTypeScript.hashType,
          args: "0x",
        },
        searchMode: "prefix",
      },
    });

    const xudtList: ckb_UDTInfo[] = [];
    const sporeList: ckb_SporeInfo[] = [];

    const xudtMap: { [key: string]: ckb_UDTInfo } = {};

    for await (const xudtCell of xudt_collector.collect()) {
      if (xudtCell.cellOutput.type) {
        const typeHash = utils.computeScriptHash(xudtCell.cellOutput.type);
        if (!xudtMap[typeHash]) {
          const ckbUDTInfo: ckb_UDTInfo = {
            symbol: "UNKNOWN",
            amount: BI.from(0).toString(),
            type_hash: typeHash,
            udt_type: "xUDT",
            type_script: xudtCell.cellOutput.type,
          };

          xudtMap[typeHash] = ckbUDTInfo;
          xudtList.push(ckbUDTInfo);
        }

        let addNum: any = undefined;
        try {
          addNum = number.Uint128LE.unpack(xudtCell.data);

        } catch (error: any) {
          console.warn(error.message);
        }

        if (addNum)
          xudtMap[typeHash].amount = BI.from(xudtMap[typeHash].amount)
            .add(addNum)
            .toString();
      }
    }

    for await (const sporeCell of spore_collector.collect()) {
      if (sporeCell.cellOutput.type) {
        const typeHash = utils.computeScriptHash(sporeCell.cellOutput.type);

        sporeList.push({
          symbol: "DOBs",
          amount: sporeCell.cellOutput.type.args,
          type_hash: typeHash,
          udt_type: "spore_cell",
          type_script: sporeCell.cellOutput.type,
        });
      }
    }

    return { xudtList, sporeList };
  }

  // async withDrawXUDT(sudtToken: Script) {
  //   const cfg = isTestNet() ? testConfig : mainConfig;
  //
  //   let txSkeleton = helpers.TransactionSkeleton({
  //     cellProvider: CkbHepler.instance.indexer,
  //   });
  //
  //   let isXUDT = false;
  //   const xudtScript = getXudtTypeScript(cfg.isMainnet);
  //   if (sudtToken.codeHash == xudtScript.codeHash) {
  //     isXUDT = true;
  //   }
  //   console.log("script is xudt", isXUDT);
  //
  //   let sudt_cellDeps = helpers.locateCellDep(sudtToken);
  //   if (sudt_cellDeps == null) {
  //     if (isXUDT) {
  //       sudt_cellDeps = getXudtDep(cfg.isMainnet);
  //     } else {
  //       throw new Error("No sudt cell deps");
  //     }
  //   }
  //
  //   txSkeleton = addCellDep(txSkeleton, sudt_cellDeps);
  //
  //   const curAccount = DataManager.instance.getCurAccount();
  //   if (!curAccount) {
  //     throw new Error("Please choose a wallet");
  //   }
  //
  //   const wallet = accountStore.getWallet(curAccount);
  //   if (!wallet) {
  //     throw new Error("Please choose a wallet");
  //   }
  //
  //   const collect_sudt = CkbHepler.instance.indexer.collector({
  //     lock: {
  //       script: helpers.parseAddress(wallet.address, {
  //         config: cfg.CONFIG,
  //       }),
  //       searchMode: "exact",
  //     },
  //     type: {
  //       script: sudtToken,
  //       searchMode: "exact",
  //     },
  //   });
  //
  //   for await (const collect of collect_sudt.collect()) {
  //     const cfg = isTestNet() ? testConfig : mainConfig;
  //
  //     collect.cellOutput = {
  //       lock: collect.cellOutput.lock,
  //       capacity: BI.from(collect.cellOutput.capacity).sub(1000).toHexString(),
  //     };
  //
  //     txSkeleton = await commons.common.setupInputCell(
  //       txSkeleton,
  //       collect,
  //       undefined,
  //       { config: cfg.CONFIG }
  //     );
  //   }
  //
  //   const tx = helpers.createTransactionFromSkeleton(txSkeleton);
  //
  //   const signed = await signRawTransaction(
  //     tx as CKBTransaction,
  //     wallet.address
  //   );
  //
  //   const txHash = await this.sendTransaction(signed);
  //   console.log("withDraw txHash:", txHash);
  //
  //   return txHash;
  // }

  // async mintXUDT(name: string, symbol: string, amount: BI) {
  //   const cfg = isTestNet() ? testConfig : mainConfig;
  //
  //   const curAccount = DataManager.instance.getCurAccount();
  //   if (!curAccount) {
  //     throw new Error("Please choose a wallet");
  //   }
  //
  //   const wallet = accountStore.getWallet(curAccount);
  //   if (!wallet) {
  //     throw new Error("Please choose a wallet");
  //   }
  //
  //   const xudtData = bytes.hexify(number.Uint128LE.pack(amount));
  //   const xudtInfo = append0x(
  //     serializeUniqueCellXudtInfo({
  //       decimal: 8,
  //       name: name,
  //       symbol: symbol,
  //     })
  //   );
  //
  //   const collector = new Collector({
  //     ckbNodeUrl: cfg.CKB_RPC_URL,
  //     ckbIndexerUrl: cfg.CKB_INDEX_URL,
  //   });
  //
  //   // const address = collector
  //   //   .getCkb()
  //   //   .utils.privateKeyToAddress(CKB_TEST_PRIVATE_KEY, {
  //   //     prefix: AddressPrefix.Testnet,
  //   //   });
  //   // // ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq0e4xk4rmg5jdkn8aams492a7jlg73ue0gc0ddfj
  //   // console.log("ckb address: ", address);
  //
  //   const lock = addressToScript(wallet.address);
  //   const emptyCells = await collector.getCells({
  //     lock,
  //   });
  //   if (!emptyCells || emptyCells.length === 0) {
  //     throw new NoLiveCellError("The address has no empty cells");
  //   }
  //
  //   const uniqueCellCapacity =
  //     MIN_CAPACITY +
  //     BigInt(65) * CKB_UNIT +
  //     BigInt(remove0x(xudtInfo).length / 2) * CKB_UNIT;
  //   const minXudtCapacity = calcXudtCapacity(
  //     helpers.addressToScript(wallet.address)
  //   );
  //
  //   const txFee = MAX_FEE + BigInt(2000_0000);
  //   const { inputs, sumInputsCapacity } = collector.collectInputs(
  //     emptyCells,
  //     uniqueCellCapacity + minXudtCapacity,
  //     txFee,
  //     MIN_CAPACITY
  //   );
  //
  //   const uniqueTypeScript = getUniqueCellTypeScript(cfg.isMainnet);
  //   const xudtTypeScript = getXudtTypeScript(cfg.isMainnet);
  //   const outputs: CKBComponents.CellOutput[] = [
  //     {
  //       lock,
  //       type: {
  //         ...uniqueTypeScript,
  //         args: generateUniqueTypeArgs(inputs[0], 0),
  //       },
  //       capacity: append0x(uniqueCellCapacity.toString(16)),
  //     },
  //     {
  //       lock,
  //       type: {
  //         ...xudtTypeScript,
  //         args: utils.computeScriptHash(lock),
  //       },
  //       capacity: append0x(minXudtCapacity.toString(16)),
  //     },
  //   ];
  //
  //   const changeCapacity =
  //     sumInputsCapacity - uniqueCellCapacity - minXudtCapacity - txFee;
  //   outputs.push({
  //     lock,
  //     capacity: append0x(changeCapacity.toString(16)),
  //   });
  //
  //   const outputsData = [xudtInfo, xudtData, "0x"];
  //
  //   const emptyWitness = { lock: "", inputType: "", outputType: "" };
  //   const witnesses = inputs.map((_, index) =>
  //     index === 0 ? serializeWitnessArgs(emptyWitness) : "0x"
  //   );
  //
  //   const cellDeps = [
  //     getJoyIDCellDep(cfg.isMainnet),
  //     // getSecp256k1CellDep(cfg.isMainnet),
  //     getUniqueCellTypeDep(cfg.isMainnet),
  //     getXudtDep(cfg.isMainnet),
  //   ];
  //
  //   const unsignedTx = {
  //     version: "0x0",
  //     cellDeps,
  //     headerDeps: [],
  //     inputs,
  //     outputs,
  //     outputsData,
  //     witnesses,
  //   };
  //
  //   if (txFee === MAX_FEE) {
  //     const txSize =
  //       getTransactionSize(unsignedTx) + SECP256K1_WITNESS_LOCK_SIZE;
  //     const estimatedTxFee = calculateTransactionFee(txSize);
  //     const estimatedChangeCapacity =
  //       changeCapacity + (MAX_FEE - estimatedTxFee);
  //     unsignedTx.outputs[unsignedTx.outputs.length - 1].capacity = append0x(
  //       estimatedChangeCapacity.toString(16)
  //     );
  //   }
  //
  //   const signedTx = await signRawTransaction(
  //     unsignedTx as CKBTransaction,
  //     wallet.address
  //   );
  //
  //   // const signedTx = collector.getCkb().signTransaction(CKB_TEST_PRIVATE_KEY)(
  //   //   unsignedTx
  //   // );
  //   console.log(signedTx);
  //
  //   const txHash = await collector
  //     .getCkb()
  //     .rpc.sendTransaction(signedTx, "passthrough");
  //   return txHash;
  // }

  async getRgbppPendingAssert(address: string) {
    const cfg =  getEnv() === 'Testnet' ? testConfig : mainConfig;

    const btcTimeLock = getBtcTimeLockScript(cfg.isMainnet);

    const xudtTS = getXudtTypeScript(cfg.isMainnet);

    const lock = helpers.parseAddress(address, {
      config: cfg.CONFIG,
    });

    const btcLockArgs = genBtcTimeLockArgs(
      lock,
      "0000000000000000000000000000000000000000000000000000000000000000",
      0
    );

    const addressHexString = bytes.hexify(btcLockArgs);
    const prefixArgs = addressHexString.split(
      "000000000000000000000000000000000000000000000000000000000000000000000000"
    )[0];
    console.log(prefixArgs);

    const collect = CkbHepler.instance.indexer.collector({
      lock: {
        script: {
          codeHash: btcTimeLock.codeHash,
          hashType: btcTimeLock.hashType,
          args: prefixArgs,
        },
        searchMode: "prefix",
      },
      type: {
        script: {
          codeHash: xudtTS.codeHash,
          hashType: xudtTS.hashType,
          args: "0x",
        },
        searchMode: "prefix",
      },
      scriptSearchMode: "prefix",
    });

    const xudtList: ckb_UDTInfo[] = [];

    const xudtMap: { [key: string]: ckb_UDTInfo } = {};

    for await (const xudtCell of collect.collect()) {
      console.log(xudtCell);

      if (xudtCell.cellOutput.type) {
        const typeHash = utils.computeScriptHash(xudtCell.cellOutput.type);
        if (!xudtMap[typeHash]) {
          const ckbUDTInfo: ckb_UDTInfo = {
            symbol: "UNKNOWN",
            amount: BI.from(0).toString(),
            type_hash: typeHash,
            udt_type: "xUDT",
            type_script: xudtCell.cellOutput.type,
            isPending: true,
          };

          xudtMap[typeHash] = ckbUDTInfo;
          xudtList.push(ckbUDTInfo);
        }

        let addNum: BI | undefined = undefined;
        try {
          //@ts-ignore
          addNum = number.Uint128LE.unpack(xudtCell.data);
        } catch (error: any) {
          console.warn(error.message);
        }

        if (addNum)
          xudtMap[typeHash].amount = BI.from(xudtMap[typeHash].amount)
            .add(addNum)
            .toString();
      }
    }

    return xudtList;
  }

  // async batchTransferXudt(
  //   xudtType: Script,
  //   receivers: { toAddress: string; transferAmount: bigint }[]
  // ) {
  //   const cfg = isTestNet() ? testConfig : mainConfig;
  //
  //   const curAccount = DataManager.instance.getCurAccount();
  //   if (!curAccount) {
  //     throw new Error("Please choose a wallet");
  //   }
  //
  //   const wallet = accountStore.getWallet(curAccount);
  //   if (!wallet) {
  //     throw new Error("Please choose a wallet");
  //   }
  //
  //   const collector = new Collector({
  //     ckbNodeUrl: cfg.CKB_RPC_URL,
  //     ckbIndexerUrl: cfg.CKB_INDEX_URL,
  //   });
  //
  //   // const isMainnet = false;
  //   // const fromAddress = collector
  //   //   .getCkb()
  //   //   .utils.privateKeyToAddress(CKB_TEST_PRIVATE_KEY, {
  //   //     prefix: AddressPrefix.Testnet,
  //   //   });
  //   // // ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq0e4xk4rmg5jdkn8aams492a7jlg73ue0gc0ddfj
  //   // console.log("ckb address: ", fromAddress);
  //
  //   // const fromLock = addressToScript(fromAddress);
  //
  //   const fromLock = helpers.parseAddress(wallet.address, {
  //     config: cfg.CONFIG,
  //   });
  //
  //   console.log("Lock", fromLock);
  //
  //   const xudtCells = await collector.getCells({
  //     lock: fromLock,
  //     type: xudtType,
  //   });
  //   if (!xudtCells || xudtCells.length === 0) {
  //     throw new Error("The address has no xudt cells");
  //   }
  //   const sumTransferAmount = receivers
  //     .map((receiver) => receiver.transferAmount)
  //     .reduce((prev, current) => prev + current, BigInt(0));
  //
  //   let {
  //     // eslint-disable-next-line prefer-const
  //     inputs,
  //     // eslint-disable-next-line prefer-const
  //     sumInputsCapacity: sumXudtInputsCapacity,
  //     // eslint-disable-next-line prefer-const
  //     sumAmount,
  //   } = collector.collectUdtInputs({
  //     liveCells: xudtCells,
  //     needAmount: sumTransferAmount,
  //   });
  //
  //   const xudtCapacity = calcXudtCapacity(fromLock);
  //
  //   let totalReceiverXudtCapacity = BI.from(0).toBigInt();
  //   const receiverXudtCapacityList: bigint[] = [];
  //   for (let i = 0; i < receivers.length; i++) {
  //     const receiver = receivers[i];
  //     const v = calcXudtCapacity(
  //       helpers.parseAddress(receiver.toAddress, {
  //         config: cfg.CONFIG,
  //       })
  //     );
  //     receiverXudtCapacityList.push(v);
  //     totalReceiverXudtCapacity += v;
  //   }
  //
  //   const outputs: CKBComponents.CellOutput[] = [];
  //   const outputsData: string[] = [];
  //
  //   for (let i = 0; i < receivers.length; i++) {
  //     const receiver = receivers[i];
  //     const xudtCapacity = receiverXudtCapacityList[i];
  //
  //     outputs.push({
  //       lock: helpers.parseAddress(receiver.toAddress, {
  //         config: cfg.CONFIG,
  //       }),
  //       type: xudtType,
  //       capacity: append0x(xudtCapacity.toString(16)),
  //     });
  //     outputsData.push(append0x(u128ToLe(receiver.transferAmount)));
  //   }
  //
  //   if (sumAmount > sumTransferAmount) {
  //     outputs.push({
  //       lock: fromLock,
  //       type: xudtType,
  //       capacity: append0x(xudtCapacity.toString(16)),
  //     });
  //     outputsData.push(append0x(u128ToLe(sumAmount - sumTransferAmount)));
  //     sumXudtInputsCapacity -= xudtCapacity;
  //   }
  //   if (sumXudtInputsCapacity > 0) {
  //     outputs.push({
  //       lock: fromLock,
  //       capacity: append0x(sumXudtInputsCapacity.toString(16)),
  //     });
  //     outputsData.push("0x");
  //   }
  //
  //   // create recevier input
  //   const txFee = MAX_FEE;
  //   const emptyCells = await collector.getCells({
  //     lock: fromLock,
  //   });
  //   if (!emptyCells || emptyCells.length === 0) {
  //     throw new NoLiveCellError("The address has no empty cells");
  //   }
  //   const needCapacity = totalReceiverXudtCapacity;
  //   const { inputs: emptyInputs, sumInputsCapacity: sumEmptyCapacity } =
  //     collector.collectInputs(emptyCells, needCapacity, txFee, MIN_CAPACITY);
  //
  //   inputs.push(...emptyInputs);
  //
  //   if (sumEmptyCapacity > needCapacity + txFee) {
  //     const changeCapacity = sumEmptyCapacity - needCapacity - txFee;
  //     outputs.push({
  //       lock: fromLock,
  //       capacity: append0x(changeCapacity.toString(16)),
  //     });
  //     outputsData.push("0x");
  //   }
  //
  //   // const emptyWitness = { lock: "", inputType: "", outputType: "" };
  //   // const witnesses: (
  //   //   | string
  //   //   | { lock: string; inputType: string; outputType: string }
  //   // )[] = inputs.map((_, index) => (index === 0 ? emptyWitness : "0x"));
  //
  //   const emptyWitness = { lock: "", inputType: "", outputType: "" };
  //   const witnesses: (
  //     | string
  //     | { lock: string; inputType: string; outputType: string }
  //   )[] = inputs.map((_, index) =>
  //     index === 0 ? serializeWitnessArgs(emptyWitness) : "0x"
  //   );
  //
  //   // const cellDeps = [getSecp256k1CellDep(isMainnet), getXudtDep(isMainnet)];
  //   const cellDeps = [
  //     getJoyIDCellDep(cfg.isMainnet),
  //     getXudtDep(cfg.isMainnet),
  //   ];
  //
  //   const unsignedTx = {
  //     version: "0x0",
  //     cellDeps,
  //     headerDeps: [],
  //     inputs,
  //     outputs,
  //     outputsData,
  //     witnesses,
  //   };
  //
  //   // const signedTx = collector.getCkb().signTransaction(CKB_TEST_PRIVATE_KEY)(
  //   //   unsignedTx
  //   // );
  //   const signedTx = await signRawTransaction(
  //     unsignedTx as CKBTransaction,
  //     wallet.address
  //   );
  //
  //   console.log(signedTx);
  //
  //   const txHash = await collector
  //     .getCkb()
  //     .rpc.sendTransaction(signedTx, "passthrough");
  //   console.log(txHash);
  // }

  // async test_transferXudt(
  //   xudtType: Script,
  //   receivers: [{ toAddress: string; transferAmount: bigint }]
  // ) {
  //   const cfg = isTestNet() ? testConfig : mainConfig;
  //
  //   const collector = new Collector({
  //     ckbNodeUrl: cfg.CKB_RPC_URL,
  //     ckbIndexerUrl: cfg.CKB_INDEX_URL,
  //   });
  //
  //   const isMainnet = false;
  //   const fromAddress = collector
  //     .getCkb()
  //     .utils.privateKeyToAddress(CKB_TEST_PRIVATE_KEY, {
  //       prefix: AddressPrefix.Testnet,
  //     });
  //   // ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq0e4xk4rmg5jdkn8aams492a7jlg73ue0gc0ddfj
  //   console.log("ckb address: ", fromAddress);
  //
  //   const fromLock = addressToScript(fromAddress);
  //
  //   console.log("Lock", fromLock);
  //
  //   const xudtCells = await collector.getCells({
  //     lock: fromLock,
  //     type: xudtType,
  //   });
  //   if (!xudtCells || xudtCells.length === 0) {
  //     throw new Error("The address has no xudt cells");
  //   }
  //   const sumTransferAmount = receivers
  //     .map((receiver) => receiver.transferAmount)
  //     .reduce((prev, current) => prev + current, BigInt(0));
  //
  //   let {
  //     // eslint-disable-next-line prefer-const
  //     inputs,
  //     // eslint-disable-next-line prefer-const
  //     sumInputsCapacity: sumXudtInputsCapacity,
  //     // eslint-disable-next-line prefer-const
  //     sumAmount,
  //   } = collector.collectUdtInputs({
  //     liveCells: xudtCells,
  //     needAmount: sumTransferAmount,
  //   });
  //
  //   const xudtCapacity = calcXudtCapacity(fromLock);
  //
  //   let totalReceiverXudtCapacity = BI.from(0).toBigInt();
  //   const receiverXudtCapacityList: bigint[] = [];
  //   for (let i = 0; i < receivers.length; i++) {
  //     const receiver = receivers[i];
  //     const v = calcXudtCapacity(
  //       helpers.parseAddress(receiver.toAddress, {
  //         config: cfg.CONFIG,
  //       })
  //     );
  //     receiverXudtCapacityList.push(v);
  //     totalReceiverXudtCapacity += v;
  //   }
  //
  //   const outputs: CKBComponents.CellOutput[] = [];
  //   const outputsData: string[] = [];
  //
  //   for (let i = 0; i < receivers.length; i++) {
  //     const receiver = receivers[i];
  //     const xudtCapacity = receiverXudtCapacityList[i];
  //
  //     outputs.push({
  //       lock: helpers.parseAddress(receiver.toAddress, {
  //         config: cfg.CONFIG,
  //       }),
  //       type: xudtType,
  //       capacity: append0x(xudtCapacity.toString(16)),
  //     });
  //     outputsData.push(append0x(u128ToLe(receiver.transferAmount)));
  //   }
  //
  //   if (sumAmount > sumTransferAmount) {
  //     outputs.push({
  //       lock: fromLock,
  //       type: xudtType,
  //       capacity: append0x(xudtCapacity.toString(16)),
  //     });
  //     outputsData.push(append0x(u128ToLe(sumAmount - sumTransferAmount)));
  //     sumXudtInputsCapacity -= xudtCapacity;
  //   }
  //   if (sumXudtInputsCapacity > 0) {
  //     outputs.push({
  //       lock: fromLock,
  //       capacity: append0x(sumXudtInputsCapacity.toString(16)),
  //     });
  //     outputsData.push("0x");
  //   }
  //
  //   // create recevier input
  //   const txFee = MAX_FEE;
  //   const emptyCells = await collector.getCells({
  //     lock: fromLock,
  //   });
  //   if (!emptyCells || emptyCells.length === 0) {
  //     throw new NoLiveCellError("The address has no empty cells");
  //   }
  //   const needCapacity = totalReceiverXudtCapacity;
  //   const { inputs: emptyInputs, sumInputsCapacity: sumEmptyCapacity } =
  //     collector.collectInputs(emptyCells, needCapacity, txFee, MIN_CAPACITY);
  //
  //   inputs.push(...emptyInputs);
  //
  //   if (sumEmptyCapacity > needCapacity + txFee) {
  //     const changeCapacity = sumEmptyCapacity - needCapacity - txFee;
  //     outputs.push({
  //       lock: fromLock,
  //       capacity: append0x(changeCapacity.toString(16)),
  //     });
  //     outputsData.push("0x");
  //   }
  //
  //   const emptyWitness = { lock: "", inputType: "", outputType: "" };
  //   const witnesses: (
  //     | string
  //     | { lock: string; inputType: string; outputType: string }
  //   )[] = inputs.map((_, index) => (index === 0 ? emptyWitness : "0x"));
  //
  //   const cellDeps = [getSecp256k1CellDep(isMainnet), getXudtDep(isMainnet)];
  //
  //   const unsignedTx = {
  //     version: "0x0",
  //     cellDeps,
  //     headerDeps: [],
  //     inputs,
  //     outputs,
  //     outputsData,
  //     witnesses,
  //   };
  //
  //   const signedTx = collector.getCkb().signTransaction(CKB_TEST_PRIVATE_KEY)(
  //     unsignedTx
  //   );
  //
  //   console.log(signedTx);
  //
  //   const txHash = await collector
  //     .getCkb()
  //     .rpc.sendTransaction(signedTx, "passthrough");
  //   console.log(txHash);
  // }
}
