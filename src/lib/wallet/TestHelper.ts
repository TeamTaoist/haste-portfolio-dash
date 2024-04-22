import {
  getTransactionSize,
  serializeScript,
} from "@nervosnetwork/ckb-sdk-utils";
import {
  DataSource,
  ErrorCodes,
  InitOutput,
  NetworkType,
  SendUtxosProps,
  TxAddressOutput,
  TxBuildError,
  TxBuilder,
  Utxo,
  bitcoin,
  createSendUtxosBuilder,
  networkTypeToConfig,
} from "@rgbpp-sdk/btc";
import {
  BtcTransferVirtualTxParams,
  BtcTransferVirtualTxResult,
  Collector,
  Hex,
  IndexerCell,
  NoRgbppLiveCellError,
  RGBPP_WITNESS_PLACEHOLDER,
  RgbppCkbVirtualTx,
  TypeAssetNotSupportedError,
  append0x,
  buildRgbppLockArgs,
  calculateCommitment,
  calculateTransactionFee,
  getRgbppLockConfigDep,
  getRgbppLockDep,
  getSecp256k1CellDep,
  getXudtDep,
  isBtcTimeLockCell,
  isRgbppLockCell,
  compareInputs,
  getSporeTypeDep,
  RGBPP_TX_WITNESS_MAX_SIZE,
  TransferSporeCkbVirtualTxParams,
  SporeTransferVirtualTxResult,
  getRgbppLockScript,
  RgbppUtxoBindMultiSporesError,
} from "@rgbpp-sdk/ckb";
import { BtcAssetsApi } from "@rgbpp-sdk/service";
import { unpackRgbppLockArgs } from "@rgbpp-sdk/btc/lib/ckb/molecule";
import { accountStore } from "@/store/AccountStore";
import { BtcHepler } from "./BtcHelper";
import * as btcSigner from "@scure/btc-signer";
import superagent from "superagent";
import {
  buildPreLockArgs,
  calculateRgbppCellCapacity,
  estimateWitnessSize,
  genRgbppLockScript,
  generateSporeTransferCoBuild,
  isTypeAssetSupported,
  throwErrorWhenTxInputsExceeded,
  u128ToLe,
} from "@rgbpp-sdk/ckb/lib/utils";
import { blockchain } from "@ckb-lumos/base";


const DEFAULT_WITNESS_ADDR = 'tb1pq2x0qvl0qejrxdxnlmm43zdt8cvda4dcwcespdwcw96v6xnd3veqzgdm0m'; // The address of the witness, which is used to receive service fee.
const DEFAULT_WITNESS_PUBKEY = 'c56d5c3cdc4c28aa383271d56a6ac3e06cc2ebe7a626ef3c5c54dd66cfe45c1a'; // The pubkey of the witness.

export class TestHelper {
  private static _instance: TestHelper;
  private constructor() {}

  public static get instance() {
    if (!TestHelper._instance) {
      TestHelper._instance = new TestHelper();
    }
    return this._instance;
  }

