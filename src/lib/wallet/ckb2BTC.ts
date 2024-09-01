import LeapHelper from "rgbpp-leap-helper/lib";
import {getEnv} from "../../settings/env.ts";
import {mainConfig, testConfig} from "./constants.ts";
import {BI, Cell, helpers, Indexer, RPC, Script, Transaction,} from "@ckb-lumos/lumos";
import {blockchain, OutPoint} from "@ckb-lumos/base";
import {predefined} from "@ckb-lumos/config-manager";
import { assembleTransferSporeAction, assembleCobuildWitnessLayout } from '@spore-sdk/core/lib/cobuild'
import {serializeWitnessArgs} from "@nervosnetwork/ckb-sdk-utils";
import {
    CKBTransaction,
    getCotaTypeScript,
    getJoyIDCellDep,
    getJoyIDLockScript,
    getSubkeyUnlock, signRawTransaction
} from "@joyid/ckb";
import {append0x, Collector} from "@rgbpp-sdk/ckb";
import {TransactionSkeletonType} from "@ckb-lumos/lumos/helpers"

import {bytes} from "@ckb-lumos/codec";
import {BIish} from "@ckb-lumos/bi";
import store from "../../store/store";
import {CkbHepler} from "./CkbHelper.ts";

const MAX_FEE = BI.from("20000000")
const isMainnet = getEnv() === 'Mainnet';

