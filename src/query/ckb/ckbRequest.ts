import {
  Cell,
  CellDep,
  Indexer,
  RPC,
  Script,
  Transaction,
  commons,
  config,
  helpers,
  utils,
} from "@ckb-lumos/lumos";
import { BI } from "@ckb-lumos/bi";
import { addCellDep } from "@ckb-lumos/common-scripts/lib/helper";
// import {
//   UdtInfo,
//   ckb_AddressInfo,
//   ckb_SporeInfo,
//   ckb_TransferOptions,
//   ckb_UDTInfo,
// } from "../interface";

import {
  CKBTransaction,
  connect,
  initConfig,
  signRawTransaction,
} from "@joyid/ckb";
import { createJoyIDScriptInfo } from "./joyid";

import { number, bytes } from "@ckb-lumos/codec";
import { calculateEmptyCellMinCapacity, generateSporeCoBuild } from "../utils";
import { blockchain } from "@ckb-lumos/base";
import superagent from "superagent";
import {
  ckb_AddressInfo,
  ckb_SporeInfo,
  ckb_TransferOptions,
  ckb_UDTInfo,
  UdtInfo,
} from "@/types/BTC";
import store from "@/store/store";
import { setCurrentWalletAddress } from "@/store/wallet/walletSlice";
import {
  backend,
  ckb_explorer_api,
  CKB_INDEX_URL,
  CKB_RPC_URL,
  CONFIG,
  getSporeDep,
  getSporeTypeScript,
  getSudtDep,
  getSudtTypeScript,
  getXudtDep,
  getXudtTypeScript,
} from "@/settings/variable";
import { getEnv } from "@/settings/env";


const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_INDEX_URL, CKB_RPC_URL);

const isMainnet = getEnv() == "Testnet" ? false : true;

export class CkbHepler {
  private static _instance: CkbHepler;
  private constructor() {}

  public static get instance() {
    if (!CkbHepler._instance) {
      CkbHepler._instance = new CkbHepler();

      commons.common.registerCustomLockScriptInfos([createJoyIDScriptInfo()]);
    }
    return this._instance;
  }