  async createListPsbt(params: {
    isTestnet: boolean;
    rgbpp_txHash: string;
    rgbpp_txIdx: number;
    price: number; // sat
    fromAddress: string;
    fromPubkey: string;
    witnessAddr: string;
    witnessPubkey: string;
  }) {
    const cfg = networkTypeToConfig(
      params.isTestnet ? NetworkType.TESTNET : NetworkType.MAINNET
    );
    console.log("====== create list psbt", cfg);

    const networkType = !params.isTestnet
      ? NetworkType.MAINNET
      : NetworkType.TESTNET;
    //需要替换成自己的配置
    // <<
    const service = BtcAssetsApi.fromToken(
      //BTC_ASSETS_API_URL
      "https://btc-assets-api.testnet.mibao.pro",
      // BTC_ASSETS_TOKEN
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzb3VsLXRlc3QtYXBwIiwiYXVkIjoibG9jYWxob3N0IiwiaWF0IjoxNzExNTM0OTMxfQ.NAhr_3Aro90wLwKOYvnjMme_YslZspRmf5GzBvxw3FU",
      // BTC_ASSETS_ORGIN
      "localhost"
    );
    // >>
    const source = new DataSource(service, networkType);

    const utxo = await source.getUtxo(params.rgbpp_txHash, params.rgbpp_txIdx);
    if (!utxo) {
      throw TxBuildError.withComment(
        ErrorCodes.CANNOT_FIND_UTXO,
        `hash: ${params.rgbpp_txHash}, index: ${params.rgbpp_txIdx}`
      );
    }
    if (utxo.address !== params.fromAddress) {
      throw TxBuildError.withComment(
        ErrorCodes.REFERENCED_UNPROVABLE_UTXO,
        `hash: ${params.rgbpp_txHash}, index: ${params.rgbpp_txIdx}`
      );
    }

    // const config = networkTypeToConfig(source.networkType);
    // const minUtxoSatoshi = config.rgbppUtxoDustLimit;

    const { builder } = await this.dex_createSendUtxosBuilder(
      {
        inputs: [
          {
            ...utxo,
            txid: "0000000000000000000000000000000000000000000000000000000000000001",
            vout: 0,
            value: 0,
            address: params.witnessAddr,
            pubkey: params.witnessPubkey,
          },
          {
            ...utxo,
            pubkey: params.fromPubkey,
          },
        ],
        outputs: [
          {
            data: Buffer.from("0x" + "00".repeat(32), "hex"), // RGBPP commitment
            value: 0,
            fixed: true, // mark as fixed, so the output.value will not be changed
          },
          {
            address: params.fromAddress,
            value: params.price,
            fixed: true,
            minUtxoSatoshi: params.price,
          },
        ],
        from: params.fromAddress,
        fromPubkey: params.fromPubkey,
        changeAddress: params.fromAddress,
        feeRate: 1,
        source,
        minUtxoSatoshi: 0,
      },
      false
    );
    const psbt = builder.toPsbt();
    psbt.updateInput(1, {
      sighashType: btcSigner.SigHash.SINGLE_ANYONECANPAY,
    });

    console.log("======", psbt);

    return psbt;
  }

  async createBuyPsbt(params: {
    isTestnet: boolean;
    psbtHex: string;
    buyAddress: string;
    buyPubKey: string;
    itemType:string; // spore or xudt
    script: CKBComponents.Script;
  }) {
    //需要替换成自己的配置
    // <<
    const collector = new Collector({
      ckbNodeUrl: params.isTestnet
        ? "https://testnet.ckb.dev/rpc"
        : "https://mainnet.ckbapp.dev",
      ckbIndexerUrl: params.isTestnet
        ? "https://testnet.ckb.dev/indexer"
        : "https://mainnet.ckbapp.dev/indexer",
    });
    // >>
    const isMainnet = params.isTestnet ? false : true;

    const cfg = networkTypeToConfig(
      params.isTestnet ? NetworkType.TESTNET : NetworkType.MAINNET
    );

    const salePsbt = bitcoin.Psbt.fromHex(params.psbtHex, {
      network: cfg.network,
    });

    const txHash = Buffer.from(salePsbt.txInputs[1].hash.reverse()).toString(
      "hex"
    );
    const sporeRgbppLockArgs = buildRgbppLockArgs(
      salePsbt.txInputs[1].index,
      txHash
    );

    console.log("=====", salePsbt.txInputs[1].index, txHash, salePsbt);

    const networkType = isMainnet ? NetworkType.MAINNET : NetworkType.TESTNET;
    //需要替换成自己的配置
    // <<
    const service = BtcAssetsApi.fromToken(
      //BTC_ASSETS_API_URL
      "https://btc-assets-api.testnet.mibao.pro",
      // BTC_ASSETS_TOKEN
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzb3VsLXRlc3QtYXBwIiwiYXVkIjoibG9jYWxob3N0IiwiaWF0IjoxNzExNTM0OTMxfQ.NAhr_3Aro90wLwKOYvnjMme_YslZspRmf5GzBvxw3FU",
      // BTC_ASSETS_ORGIN
      "localhost"
    );
    // >>
    const source = new DataSource(service, networkType);

    // TODO: 需要替换成spore的，目前使用xudt测试
    //<<

    let ckbVirtualTxResult:BtcTransferVirtualTxResult;

    if (params.itemType === "spore") {
      const sporeTypeBytes = serializeScript(params.script);
      ckbVirtualTxResult = await this.dex_genTransferSporeCkbVirtualTx({
        collector,
        sporeRgbppLockArgs,
        sporeTypeBytes,
        isMainnet,
      });
    } else if (params.itemType === "xudt") {
      const sporeTypeBytes = serializeScript(params.script);
      ckbVirtualTxResult = await this.dex_genBtcTransferCkbVirtualTx({
        collector,
        rgbppLockArgsList: [sporeRgbppLockArgs],
        xudtTypeBytes: sporeTypeBytes,
        transferAmount: BigInt(10000), // [TODO] why 10000 ????
        isMainnet,
      });
    } else {
      throw new Error("Unknown item type");
    }
    

    const { commitment, ckbRawTx } = ckbVirtualTxResult;

    // Send BTC tx
    const psbt = await this.dex_sendRgbppUtxosBuilder({
      isTestnet: params.isTestnet,

      ckbVirtualTx: ckbRawTx,
      commitment,
      ckbCollector: collector,
      source,

      psbtHex: params.psbtHex,

      buyerAddr: params.buyAddress,
      buyerPubkey: params.buyPubKey,
    });
    // >>

    return { psbt, ckbVirtualTxResult };
  }