export const ckb2BTC_spore = async (address:string,publickey:string,toAddress:string,args:string,type:string) =>{

    const cfg = isMainnet ? mainConfig: testConfig ;
    const newConfig = isMainnet? predefined.LINA:predefined.AGGRON4;
    let rpcURL = isMainnet ?mainConfig.CKB_RPC_URL:testConfig.CKB_RPC_URL;
    let indexURL = isMainnet?mainConfig.CKB_INDEX_URL:testConfig.CKB_INDEX_URL;

    const rgbppLeapHelper = new LeapHelper(
        false,
        cfg.BTC_ASSETS_API_URL,
        cfg.BTC_ASSETS_TOKEN,
        cfg.BTC_ASSETS_ORGIN
    );

    const ckbRawTx = await rgbppLeapHelper.spore_leapToBtcCreateCkbTx({
        ckbAddress: address as string,
        toBtcAddress: toAddress,
        sporeId: args,
    });


    const rpc = new RPC(rpcURL);
    const fetcher = async(outPoint: OutPoint) => {
        let rt = await rpc.getLiveCell(outPoint, true)
        const{data,output} = rt.cell as any
        return {data,cellOutput:output,outPoint}
    }

    let txSkeleton = await helpers.createTransactionSkeleton((ckbRawTx as any), fetcher );

    const inputArr = txSkeleton.get("inputs").toArray();
    const outputArr = txSkeleton.get("outputs").toArray();

    const inputObj = inputArr[0];
    const {content} = inputObj.data as any
    inputObj.data = content;
    const outputObj = outputArr[0];

    let inputMin = inputObj.cellOutput.capacity;
    let inputOccupid = helpers.minimalCellCapacityCompatible(inputObj);

    let newMargin = BI.from(inputMin).sub(inputOccupid)

    let outputMin = helpers.minimalCellCapacityCompatible(outputObj).add(newMargin);
    let minBi = outputMin.sub(inputMin.toString());

    let amount;

    if(minBi.gt("0")){
        amount = minBi
    }else{
        amount = BI.from("0")
    }
    let capcityFormat = BI.from(inputMin)


    txSkeleton = txSkeleton.update("outputs", (outputs) =>
        outputs.clear()
    );

    outputObj.cellOutput.capacity = amount.add(capcityFormat).toHexString();
    txSkeleton = txSkeleton.update("outputs", (outputs) =>
        outputs.push(outputObj)
    );

    const fromScript = helpers.addressToScript(address,{config:newConfig})

    let needCapacity = BI.from(
        helpers.minimalCellCapacity({
            cellOutput: {
                lock: fromScript,
                capacity: BI.from(0).toHexString(),
            },
            data: "0x",
        })
    ).add(MAX_FEE).add(amount);


    const indexer = new Indexer(indexURL, rpcURL);

    const collect_ckb = indexer.collector({
        lock: {
            script: fromScript,
            searchMode: "exact",
        },
        type: "empty",
    });


    const inputs_ckb:any[] = [];
    let ckb_sum = BI.from(0);
    for await (const collect of collect_ckb.collect()) {

        inputs_ckb.push(collect);
        ckb_sum = ckb_sum.add(collect.cellOutput.capacity);
        if (ckb_sum.gte(needCapacity)) {
            break;
        }
    }

    if (ckb_sum.lt(needCapacity)) {
        throw new Error("Not Enough capacity found");
    }
    const {codeHash:myCodeHash,hashType:myHashType} = fromScript
    let cellDep_script_lock;


    if(type.indexOf("joyid")>-1){
        cellDep_script_lock = getJoyid_lock_type(isMainnet)
    }else{
        for(let key in newConfig.SCRIPTS){
            let item = (newConfig.SCRIPTS as any)[key]
            if(item.CODE_HASH === myCodeHash && item.HASH_TYPE === myHashType){
                cellDep_script_lock = item;
                break;
            }
            throw new Error("script not found")
        }
    }
    let oldInputs = txSkeleton.get("inputs");
    txSkeleton = txSkeleton.update("inputs", (inputs) =>
        inputs.clear()
    );
    txSkeleton = txSkeleton.update("inputs", (inputs) =>
        inputs.push(...inputs_ckb, ...oldInputs)
    );


    const outputCapacity  = ckb_sum.sub(MAX_FEE).sub(amount);

    txSkeleton = txSkeleton.update("outputs", (outputs) =>
        outputs.push({
            cellOutput: {
                capacity:`0x${outputCapacity.toString(16)}` ,
                lock: fromScript,
            },
            data:"0x"
        })
    );


    const {TX_HASH:tx_hash_lock,INDEX:index_lock,DEP_TYPE:dep_type_lock} = cellDep_script_lock

    txSkeleton = txSkeleton.update("cellDeps", (cellDeps) =>
        cellDeps.push(    {
            "outPoint": {
                "txHash": tx_hash_lock,
                "index": index_lock
            },
            "depType": dep_type_lock
        })
    );

    let  sporeCoBuild = generateSporeCoBuild_Single(inputObj, outputObj)

    txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
        witnesses.clear()
    );

    txSkeleton = await updateWitness(txSkeleton,fromScript,inputObj.cellOutput.type!.codeHash,sporeCoBuild,type,rpcURL,indexURL)
    const unsignedTx = helpers.createTransactionFromSkeleton(txSkeleton);

    const size =  getTransactionSizeByTx(unsignedTx)


    let rt = await getFeeRate(rpcURL);
    const {median} = rt;

    let fee = BI.from(median)


    const newFee = calculateFeeCompatible(size,fee);
    const outputCapacityFact  = ckb_sum.sub(newFee).sub(amount);
    let outputs = txSkeleton.get("outputs").toArray();
    let item = outputs[1];
    item.cellOutput.capacity = outputCapacityFact.toHexString();
    txSkeleton = txSkeleton.update("outputs", (outputs) => {
        outputs.set(1,item)
        return outputs;
    });

    if (type.indexOf("joyid") > -1 ) {
        const unsignedRawTx = helpers.createTransactionFromSkeleton(txSkeleton);

        const signed = await signRawTransaction(
            unsignedRawTx as CKBTransaction,
            address
        );

        return CkbHepler.instance.sendTransaction(signed);
    }else if(type === "rei"){
        const unsignedRawTx = helpers.transactionSkeletonToObject(txSkeleton)

        return await (window as any).ckb.request({method:"ckb_sendRawTransaction",data:{
                txSkeleton:unsignedRawTx
            }})
    }


}

const getJoyid_lock_type = (isMainnet:boolean) =>{
    let lock = getJoyIDLockScript(isMainnet)
    let celldep = getJoyIDCellDep(isMainnet)

    const {codeHash,hashType} = lock;
    const {depType,outPoint:{index,txHash}} = celldep;

    return{
        CODE_HASH: codeHash,
        DEP_TYPE:depType,
        HASH_TYPE: hashType,
        INDEX: index,
        SHORT_ID: 0,
        TX_HASH: txHash
    }
}

 const generateSporeCoBuild_Single = (sporeCell:Cell, outputCell:Cell) => {
    const { actions } = assembleTransferSporeAction(sporeCell, outputCell)
    return assembleCobuildWitnessLayout(actions)
}

const getTransactionSizeByTx = (tx:Transaction) => {
    const serializedTx = blockchain.Transaction.pack(tx);
    const size = serializedTx.byteLength + 4;
    return size;
}

const calculateFeeCompatible =(size:BIish, feeRate:BI) => {
    const ratio = BI.from(1000);
    const base = BI.from(size).mul(feeRate);
    const fee = base.div(ratio);
    if (fee.mul(ratio).lt(base)) {
        return fee.add(1);
    }
    return BI.from(fee);
}