  // transfer ckb
  async transfer_ckb(options: ckb_TransferOptions, currentAccount: string) {
    if (!currentAccount) {
      throw new Error("Please choose a wallet");
    }
    const wallets = store.getState().wallet.wallets;
    const wallet = wallets.find((wallet) => wallet.address === currentAccount);
    if (!wallet) {
      throw new Error("Please choose a wallet");
    }

    const unsigned = await this.buildTransfer(options);
    const tx = helpers.createTransactionFromSkeleton(unsigned);

    if (wallet.walletName == "joyidckb") {
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
  async transfer_udt(options: ckb_TransferOptions, currentAccount: string) {
    // const curAccount = DataManager.instance.getCurAccount();
    const wallets = store.getState().wallet.wallets;
    const wallet = wallets.find((wallet) => wallet.address === currentAccount);
    if (!wallet) {
      throw new Error("Please choose a wallet");
    }

    const unsigned = await this.buildTransfer(options);
    const tx = helpers.createTransactionFromSkeleton(unsigned);

    if (wallet.walletName == "joyidckb") {
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
  async deploy_sudt(issuer: string, amount: number, currentAccount: string) {
    const wallets = store.getState().wallet.wallets;
    const wallet = wallets.find((wallet) => wallet.address === currentAccount);

    if (!currentAccount) {
      throw new Error("Please choose a wallet");
    }

    if (!wallet) {
      throw new Error("Please choose a wallet");
    }

    const unsigned = await this.sudt_buildIssueNewToken(issuer, amount);
    const tx = helpers.createTransactionFromSkeleton(unsigned);

    if (wallet.walletName == "joyidckb") {
      const signed = await signRawTransaction(tx as CKBTransaction, issuer);

      console.log("[deploy_sudt]sign raw tx", signed);

      console.log("[deploy_sudt]amount", amount);

      return this.sendTransaction(signed);
    }

    throw new Error("Please connect wallet");
  }

  // transfer spore
  async transfer_spore(options: ckb_TransferOptions, currentAccount: string) {
    const unsigned = await this.buildTransfer(options);
    const tx = helpers.createTransactionFromSkeleton(unsigned);

    // const curAccount = DataManager.instance.getCurAccount();
    const wallets = store.getState().wallet.wallets;
    const wallet = wallets.find((wallet) => wallet.address === currentAccount);
    if (!wallet) {
      throw new Error("Please choose a wallet");
    }

    if (wallet.walletName == "joyidckb") {
      const signed = await signRawTransaction(
        tx as CKBTransaction,
        options.from
      );

      console.log("sign raw tx", signed);

      console.log("spore type script", options.typeScript);

      return this.sendTransaction(signed);
    }

    throw new Error("Please connect wallet");
  }

  // build ckb transfer
  async buildTransfer(options: ckb_TransferOptions) {
    const sudtScript = getSudtTypeScript(isMainnet);
    const xudtScript = getXudtTypeScript(isMainnet);
    const sporeScript = getSporeTypeScript(isMainnet);

    if (
      options.typeScript &&
      (options.typeScript.codeHash == sudtScript.codeHash ||
        options.typeScript.codeHash == xudtScript.codeHash)
    ) {
      // sudt
      const txSkeleton = await this.sudt_xudt_buildTransfer(options);

      return txSkeleton;
    } else if (
      options.typeScript &&
      options.typeScript.codeHash == sporeScript.codeHash
    ) {
      // spore
      const txSkeleton = await this.spore_buildTransfer(options);
      return txSkeleton;
    } else {
      // ckb
      let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });

      const fromScript = helpers.parseAddress(options.from);
      const fromAddress = helpers.encodeToAddress(fromScript, {
        config: CONFIG,
      });

      console.log(fromAddress);

      const toScript = helpers.parseAddress(options.to);
      const toAddress = helpers.encodeToAddress(toScript, { config: CONFIG });

      console.log(toAddress);
      txSkeleton = await commons.common.transfer(
        txSkeleton,
        [fromAddress],
        toAddress,
        //@ts-ignore
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
  }

  // build spore transfer
  async spore_buildTransfer(options: ckb_TransferOptions) {
    let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });

    const sporeTS = options.typeScript;
    if (!sporeTS) {
      throw new Error("No spore type script");
    }

    const spore_cellDeps = getSporeDep(isMainnet);
    if (spore_cellDeps == null) {
      throw new Error("No spore cell deps");
    }

    txSkeleton = addCellDep(txSkeleton, spore_cellDeps);

    const fromScript = helpers.parseAddress(options.from);
    const fromAddress = helpers.encodeToAddress(fromScript, { config: CONFIG });

    console.log(fromAddress);

    const toScript = helpers.parseAddress(options.to);
    const toAddress = helpers.encodeToAddress(toScript, { config: CONFIG });

    console.log(toAddress);

    // find spore cells
    // <<
    const spore_collect = indexer.collector({
      lock: fromScript,
      type: sporeTS,
    });
    const inputs_spore: Cell[] = [];
    let spore_sumCapacity = BI.from(0);
    for await (const cell of spore_collect.collect()) {
      inputs_spore.push(cell);
      spore_sumCapacity = spore_sumCapacity.add(cell.cellOutput.capacity);
    }
    if (inputs_spore.length <= 0) {
      throw new Error("Not find spore");
    }
    // >>

    let output_sumCapacity = BI.from(0);
    const spore_inputCellOutput: {
      capacity: string;
      lock: Script;
      type?: Script;
    }[] = [];
    for (let i = 0; i < inputs_spore.length; i++) {
      const input = inputs_spore[i];
      const inputCellOutput = input.cellOutput;
      input.cellOutput = {
        capacity: inputCellOutput.capacity,
        lock: toScript,
        type: inputCellOutput.type,
      };
      spore_inputCellOutput.push(inputCellOutput);
      txSkeleton = await commons.common.setupInputCell(
        txSkeleton,
        input,
        undefined,
        { config: CONFIG }
      );
      output_sumCapacity = output_sumCapacity.add(input.cellOutput.capacity);
    }
    const sporeCoBuild = generateSporeCoBuild(
      inputs_spore,
      spore_inputCellOutput
    );

    const minEmptyCapacity = calculateEmptyCellMinCapacity(fromScript);
    const needCapacity = output_sumCapacity
      .sub(spore_sumCapacity)
      .add(minEmptyCapacity)
      .add(2000); // fee

    // find ckb
    // <<
    const collect_ckb = indexer.collector({
      lock: {
        script: fromScript,
        searchMode: "exact",
      },
      type: "empty",
    });
    const inputs_ckb: Cell[] = [];
    let ckb_sum = BI.from(0);
    for await (const collect of collect_ckb.collect()) {
      inputs_ckb.push(collect);
      ckb_sum = ckb_sum.add(collect.cellOutput.capacity);
      if (ckb_sum.gte(needCapacity)) {
        break;
      }
    }
    // >>
    if (ckb_sum.lt(needCapacity)) {
      throw new Error("No enough capacity");
    }
    for (let i = 0; i < inputs_ckb.length; i++) {
      const element = inputs_ckb[i];
      element.cellOutput.capacity = "0x0";
      txSkeleton = await commons.common.setupInputCell(txSkeleton, element);
    }
    const ckb_change = ckb_sum.sub(needCapacity);
    if (ckb_change.gt(0)) {
      const output_ckb_change: Cell = {
        cellOutput: {
          lock: fromScript,
          capacity: ckb_change.toHexString(),
        },
        data: "0x",
      };
      txSkeleton = txSkeleton.update("outputs", (outputs) =>
        outputs.push(output_ckb_change)
      );
    }

    txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
      witnesses.push(sporeCoBuild)
    );
    return txSkeleton;
  }

  // build sudt and xudt transfer
  async sudt_xudt_buildTransfer(options: ckb_TransferOptions) {
    let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });

