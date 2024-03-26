import {
  BI,
  Cell,
  Indexer,
  RPC,
  Script,
  Transaction,
  commons,
  config,
  helpers,
} from "@ckb-lumos/lumos";
import { addCellDep } from "@ckb-lumos/common-scripts/lib/helper";
import { ckb_TransferOptions } from "../interface";
import { DataManager } from "../manager/DataManager";
import { CKBTransaction, connect, signRawTransaction } from "@joyid/ckb";
import { createJoyIDScriptInfo } from "./joyid";
import {
  getSporeDep,
  getSporeTypeScript,
  getSudtTypeScript,
  getXudtTypeScript,
} from "./constants";
import { number, bytes } from "@ckb-lumos/codec";
import { calculateEmptyCellMinCapacity, generateSporeCoBuild } from "../utils";

export const CONFIG = config.predefined.AGGRON4;
config.initializeConfig(CONFIG);

const CKB_RPC_URL = "https://testnet.ckb.dev";
const CKB_INDEX_URL = "https://testnet.ckb.dev";

const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_INDEX_URL, CKB_RPC_URL);

const isMainnet = false;

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

  // transfer spore
  async transfer_spore(options: ckb_TransferOptions) {
    const unsigned = await this.buildTransfer(options);
    const tx = helpers.createTransactionFromSkeleton(unsigned);

    if (DataManager.instance.curWalletType == "joyid") {
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
    const xudtScript = getXudtTypeScript(isMainnet);
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

    const sudt_cellDeps = helpers.locateCellDep(sudtToken);
    if (sudt_cellDeps == null) {
      throw new Error("No sudt cell deps");
    }

    txSkeleton = addCellDep(txSkeleton, sudt_cellDeps);

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
      sudt_sumAmount = sudt_sumAmount.add(
        number.Uint128LE.unpack(collect.data)
      );

      if (sudt_sumAmount.gte(options.amount)) {
        break;
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

    const outputs_sudt: Cell = {
      cellOutput: {
        capacity: "0x0",
        lock: toScript,
        type: options.typeScript,
      },
      data: bytes.hexify(number.Uint128LE.pack(options.amount)),
    };
    const outputs_sudt_capacity = BI.from(
      helpers.minimalCellCapacity(outputs_sudt)
    );
    outputs_sudt.cellOutput.capacity = outputs_sudt_capacity.toHexString();
    outputCapacity = outputCapacity.add(outputs_sudt_capacity);

    const change_amount = sudt_sumAmount.sub(options.amount);
    if (change_amount.gt(0)) {
      const outputs_sudt_change: Cell = {
        cellOutput: {
          capacity: "0x0",
          lock: fromScript,
          type: options.typeScript,
        },
        data: bytes.hexify(number.Uint128LE.pack(change_amount)),
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
}