  dex_genTransferSporeCkbVirtualTx = async ({
    collector,
    sporeRgbppLockArgs,
    sporeTypeBytes,
    isMainnet,
    witnessLockPlaceholderSize,
    ckbFeeRate,
  }: TransferSporeCkbVirtualTxParams): Promise<SporeTransferVirtualTxResult> => {
    const sporeRgbppLock = {
      ...getRgbppLockScript(isMainnet),
      args: append0x(sporeRgbppLockArgs),
    };
    const sporeCells = await collector.getCells({
      lock: sporeRgbppLock,
      isDataEmpty: false,
    });
    if (!sporeCells || sporeCells.length === 0) {
      throw new NoRgbppLiveCellError(
        "No spore rgbpp cells found with the spore rgbpp lock args"
      );
    }
    if (sporeCells.length > 1) {
      throw new RgbppUtxoBindMultiSporesError(
        "The UTXO is bound to multiple spores"
      );
    }
    const sporeCell = sporeCells[0];

    if (!sporeCell.output.type) {
      throw new RgbppUtxoBindMultiSporesError(
        "The cell with the rgbpp lock args has no spore asset"
      );
    }

    if (
      append0x(serializeScript(sporeCell.output.type)) !==
      append0x(sporeTypeBytes)
    ) {
      throw new RgbppUtxoBindMultiSporesError(
        "The cell type with the rgbpp lock args does not match"
      );
    }

    const inputs: CKBComponents.CellInput[] = [
      {
        previousOutput: sporeCell.outPoint,
        since: "0x0",
      },
    ];

    const outputs: CKBComponents.CellOutput[] = [
      {
        ...sporeCell.output,
        // The BTC transaction Vouts[0] for OP_RETURN, Vouts[1] for spore
        lock: genRgbppLockScript(buildPreLockArgs(2), isMainnet),
      },
    ];
    const outputsData: Hex[] = [sporeCell.outputData];
    const cellDeps = [
      getRgbppLockDep(isMainnet),
      getRgbppLockConfigDep(isMainnet),
      getSporeTypeDep(isMainnet),
    ];
    const sporeCoBuild = generateSporeTransferCoBuild(sporeCell, outputs[0]);
    const witnesses = [RGBPP_WITNESS_PLACEHOLDER, sporeCoBuild];

    const ckbRawTx: CKBComponents.RawTransaction = {
      version: "0x0",
      cellDeps,
      headerDeps: [],
      inputs,
      outputs,
      outputsData,
      witnesses,
    };

    let changeCapacity = BigInt(sporeCell.output.capacity);
    const txSize =
      getTransactionSize(ckbRawTx) +
      (witnessLockPlaceholderSize ?? RGBPP_TX_WITNESS_MAX_SIZE);
    const estimatedTxFee = calculateTransactionFee(txSize, ckbFeeRate);
    changeCapacity -= estimatedTxFee;

    ckbRawTx.outputs[ckbRawTx.outputs.length - 1].capacity = append0x(
      changeCapacity.toString(16)
    );

    const virtualTx: RgbppCkbVirtualTx = {
      ...ckbRawTx,
    };
    const commitment = calculateCommitment(virtualTx);

    return {
      ckbRawTx,
      commitment,
      sporeCell,
      needPaymasterCell: false,
      sumInputsCapacity: sporeCell.output.capacity,
    };
  };