    const sudtToken = options.typeScript;
    if (!sudtToken) {
      throw new Error("No sudt or xudt type script");
    }

    let isXUDT = false;
    const xudtScript = getXudtTypeScript(getEnv() === "Mainnet");
    if (sudtToken.codeHash == xudtScript.codeHash) {
      isXUDT = true;
    }
    console.log("script is xudt", isXUDT);

    const fromScript = helpers.parseAddress(options.from);
    const fromAddress = helpers.encodeToAddress(fromScript, { config: CONFIG });

    console.log(fromAddress);

    const toScript = helpers.parseAddress(options.to);
    const toAddress = helpers.encodeToAddress(toScript, { config: CONFIG });

    console.log(toAddress);

    // const sudt_from = await this.sudtBalance(fromAddress, sudtToken);
    // const sudt_to = await this.sudtBalance(toAddress, sudtToken);

    // const ckb_from = await this.capacityOf(fromAddress);

    // console.log(sudt_from.toString(), sudt_to.toString(), ckb_from.toString());

    // let sudt_cellDeps = helpers.locateCellDep(sudtToken);
    // if (sudt_cellDeps == null) {
    // }

    let sudt_cellDeps: CellDep;
    if (isXUDT) {
      sudt_cellDeps = getXudtDep(isMainnet);
    } else {
      sudt_cellDeps = getSudtDep(isMainnet);
    }

    txSkeleton = addCellDep(txSkeleton, sudt_cellDeps!!);

    // find sudt
    // <<
    const collect_sudt = indexer.collector({
      lock: {
        script: fromScript,
        searchMode: "exact",
      },
      type: {
        script: sudtToken,
        searchMode: "exact",
      },
    });
    const inputs_sudt: Cell[] = [];
    let sudt_sumCapacity = BI.from(0);
    let sudt_sumAmount = BI.from(0);

