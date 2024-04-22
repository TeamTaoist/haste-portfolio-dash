import { serializeScript } from "@nervosnetwork/ckb-sdk-utils";
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
import * as btcSigner from "@scure/btc-signer";
import superagent from "superagent";

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

    const config = networkTypeToConfig(source.networkType);
    const minUtxoSatoshi = config.rgbppUtxoDustLimit;

    const { builder } = await this.dex_createSendUtxosBuilder(
      {
        inputs: [
          {
            ...utxo,
            pubkey: params.fromPubkey,
          },
        ],
        outputs: [
          {
            data: Buffer.from("0x" + "00".repeat(32), "hex"), // any data <= 80 bytes
            value: 0, // normally the value is 0
            fixed: true,
          },
          {
            address: params.fromAddress,
            value: minUtxoSatoshi,
            fixed: true,
            minUtxoSatoshi: minUtxoSatoshi,
          },
          {
            address: params.fromAddress,
            value: minUtxoSatoshi,
            fixed: true,
            minUtxoSatoshi: minUtxoSatoshi,
          },
          {
            address: params.fromAddress,
            value: params.price,
            fixed: true,
            minUtxoSatoshi: params.price,
          },
          {
            address:
              "tb1pq2x0qvl0qejrxdxnlmm43zdt8cvda4dcwcespdwcw96v6xnd3veqzgdm0m",
            value: Math.ceil(params.price * 0.01),
            fixed: true,
            minUtxoSatoshi: Math.ceil(params.price * 0.01),
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
    psbt.updateInput(0, {
      sighashType: btcSigner.SigHash.SINGLE_ANYONECANPAY,
    });

    // const psbt = new bitcoin.Psbt({ network: cfg.network });

    // psbt.addInput({
    //   hash: params.rgbpp_txHash,
    //   index: params.rgbpp_txIdx,
    //   witnessUtxo: {
    //     script: Buffer.from(remove0x(utxo.scriptPk), "hex"),
    //     value: utxo.value,
    //   },
    //   tapInternalKey: toXOnly(Buffer.from(remove0x(params.fromPubkey), "hex")),
    //   sighashType: btcSigner.SigHash.SINGLE_ANYONECANPAY,
    // });

    // psbt.data.addOutput({
    //   script: Buffer.from("0000000000000000000000000000000000"),
    //   value: 0,
    // });

    // psbt.data.addOutput({
    //   script: Buffer.from("0000000000000000000000000000000001"),
    //   value: 0,
    // });

    // psbt.addOutput({
    //   address: params.fromAddress,
    //   value: 0,
    // });

    // psbt.addOutput({
    //   address: params.fromAddress,
    //   value: params.price,
    // });

    // // dex fee
    // // <<
    // psbt.addOutput({
    //   address: "tb1pq2x0qvl0qejrxdxnlmm43zdt8cvda4dcwcespdwcw96v6xnd3veqzgdm0m",
    //   value: Math.ceil(params.price * 0.01),
    // });
    // // >>

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
      transferAmount: BigInt(10000),
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

    const saleAddress = salePsbt.txOutputs[2].address;

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

      // Add outputs
      merged.push(...btcOutputs);

      for (let i = 3; i < salePsbt.txOutputs.length; i++) {
        const output = salePsbt.txOutputs[i];
        merged.push({
          address: output.address,
          script: output.script,
          fixed: true,
          value: output.value,
          minUtxoSatoshi: output.value,
        });
      }

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
    // console.log("======== buy psbt", psbt);
    // psbt.data.updateInput(0, salePsbt.data.inputs[0]);
    console.log("======== before psbt", psbt, salePsbt);

    for (let i = 1; i < psbt.txInputs.length; i++) {
      const input = psbt.txInputs[i];
      salePsbt.data.addInput({
        hash: input.hash,
        index: input.index,
        witnessUtxo: psbt.data.inputs[i].witnessUtxo,
        tapInternalKey: psbt.data.inputs[i].tapInternalKey,
      });
    }

    salePsbt.data.globalMap.unsignedTx["tx"]["outs"][0] =
      psbt.data.globalMap.unsignedTx["tx"]["outs"][0];
    salePsbt.data.outputs[0] = psbt.data.outputs[0];

    salePsbt.data.globalMap.unsignedTx["tx"]["outs"][1] =
      psbt.data.globalMap.unsignedTx["tx"]["outs"][1];
    salePsbt.data.outputs[1] = psbt.data.outputs[1];

    salePsbt.data.globalMap.unsignedTx["tx"]["outs"][2] =
      psbt.data.globalMap.unsignedTx["tx"]["outs"][2];
    salePsbt.data.outputs[2] = psbt.data.outputs[2];

    for (let i = 5; i < psbt.txOutputs.length; i++) {
      const output = psbt.txOutputs[i];
      salePsbt.data.addOutput({
        address: output.address as string,
        script: output.script,
        value: output.value,
      });
    }

    // salePsbt.finalizeInput(0);
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

  const listPsbt = await TestHelper.instance.createListPsbt({
    isTestnet: true,
    rgbpp_txHash:
      "012051cf08ec7701a9ecbdebbceef49af3662d10c898471b42562475a6d85bac",
    rgbpp_txIdx: 1,
    price: 100,
    fromAddress: curAccount as string,
    fromPubkey: wallet.pubkey,
  });

  const psbtHex = await BtcHepler.instance.halfSignPsbt(
    listPsbt.toHex(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wallet.type as any,
    {
      autoFinalized: false,
      toSignInputs: [
        {
          index: 0,
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

  const { psbt: buyPsbt, ckbVirtualTxResult } =
    await TestHelper.instance.createBuyPsbt({
      isTestnet: true,
      psbtHex:
        "70736274ff0100ea0200000001ac5bd8a6752456421b4798c8102d66f39af4eebcebbdeca90177ec08cf5120010100000000ffffffff050000000000000000026a002202000000000000225120d07b654186848fd21e999859a55f432777624ee3d423181b0556ee2c5fff2d432202000000000000225120d07b654186848fd21e999859a55f432777624ee3d423181b0556ee2c5fff2d436400000000000000225120d07b654186848fd21e999859a55f432777624ee3d423181b0556ee2c5fff2d430100000000000000225120028cf033ef06643334d3fef75889ab3e18ded5b8763300b5d87174cd1a6d8b32000000000001012b2202000000000000225120d07b654186848fd21e999859a55f432777624ee3d423181b0556ee2c5fff2d43010304830000000113413274804aabc9fc107c3067bdb8d3a34e6aafa3d90ed7ddabf658cd96c84b7938b5acdd48f39e4bdd90950cb0d80930488518c295732a13b33dcd971ba5685b0d83011720f93f0462a182c05eedfcb26eebcf5fa6bcb9cfc32f10e157e97fcd5f8df0bf8a000000000000",
      buyAddress: wallet.address,
      buyPubKey: wallet.pubkey,
      xudtTS: {
        codeHash:
          "0x25c29dc317811a6f6f3985a7a9ebc4838bd388d19d0feeecf0bcd60f6c0975bb",
        hashType: "type",
        args: "0x30452490e0f5bc2b2c832ed04a349be90cab3f25aaece06612195642f61fa114",
      },
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