  dex_genBtcTransferCkbVirtualTx = async ({
    collector,
    xudtTypeBytes,
    rgbppLockArgsList,
    transferAmount,
    isMainnet,
    noMergeOutputCells,
    witnessLockPlaceholderSize,
    ckbFeeRate,
  }: BtcTransferVirtualTxParams): Promise<BtcTransferVirtualTxResult> => {
    const xudtType = blockchain.Script.unpack(
      xudtTypeBytes
    ) as CKBComponents.Script;

    if (!isTypeAssetSupported(xudtType, isMainnet)) {
      throw new TypeAssetNotSupportedError(
        "The type script asset is not supported now"
      );
    }

    const rgbppLocks = rgbppLockArgsList.map((args) =>
      genRgbppLockScript(args, isMainnet)
    );
    let rgbppCells: IndexerCell[] = [];
    for await (const rgbppLock of rgbppLocks) {
      const cells = await collector.getCells({
        lock: rgbppLock,
        type: xudtType,
      });
      if (!cells || cells.length === 0) {
        throw new NoRgbppLiveCellError(
          "No rgbpp cells found with the xudt type script and the rgbpp lock args"
        );
      }
      rgbppCells = [...rgbppCells, ...cells];
    }
    rgbppCells = rgbppCells.sort(compareInputs);

    let inputs: CKBComponents.CellInput[] = [];
    let sumInputsCapacity = BigInt(0);
    const outputs: CKBComponents.CellOutput[] = [];
    const outputsData: Hex[] = [];
    let changeCapacity = BigInt(0);

    if (noMergeOutputCells) {
      for (const [index, rgbppCell] of rgbppCells.entries()) {
        inputs.push({
          previousOutput: rgbppCell.outPoint,
          since: "0x0",
        });
        sumInputsCapacity += BigInt(rgbppCell.output.capacity);
        outputs.push({
          ...rgbppCell.output,
          // The Vouts[0] for OP_RETURN and Vouts[1], Vouts[2], ... for RGBPP assets
          lock: genRgbppLockScript(buildPreLockArgs(index + 1), isMainnet),
        });
        outputsData.push(rgbppCell.outputData);
      }
      changeCapacity = BigInt(
        rgbppCells[rgbppCells.length - 1].output.capacity
      );
    } else {
      const collectResult = collector.collectUdtInputs({
        liveCells: rgbppCells,
        needAmount: transferAmount,
      });
      inputs = collectResult.inputs;

      throwErrorWhenTxInputsExceeded(inputs.length);

      sumInputsCapacity = collectResult.sumInputsCapacity;

      rgbppCells = rgbppCells.slice(0, inputs.length);

      const rpbppCellCapacity = calculateRgbppCellCapacity(xudtType);
      outputsData.push(append0x(u128ToLe(transferAmount)));

      changeCapacity = sumInputsCapacity;
      // The Vouts[0] for OP_RETURN and Vouts[1], Vouts[2], ... for RGBPP assets
      outputs.push({
        lock: genRgbppLockScript(buildPreLockArgs(2), isMainnet),
        type: xudtType,
        capacity: append0x(rpbppCellCapacity.toString(16)),
      });
      if (collectResult.sumAmount > transferAmount) {
        outputs.push({
          lock: genRgbppLockScript(buildPreLockArgs(3), isMainnet),
          type: xudtType,
          capacity: append0x(rpbppCellCapacity.toString(16)),
        });
        outputsData.push(
          append0x(u128ToLe(collectResult.sumAmount - transferAmount))
        );
        changeCapacity -= rpbppCellCapacity;
      }
    }

    const cellDeps = [
      getRgbppLockDep(isMainnet),
      getXudtDep(isMainnet),
      getRgbppLockConfigDep(isMainnet),
    ];
    const needPaymasterCell = inputs.length < outputs.length;
    if (needPaymasterCell) {
      cellDeps.push(getSecp256k1CellDep(isMainnet));
    }
    const witnesses: Hex[] = [];
    const lockArgsSet: Set<string> = new Set();
    for (const cell of rgbppCells) {
      if (lockArgsSet.has(cell.output.lock.args)) {
        witnesses.push("0x");
      } else {
        lockArgsSet.add(cell.output.lock.args);
        witnesses.push(RGBPP_WITNESS_PLACEHOLDER);
      }
    }

    const ckbRawTx: CKBComponents.RawTransaction = {
      version: "0x0",
      cellDeps,
      headerDeps: [],
      inputs,
      outputs,
      outputsData,
      witnesses,
    };

    if (!needPaymasterCell) {
      const txSize =
        getTransactionSize(ckbRawTx) +
        (witnessLockPlaceholderSize ?? estimateWitnessSize(rgbppLockArgsList));
      const estimatedTxFee = calculateTransactionFee(txSize, ckbFeeRate);

      changeCapacity -= estimatedTxFee;
      ckbRawTx.outputs[ckbRawTx.outputs.length - 1].capacity = append0x(
        changeCapacity.toString(16)
      );
    }

    const virtualTx: RgbppCkbVirtualTx = {
      ...ckbRawTx,
    };
    const commitment = calculateCommitment(virtualTx);

    return {
      ckbRawTx,
      commitment,
      needPaymasterCell,
      sumInputsCapacity: append0x(sumInputsCapacity.toString(16)),
    };
  };