    for await (const collect of collect_sudt.collect()) {
      inputs_sudt.push(collect);

      sudt_sumCapacity = sudt_sumCapacity.add(collect.cellOutput.capacity);
      let addNum: BI | undefined = undefined;
      try {
        addNum = number.Uint128LE.unpack(collect.data);
      } catch (error: any) {
        console.warn(error.message);
      }

      if (addNum) {
        sudt_sumAmount = sudt_sumAmount.add(addNum);

        if (sudt_sumAmount.gte(options.amount)) {
          break;
        }
      }
    }
    // >>
    if (sudt_sumAmount.lt(options.amount)) {
      throw new Error("Not enough sudt amount");
    }

    for (let i = 0; i < inputs_sudt.length; i++) {
      const input = inputs_sudt[i];
      input.cellOutput.capacity = "0x0";
      txSkeleton = await commons.common.setupInputCell(txSkeleton, input);
    }

    let outputCapacity = BI.from(0);

    const outputData = number.Uint128LE.pack(options.amount);
    const newOutputData = outputData;

    const outputs_sudt: Cell = {
      cellOutput: {
        capacity: "0x0",
        lock: toScript,
        type: options.typeScript,
      },
      data: bytes.hexify(newOutputData),
    };
    const outputs_sudt_capacity = BI.from(
      helpers.minimalCellCapacity(outputs_sudt)
    );
    outputs_sudt.cellOutput.capacity = outputs_sudt_capacity.toHexString();
    outputCapacity = outputCapacity.add(outputs_sudt_capacity);

    const change_amount = sudt_sumAmount.sub(options.amount);
    if (change_amount.gt(0)) {
      const changeData = number.Uint128LE.pack(change_amount);
      const newChangeData = changeData;

      const outputs_sudt_change: Cell = {
        cellOutput: {
          capacity: "0x0",
          lock: fromScript,
          type: options.typeScript,
        },
        data: bytes.hexify(newChangeData),
      };
      const outputs_sudt_change_capacity = BI.from(
        helpers.minimalCellCapacity(outputs_sudt_change)
      );
      outputs_sudt_change.cellOutput.capacity =
        outputs_sudt_change_capacity.toHexString();

      outputCapacity = outputCapacity.add(outputs_sudt_change_capacity);

      txSkeleton = txSkeleton.update("outputs", (outputs) =>
        outputs.push(outputs_sudt, outputs_sudt_change)
      );
    } else {
      txSkeleton = txSkeleton.update("outputs", (outputs) =>
        outputs.push(outputs_sudt)
      );
    }

    const minEmptyCapacity = calculateEmptyCellMinCapacity(fromScript);
    const needCapacity = outputCapacity
      .sub(sudt_sumCapacity)
      .add(minEmptyCapacity)
      .add(2000); // fee

