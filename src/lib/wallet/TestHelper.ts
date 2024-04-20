import { serializeScript } from "@nervosnetwork/ckb-sdk-utils";
import {
  DataSource,
  ErrorCodes,
  InitOutput,
  NetworkType,
  TxAddressOutput,
  TxBuildError,
  Utxo,
  bitcoin,
  createSendUtxosBuilder,
  networkTypeToConfig,
  remove0x,
  toXOnly,
} from "@rgbpp-sdk/btc";
import {
  Collector,
  buildRgbppLockArgs,
  calculateCommitment,
  genBtcTransferCkbVirtualTx,
  isBtcTimeLockCell,
  isRgbppLockCell,
} from "@rgbpp-sdk/ckb";
import { BtcAssetsApi } from "@rgbpp-sdk/service";
import { unpackRgbppLockArgs } from "@rgbpp-sdk/btc/lib/ckb/molecule";
import { accountStore } from "@/store/AccountStore";
import { BtcHepler } from "./BtcHelper";
import { WalletType } from "../interface";

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

    const psbt = new bitcoin.Psbt({ network: cfg.network });

    psbt.addInput({
      hash: params.rgbpp_txHash,
      index: params.rgbpp_txIdx,
      witnessUtxo: {
        script: Buffer.from(remove0x(utxo.scriptPk), "hex"),
        value: utxo.value,
      },
      tapInternalKey: toXOnly(Buffer.from(remove0x(params.fromPubkey), "hex")),
    });

    psbt.addOutput({
      address: params.fromAddress,
      value: params.price,
    });

    console.log("======", psbt);

    return psbt;
  }

  async createBuyPsbt(params: {
    isTestnet: boolean;
    psbtHex: string;
    buyAddress: string;
    buyPubKey: string;
    //   sporeTS: CKBComponents.Script;
    xudtTS: CKBComponents.Script;
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

    const txHash = Buffer.from(salePsbt.txInputs[0].hash.reverse()).toString(
      "hex"
    );
    const sporeRgbppLockArgs = buildRgbppLockArgs(
      salePsbt.txInputs[0].index,
      txHash
    );

    console.log("=====", salePsbt.txInputs[0].index, txHash, salePsbt);

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
    const sporeTypeBytes = serializeScript(params.xudtTS);

    const ckbVirtualTxResult = await genBtcTransferCkbVirtualTx({
      collector,
      rgbppLockArgsList: [sporeRgbppLockArgs],
      xudtTypeBytes: sporeTypeBytes,
      transferAmount: BigInt(1_0000_0000),
      isMainnet,
    });

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

    const saleAddress = salePsbt.txOutputs[0].address;

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

      // Add outputs
      merged.push(...btcOutputs);

      // Add paymaster if provided
      if (salePsbt.txOutputs[0]) {
        merged.push({
          ...salePsbt.txOutputs[0],
          fixed: true,
          minUtxoSatoshi: salePsbt.txOutputs[0].value,
        });
      }
      // dex fee
      // <<
      merged.push({
        address:
          "tb1pnprtrusgvq9tsf7dsm7yfwxf7qsazpdguw6xkducu020pc0wlw4s4f6w3n",
        value: 3000,
        fixed: true,
        minUtxoSatoshi: 3000,
      });
      // >>

      return merged;
    })();

    console.log("======== mergedBtcOutputs", mergedBtcOutputs);

    const { builder } = await createSendUtxosBuilder({
      inputs: [],
      outputs: mergedBtcOutputs,
      from: props.buyerAddr,
      source: props.source,
      feeRate: props.feeRate,
      fromPubkey: props.buyerPubkey,
    });

    const psbt = builder.toPsbt();
    psbt.addInput(salePsbt.txInputs[0]);
    psbt.data.updateInput(psbt.data.inputs.length - 1, salePsbt.data.inputs[0]);
    console.log("======== buy psbt", psbt);
    return psbt;
  }
}

export const testListPsbt = async () => {
  //参考例子，需要自行修改逻辑参数
  const curAccount = accountStore.currentAddress;

  const wallet = accountStore.getWallet(curAccount);
  if (!wallet) {
    throw new Error("Please choose a wallet");
  }

  console.log("======", curAccount);

  const listPsbt = await TestHelper.instance.createListPsbt({
    isTestnet: true,
    rgbpp_txHash:
      "e0aa62d32127f2d7e5c499e546ee0e444a4b365af840f54396fc62d6c10dcc8b",
    rgbpp_txIdx: 0,
    price: 100,
    fromAddress: curAccount as string,
    fromPubkey: wallet.pubkey,
  });

  const psbtHex = await BtcHepler.instance.signPsdt(
    listPsbt.toHex(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wallet.type as any
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

  const { psbt: buyPsbt, ckbVirtualTxResult } =
    await TestHelper.instance.createBuyPsbt({
      isTestnet: true,
      psbtHex:
        "70736274ff01005e02000000018bcc0dc1d662fc9643f540f85a364b4a440eee46e599c4e5d7f22721d362aae00000000000ffffffff016400000000000000225120028cf033ef06643334d3fef75889ab3e18ded5b8763300b5d87174cd1a6d8b32000000000001012b6e03000000000000225120028cf033ef06643334d3fef75889ab3e18ded5b8763300b5d87174cd1a6d8b32010842014051d93691800d18f57a0cb407473a4aed2bfacf189e6647042d82380563f00d69957f4115a0123085fddf0973ca598c91e415e94645c9ee36de18a558f6f2ebaa0000",
      buyAddress: wallet.address,
      buyPubKey: wallet.pubkey,
      xudtTS: {
        codeHash:
          "0x25c29dc317811a6f6f3985a7a9ebc4838bd388d19d0feeecf0bcd60f6c0975bb",
        hashType: "type",
        args: "0x6a5a8762fc76d5854e69d8a13611acfede063e77d15e964e3a88660e86cff1af",
      },
    });

  const psbtHex = await BtcHepler.instance.signPsdt(
    buyPsbt.toHex(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wallet.type as any
  );

  const cfg = networkTypeToConfig(NetworkType.TESTNET);
  console.log(
    "====== psbtHex",
    psbtHex,
    bitcoin.Psbt.fromHex(psbtHex, { network: cfg.network })
  );

  const btcTxId = await BtcHepler.instance.pushPsbt(
    psbtHex,
    wallet.type as WalletType
  );

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
    btc_txid: btcTxId,
    ckb_virtual_result: ckbVirtualTxResult,
  });
  console.log("rgbppState", rgbppState);
};