  async dex_sendRgbppUtxosBuilder(props: {
    isTestnet: boolean;
    ckbVirtualTx: CKBComponents.RawTransaction;
    commitment: string;
    ckbCollector: Collector;
    source: DataSource;
    psbtHex: string;
    buyerAddr: string;
    buyerPubkey: string;
    feeRate?: number;
  }) {
    const cfg = networkTypeToConfig(
      props.isTestnet ? NetworkType.TESTNET : NetworkType.MAINNET
    );

    const salePsbt = bitcoin.Psbt.fromHex(props.psbtHex, {
      network: cfg.network,
    });
    console.log("========== sale psbt", salePsbt);

    const saleAddress = salePsbt.txOutputs[1].address;

    const btcInputs: Utxo[] = [];
    const btcOutputs: TxAddressOutput[] = [];
    let lastCkbTypeOutputIndex = -1;

    const ckbVirtualTx = props.ckbVirtualTx;
    const config = networkTypeToConfig(props.source.networkType);
    const isCkbMainnet = props.source.networkType === NetworkType.MAINNET;

    // Handle and check inputs
    for (let i = 0; i < ckbVirtualTx.inputs.length; i++) {
      const ckbInput = ckbVirtualTx.inputs[i];

      const ckbLiveCell = await props.ckbCollector.getLiveCell(
        ckbInput.previousOutput!
      );
      const isRgbppLock = isRgbppLockCell(ckbLiveCell.output, isCkbMainnet);

      // If input.lock == RgbppLock, add to inputs if:
      // 1. input.lock.args can be unpacked to RgbppLockArgs
      // 2. utxo can be found via the DataSource.getUtxo() API
      // 3. utxo.scriptPk == addressToScriptPk(props.from)
      // 4. utxo is not duplicated in the inputs
      if (isRgbppLock) {
        const args = unpackRgbppLockArgs(ckbLiveCell.output.lock.args);
        const utxo = await props.source.getUtxo(args.btcTxid, args.outIndex);
        if (!utxo) {
          throw TxBuildError.withComment(
            ErrorCodes.CANNOT_FIND_UTXO,
            `hash: ${args.btcTxid}, index: ${args.outIndex}`
          );
        }
        if (utxo.address !== saleAddress) {
          throw TxBuildError.withComment(
            ErrorCodes.REFERENCED_UNPROVABLE_UTXO,
            `hash: ${args.btcTxid}, index: ${args.outIndex}`
          );
        }

        const foundInInputs = btcInputs.some(
          (v) => v.txid === utxo.txid && v.vout === utxo.vout
        );
        if (foundInInputs) {
          continue;
        }

        btcInputs.push({
          ...utxo,
          pubkey: props.buyerPubkey, // for pass build tx
        });
      }
    }

    // The inputs.length should be >= 1
    if (btcInputs.length < 1) {
      throw new TxBuildError(ErrorCodes.CKB_INVALID_INPUTS);
    }

    // Handle and check outputs
    // console.log("======== ckbVirtualTx", ckbVirtualTx);
    const toAddress = [props.buyerAddr];
    for (let i = 0; i < ckbVirtualTx.outputs.length; i++) {
      const ckbOutput = ckbVirtualTx.outputs[i];
      const isRgbppLock = isRgbppLockCell(ckbOutput, isCkbMainnet);
      const isBtcTimeLock = isBtcTimeLockCell(ckbOutput, isCkbMainnet);

      // If output.type !== null, then the output.lock must be RgbppLock or RgbppTimeLock
      if (ckbOutput.type) {
        if (!isRgbppLock && !isBtcTimeLock) {
          throw new TxBuildError(ErrorCodes.CKB_INVALID_CELL_LOCK);
        }

        // If output.type !== null，update lastTypeInput
        lastCkbTypeOutputIndex = i;
      }

      // If output.lock == RgbppLock, generate a corresponding output in outputs
      if (isRgbppLock) {
        const toBtcAddress = toAddress[i];
        const minUtxoSatoshi = config.rgbppUtxoDustLimit;
        btcOutputs.push({
          fixed: true,
          address: toBtcAddress ?? saleAddress,
          value: minUtxoSatoshi,
          minUtxoSatoshi,
        });
      }
    }

    // By rules, the length of type outputs should be >= 1
    // The "lastTypeOutputIndex" is -1 by default so if (index < 0) it's invalid
    if (lastCkbTypeOutputIndex < 0) {
      throw new TxBuildError(ErrorCodes.CKB_INVALID_OUTPUTS);
    }

    // Verify the provided commitment
    const calculatedCommitment = calculateCommitment({
      inputs: ckbVirtualTx.inputs,
      outputs: ckbVirtualTx.outputs.slice(0, lastCkbTypeOutputIndex + 1),
      outputsData: ckbVirtualTx.outputsData.slice(
        0,
        lastCkbTypeOutputIndex + 1
      ),
    });
    if (props.commitment !== calculatedCommitment) {
      throw new TxBuildError(ErrorCodes.CKB_UNMATCHED_COMMITMENT);
    }

    const mergedBtcOutputs = (() => {
      const merged: InitOutput[] = [];

      // Add commitment to the beginning of outputs
      merged.push({
        data: props.commitment,
        fixed: true,
        value: 0,
      });

      for (let i = 1; i < salePsbt.txOutputs.length; i++) {
        const output = salePsbt.txOutputs[i];
        merged.push({
          address: output.address,
          script: output.script,
          fixed: true,
          value: output.value,
          minUtxoSatoshi: output.value,
        });
      }

      // Add outputs
      merged.push(...btcOutputs);

      merged.push({
        address: DEFAULT_WITNESS_ADDR,
        value: Math.ceil(salePsbt.txOutputs[1].value * 0.01),
        fixed: true,
        minUtxoSatoshi: Math.ceil(salePsbt.txOutputs[1].value * 0.01),
      });

      return merged;
    })();

    console.log("======== mergedBtcOutputs", mergedBtcOutputs);

    const { builder } = await createSendUtxosBuilder({
      inputs: btcInputs,
      outputs: mergedBtcOutputs,
      from: props.buyerAddr,
      source: props.source,
      feeRate: props.feeRate,
      fromPubkey: props.buyerPubkey,
    });

    const psbt = builder.toPsbt();

    console.log("======== before psbt", psbt, salePsbt);

    // inputs
    salePsbt.data.globalMap.unsignedTx["tx"]["ins"][0] =
      psbt.data.globalMap.unsignedTx["tx"]["ins"][1];
    salePsbt.data.inputs[0] = psbt.data.inputs[1];

    for (let i = 2; i < psbt.txInputs.length; i++) {
      const input = psbt.txInputs[i];

      salePsbt.addInput({
        hash: input.hash,
        index: input.index,
        witnessUtxo: psbt.data.inputs[i].witnessUtxo,
        tapInternalKey: psbt.data.inputs[i].tapInternalKey,
      });
    }

    // outputs
    salePsbt.data.globalMap.unsignedTx["tx"]["outs"][0] =
      psbt.data.globalMap.unsignedTx["tx"]["outs"][0];
    salePsbt.data.outputs[0] = psbt.data.outputs[0];

    salePsbt.data.globalMap.unsignedTx["tx"]["outs"][1] =
      psbt.data.globalMap.unsignedTx["tx"]["outs"][1];
    salePsbt.data.outputs[1] = psbt.data.outputs[1];

    for (let i = 2; i < psbt.txOutputs.length; i++) {
      const output = psbt.txOutputs[i];
      salePsbt.data.addOutput({
        address: output.address as string,
        script: output.script,
        value: output.value,
      });
    }

    console.log("======== after psbt", salePsbt);
    return salePsbt;
  }