    // find ckb
    // <<
    const collect_ckb = indexer.collector({
      lock: {
        script: fromScript,
        searchMode: "exact",
      },
      type: "empty",
    });
    const inputs_ckb: Cell[] = [];
    let ckb_sum = BI.from(0);
    for await (const collect of collect_ckb.collect()) {
      inputs_ckb.push(collect);
      ckb_sum = ckb_sum.add(collect.cellOutput.capacity);
      if (ckb_sum.gte(needCapacity)) {
        break;
      }
    }
    // >>
    if (ckb_sum.lt(needCapacity)) {
      throw new Error("No enough capacity");
    }
    for (let i = 0; i < inputs_ckb.length; i++) {
      const element = inputs_ckb[i];
      element.cellOutput.capacity = "0x0";
      txSkeleton = await commons.common.setupInputCell(txSkeleton, element);
    }
    const ckb_change = ckb_sum.sub(needCapacity);
    if (ckb_change.gt(0)) {
      const output_ckb_change: Cell = {
        cellOutput: {
          lock: fromScript,
          capacity: ckb_change.toHexString(),
        },
        data: "0x",
      };
      txSkeleton = txSkeleton.update("outputs", (outputs) =>
        outputs.push(output_ckb_change)
      );
    }

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
      type: "empty",
    });
    let balance = BI.from(0);
    for await (const cell of collector.collect()) {
      balance = balance.add(cell.cellOutput.capacity);
    }
    return balance;
  }

  // sudt balance
  async sudtBalance(address: string, typeScript: Script) {
    const collector = indexer.collector({
      lock: helpers.parseAddress(address),
      type: typeScript,
      scriptSearchMode: "exact",
    });
    let balance = BI.from(0);
    for await (const cell of collector.collect()) {
      balance = balance.add(number.Uint128LE.unpack(cell.data));
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

  // udt balance
  async getUdtBalance(address: string) {
    const lock = helpers.parseAddress(address);

    const sudtType = getSudtTypeScript(getEnv() === "Mainnet");

    const xudtType = getXudtTypeScript(getEnv() === "Mainnet");

    const sudtCellList: Cell[] = [];

    const xudtCellList: Cell[] = [];

    const sudtUtxoCollector = indexer.collector({
      lock,
      type: {
        script: {
          codeHash: sudtType.codeHash,
          hashType: sudtType.hashType,
          args: "0x",
        },
        searchMode: "prefix",
      },
    });

    const xudtUtxoCollector = indexer.collector({
      lock,
      type: {
        script: {
          codeHash: xudtType.codeHash,
          hashType: xudtType.hashType,
          args: "0x",
        },
        searchMode: "prefix",
      },
    });

    for await (const sudt_cell of sudtUtxoCollector.collect()) {
      sudtCellList.push(sudt_cell);
    }

    for await (const xudt_cell of xudtUtxoCollector.collect()) {
      xudtCellList.push(xudt_cell);
    }

    const udtMap: { [key: string]: UdtInfo } = {};

    for (let i = 0; i < sudtCellList.length; i++) {
      const sudtCell = sudtCellList[i];
      if (sudtCell.cellOutput.type) {
        const typeScriptHex = bytes.hexify(
          blockchain.Script.pack(sudtCell.cellOutput.type)
        );
        if (!udtMap[typeScriptHex]) {
          udtMap[typeScriptHex] = {
            type: "sudt",
            typeScriptHex: typeScriptHex,
            balance: BI.from(0),
          };
        }

        let addNum: BI | undefined = undefined;
        try {
          addNum = number.Uint128LE.unpack(sudtCell.data);
        } catch (error: any) {
          console.warn(error.message);
        }

        if (addNum)
          udtMap[typeScriptHex].balance =
            udtMap[typeScriptHex].balance.add(addNum);
      }
    }

    for (let i = 0; i < xudtCellList.length; i++) {
      const xudtCell = xudtCellList[i];
      if (xudtCell.cellOutput.type) {
        const typeScriptHex = bytes.hexify(
          blockchain.Script.pack(xudtCell.cellOutput.type)
        );
        if (!udtMap[typeScriptHex]) {
          udtMap[typeScriptHex] = {
            type: "xudt",
            typeScriptHex: typeScriptHex,
            balance: BI.from(0),
          };
        }

        let addNum: BI | undefined = undefined;
        try {
          addNum = number.Uint128LE.unpack(xudtCell.data);
        } catch (error: any) {
          console.warn(error.message);
        }

        if (addNum)
          udtMap[typeScriptHex].balance = udtMap[typeScriptHex].balance.add(
            number.Uint128LE.unpack(xudtCell.data)
          );
      }
    }

    return udtMap;
  }

  // spore
  async getSpore(address: string) {
    const lock = helpers.parseAddress(address);

    const sporeType = getSporeTypeScript(getEnv() === "Mainnet");

    const sporeCellList: Cell[] = [];

    const sporeCollector = indexer.collector({
      lock,
      type: {
        script: {
          codeHash: sporeType.codeHash,
          hashType: sporeType.hashType,
          args: "0x",
        },
        searchMode: "prefix",
      },
    });

    for await (const sporeCell of sporeCollector.collect()) {
      sporeCellList.push(sporeCell);
    }

    return sporeCellList;
  }

  // transactions
  async getTx(address: string, page: number = 0) {
    //https://mainnet-api.explorer.nervos.org/api/v1/address_transactions/${address}?page=1&page_size=10&sort=time.desc
    const rs = await superagent
      .post(`${backend}/api/explore`)
      .set("Content-Type", "application/json")
      .send({
        req: `https://${ckb_explorer_api}/api/v1/address_transactions/${address}?page=${
          page + 1
        }&page_size=10&sort=time.desc`,
      })
      .catch((err) => {
        console.error(err);
      });

    if (rs && rs.status == 200) {
      return JSON.parse(rs.text);
    }
  }

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

  async getAddressInfo(address: string): Promise<ckb_AddressInfo | undefined> {
    const result = await this.sendExploreApi(
      `https://${ckb_explorer_api}/api/v1/suggest_queries?q=${address}`
    );
    return result;
  }

  async getUDTInfo(type_hash: string) {
    const result = await this.sendExploreApi(
      `https://${ckb_explorer_api}/api/v1/udts/${type_hash}`
    );
    return result;
  }

  async getAddress(address: string) {
    const result = await this.sendExploreApi(
      `https://${ckb_explorer_api}/api/v1/addresses?q=${address}`
    );
    return result;
  }

  async getXudtAndSpore(address: string) {
    const xudtTypeScript = getXudtTypeScript(getEnv() === "Mainnet");
    const sporeTypeScript = getSporeTypeScript(getEnv() === "Mainnet");

    const xudt_collector = indexer.collector({
      lock: helpers.parseAddress(address),
      type: {
        script: {
          codeHash: xudtTypeScript.codeHash,
          hashType: xudtTypeScript.hashType,
          args: "0x",
        },
        searchMode: "prefix",
      },
    });

    const spore_collector = indexer.collector({
      lock: helpers.parseAddress(address),
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
            udt_type: "xudt",
            type_script: xudtCell.cellOutput.type,
          };

          xudtMap[typeHash] = ckbUDTInfo;
          xudtList.push(ckbUDTInfo);
        }

        let addNum: BI | undefined = undefined;
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

  async withDrawXUDT(sudtToken: Script, currentAccount: string) {
    let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });

    let isXUDT = false;
    const xudtScript = getXudtTypeScript(getEnv() === "Mainnet");
    if (sudtToken.codeHash == xudtScript.codeHash) {
      isXUDT = true;
    }
    console.log("script is xudt", isXUDT);

    let sudt_cellDeps: CellDep;
    if (isXUDT) {
      sudt_cellDeps = getXudtDep(isMainnet);
    } else {
      sudt_cellDeps = getSudtDep(isMainnet);
    }

    txSkeleton = addCellDep(txSkeleton, sudt_cellDeps!!);

    const wallets = store.getState().wallet.wallets;
    const wallet = wallets.find((wallet) => wallet.address === currentAccount);
    if (!currentAccount) {
      throw new Error("Please choose a wallet");
    }

    if (!wallet) {
      throw new Error("Please choose a wallet");
    }

    const collect_sudt = indexer.collector({
      lock: {
        script: helpers.parseAddress(wallet.address),
        searchMode: "exact",
      },
      type: {
        script: sudtToken,
        searchMode: "exact",
      },
    });

    for await (const collect of collect_sudt.collect()) {
      collect.cellOutput = {
        lock: collect.cellOutput.lock,
        capacity: BI.from(collect.cellOutput.capacity).sub(1000).toHexString(),
      };

      txSkeleton = await commons.common.setupInputCell(
        txSkeleton,
        collect,
        undefined,
        { config: CONFIG }
      );
    }

    const tx = helpers.createTransactionFromSkeleton(txSkeleton);

    const signed = await signRawTransaction(
      tx as CKBTransaction,
      wallet.address
    );

    const txHash = await this.sendTransaction(signed);
    console.log("withDraw txHash:", txHash);

    return txHash;
  }
}