const updateWitness = async(txSkeleton:TransactionSkeletonType,myScript:Script,code_hash_contract_type:string,sporeCoBuild:any,type:string,rpcURL:string,indexURL:string) =>{
    const inputArr = txSkeleton.get("inputs").toArray();
    for (let i = 0; i < inputArr.length; i++) {
        txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.push("0x"));
    }

    if(type.indexOf("joyid") > -1){
        const joyidInfo = store.getState().wallet.joyidInfo;

        if(joyidInfo?.keyType !==  "sub_key"){

            let emptyWitness = { lock: '', inputType: '', outputType: '' }
            const firstIndex = txSkeleton
                .get("inputs")
                .findIndex((input) =>
                    bytes.equal(blockchain.Script.pack(input.cellOutput.lock), blockchain.Script.pack(myScript))
                );

            while (firstIndex >= txSkeleton.get("witnesses").size) {
                txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.push("0x"));
            }
            txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.set(firstIndex,  serializeWitnessArgs(emptyWitness)));
        }
        else{

            const DOB_AGGREGATOR_URL = isMainnet ? mainConfig.DOB_AGGREGATOR_URL: testConfig.DOB_AGGREGATOR_URL ;
            const unlockEntry = await getSubkeyUnlock(DOB_AGGREGATOR_URL, joyidInfo)
            let emptyWitness = {
                lock: '',
                inputType: '',
                outputType: append0x(unlockEntry),
            }
            const firstIndex = txSkeleton
                .get("inputs")
                .findIndex((input) =>
                    bytes.equal(blockchain.Script.pack(input.cellOutput.lock), blockchain.Script.pack(myScript))
                );

            while (firstIndex >= txSkeleton.get("witnesses").size) {
                txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.push("0x"));
            }
            txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.set(firstIndex,  serializeWitnessArgs(emptyWitness)));



            const cotaType = getCotaTypeScript(isMainnet)

            const collector = new Collector({
                ckbNodeUrl: rpcURL,
                ckbIndexerUrl: indexURL,
            })

            const cotaCells = await collector.getCells({ lock: myScript, type: cotaType })
            if (!cotaCells || cotaCells.length === 0) {
                throw new Error("Cota cell doesn't exist")
            }
            const cotaCell = cotaCells[0]
            const cotaCellDep = {
                outPoint: cotaCell.outPoint,
                depType: 'code',
            }

            let cellDeps = txSkeleton.get("cellDeps")

            txSkeleton = txSkeleton.update("cellDeps", (cellDep) => cellDep.set(0,cotaCellDep));

            for (let i = 0; i < cellDeps.size; i++) {
                const item = cellDeps.get(i)
                txSkeleton = txSkeleton.update("cellDeps", (cellDep) => cellDep.set(i+1,item));
            }
        }
    }
    else{
        const firstIndex = txSkeleton
            .get("inputs")
            .findIndex((input) =>
                bytes.equal(blockchain.Script.pack(input.cellOutput.lock), blockchain.Script.pack(myScript))
            );
        if (firstIndex !== -1) {
            while (firstIndex >= txSkeleton.get("witnesses").size) {
                txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.push("0x"));
            }
            let witness = txSkeleton.get("witnesses").get(firstIndex);
            const newWitnessArgs:any = {
                /* 65-byte zeros in hex */
                lock: "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            };
            if (witness !== "0x") {
                const witnessArgs = blockchain.WitnessArgs.unpack(bytes.bytify(witness));
                const lock = witnessArgs.lock;
                if (!!lock && !!newWitnessArgs.lock && !bytes.equal(lock, newWitnessArgs.lock)) {
                    throw new Error("Lock field in first witness is set aside for signature!");
                }
                const inputType = witnessArgs.inputType;
                if (!!inputType) {
                    newWitnessArgs.inputType = inputType;
                }
                const outputType = witnessArgs.outputType;
                if (!!outputType) {
                    newWitnessArgs.outputType = outputType;
                }
            }
            witness = bytes.hexify(blockchain.WitnessArgs.pack(newWitnessArgs));
            txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.set(firstIndex, witness));
        }
    }



    const contractIndex = txSkeleton
        .get("inputs")
        .findIndex((input) => input.cellOutput.type?.codeHash ===  code_hash_contract_type
        );

    while (contractIndex >= txSkeleton.get("witnesses").size) {
        txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.push("0x"));
    }
    txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.set(txSkeleton
        .get("inputs").size, sporeCoBuild));

    return txSkeleton;

}


export const getFeeRate = async(rpcURL:string) =>{
    const rpc = new RPC(rpcURL)
    return await rpc.getFeeRateStatistics();
}