  async dex_createSendUtxosBuilder(
    props: SendUtxosProps,
    isPayFee: boolean
  ): Promise<{
    builder: TxBuilder;
    feeRate: number;
    fee: number;
  }> {
    const tx = new TxBuilder({
      source: props.source,
      feeRate: props.feeRate,
      minUtxoSatoshi: props.minUtxoSatoshi,
      onlyConfirmedUtxos: props.onlyConfirmedUtxos,
    });

    tx.addInputs(props.inputs);
    tx.addOutputs(props.outputs);

    if (props.onlyConfirmedUtxos) {
      await tx.validateInputs();
    }

    if (isPayFee) {
      const paid = await tx.payFee({
        address: props.from,
        publicKey: props.fromPubkey,
        changeAddress: props.changeAddress,
      });

      return {
        builder: tx,
        fee: paid.fee,
        feeRate: paid.feeRate,
      };
    } else {
      return {
        builder: tx,
        fee: 0,
        feeRate: 0,
      };
    }
  }
}

export const testListPsbt = async () => {
  //参考例子，需要自行修改逻辑参数
  const curAccount = accountStore.currentAddress;

  const wallet = accountStore.getWallet(curAccount);
  if (!wallet) {
    throw new Error("Please choose a wallet");
  }

  console.log("======", curAccount, "pubkey", wallet.pubkey);

  //<<<< 替换成对应资产的 RGB++ 的 Tx Hash 和 Index
  // const rgbpp_txHash = "9ca82497cf9b24b391058ec01a366bb4a3e47f857f013e239ef1588ca93cd4f8";
  // const rgbpp_txIdx = 1;
  // const sell_price = 100; // 100 sats

  const rgbpp_txHash = "5d4663987b52288f329245400391de89ca0c663802497a90a3ecadae85457adb";
  const rgbpp_txIdx = 41;
  const sell_price = 100; // 100 sats
  //>>>>

  const listPsbt = await TestHelper.instance.createListPsbt({
    isTestnet: true,
    rgbpp_txHash: rgbpp_txHash,
    rgbpp_txIdx: rgbpp_txIdx,
    price: sell_price,
    fromAddress: curAccount as string,
    fromPubkey: wallet.pubkey,
    witnessAddr: DEFAULT_WITNESS_ADDR,
    witnessPubkey: DEFAULT_WITNESS_PUBKEY,
  });

  const psbtHex = await BtcHepler.instance.halfSignPsbt(
    listPsbt.toHex(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wallet.type as any,
    {
      autoFinalized: false,
      toSignInputs: [
        {
          index: 1,
          address: curAccount,
          publicKey: wallet.pubkey,
          sighashTypes: [btcSigner.SigHash.SINGLE_ANYONECANPAY],
        },
      ],
    }
  );

  const cfg = networkTypeToConfig(NetworkType.TESTNET);
  console.log(
    "====== psbtHex",
    psbtHex,
    bitcoin.Psbt.fromHex(psbtHex, { network: cfg.network })
  );
};

export const testBuyPsbt = async () => {
  //参考例子，需要自行修改逻辑参数
  const curAccount = accountStore.currentAddress;

  const wallet = accountStore.getWallet(curAccount);
  if (!wallet) {
    throw new Error("Please choose a wallet");
  }

  //<<<<
  // !!!! 替换上架的xudt
  const xudtTS: CKBComponents.Script =  {
    codeHash:
      "0x25c29dc317811a6f6f3985a7a9ebc4838bd388d19d0feeecf0bcd60f6c0975bb",
    hashType: "type",
    args: "0x6a5a8762fc76d5854e69d8a13611acfede063e77d15e964e3a88660e86cff1af",
  };

  // !!!! 替换上架的spore
  const sporeTS: CKBComponents.Script= {
    args: "",
    codeHash: "",
    hashType: "data1",
  };

  const listItemType = 'xudt'; // !!!! 替换上架的spore
  const listItemScript = xudtTS; // !!!! 替换上架的spore

  // !!!! 替换上架的spore
  const listPsbtHex = '70736274ff010092020000000201000000000000000000000000000000000000000000000000000000000000000000000000ffffffffdb7a4585aeadeca3907a490238660cca89de9103404592328f28527b9863465d2900000000ffffffff020000000000000000026a0064000000000000002251202df68c87d6fcc7a3beace9e367f925e94684a13d4328b4482236a57df5cecdd4000000000001012b00000000000000002251202df68c87d6fcc7a3beace9e367f925e94684a13d4328b4482236a57df5cecdd4011720c56d5c3cdc4c28aa383271d56a6ac3e06cc2ebe7a626ef3c5c54dd66cfe45c1a0001012b22020000000000002251202df68c87d6fcc7a3beace9e367f925e94684a13d4328b4482236a57df5cecdd401030483000000011341083036ea25d8498624bd3e600e48a58e811f324631731e820b91a60b5a3002206083b5633dd9bf6e358aa460f36b6c6fa3ba6f12cfdf40e09e1157ab38bc4f608301172042c287b65e8713512127229ed1bf221dde31b73d0109458f792399e432fb6314000000';
  //>>>>

  const { psbt: buyPsbt, ckbVirtualTxResult } =
    await TestHelper.instance.createBuyPsbt({
      isTestnet: true,
      psbtHex: listPsbtHex, 
      buyAddress: wallet.address,
      buyPubKey: wallet.pubkey,
      itemType: listItemType, 
      script: listItemScript, 
    });

  const signInputList: { index: number; address: string; publicKey: string }[] =
    [];

  for (let i = 0; i < buyPsbt.txInputs.length; i++) {
    if (!buyPsbt.data.inputs[i].tapKeySig) {
      signInputList.push({
        index: i,
        address: curAccount as string,
        publicKey: wallet.pubkey,
      });
    }
  }

  const psbtHex = await BtcHepler.instance.signPsdt(
    buyPsbt.toHex(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wallet.type as any,
    {
      autoFinalized: false,
      toSignInputs: signInputList,
    }
  );

  const cfg = networkTypeToConfig(NetworkType.TESTNET);
  const newPsbt = bitcoin.Psbt.fromHex(psbtHex, { network: cfg.network });

  console.log("====== psbtHex", psbtHex, newPsbt);
  newPsbt.finalizeAllInputs();
  console.log("====== after finalize newPsbt", newPsbt, newPsbt.toHex());

  const btcTx = newPsbt.extractTransaction();

  console.log("======= btc tx is ", btcTx.toHex());

  // const btcTxId = await BtcHepler.instance.pushPsbt(
  //   newPsbt.toHex(),
  //   wallet.type as WalletType
  // );
  // console.log("======= btcTxId", btcTxId);

  // const {
  //   bitcoin: { transactions },
  // } = mempoolJS({
  //   hostname: "mempool.space",
  //   network: "testnet",
  // });

  // const txid = await transactions.postTx({ txhex: btcTx.toHex() });
  // console.log(txid);

  const result = await superagent
    .post(
      // eslint-disable-next-line no-constant-condition
      `https://mempool.space${false ? "" : "/testnet"}/api/tx`
    )
    .send(btcTx.toHex())
    .catch((err) => {
      console.error(err);
    });

  console.log(result);

  let txHash = "";
  if (result && result.status == 200) {
    txHash = result.text;
  }

  //需要替换成自己的配置
  // <<
  const service = BtcAssetsApi.fromToken(
    //BTC_ASSETS_API_URL
    "https://btc-assets-api.testnet.mibao.pro",
    // BTC_ASSETS_TOKEN
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzb3VsLXRlc3QtYXBwIiwiYXVkIjoibG9jYWxob3N0IiwiaWF0IjoxNzExNTM0OTMxfQ.NAhr_3Aro90wLwKOYvnjMme_YslZspRmf5GzBvxw3FU",
    // BTC_ASSETS_ORGIN
    "localhost"
  );
  // >>
  const rgbppState = await service.sendRgbppCkbTransaction({
    btc_txid: txHash as string,
    ckb_virtual_result: ckbVirtualTxResult,
  });
  console.log("rgbppState", rgbppState);
};
