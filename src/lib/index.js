import { predefinedSporeConfigs, transferSpore,meltSpore,transferCluster} from "@spore-sdk/core";
import {formatter} from "./formatParamas";
import {commons, hd, helpers, RPC} from "@ckb-lumos/lumos";
import { parseAddress } from '@ckb-lumos/helpers'
import { predefined } from '@ckb-lumos/config-manager'
import {CKB_RPC_URL} from "../settings/variable";
import { getConfig } from "./constant";

export  const send_DOB = async(currentAccountInfo,outPoint,toAddress,isMainnet) => {
    const addr =  addressToScript(toAddress);


    const cfg = getConfig(isMainnet);

    console.log({
        outPoint:outPoint,
        fromInfos: [currentAccountInfo],
        toLock: addr,
        config:cfg,
    })
    let sporeConfig = predefinedSporeConfigs.Testnet
    // sporeConfig.lumos = cfg.LumosCfg;
    const { txSkeleton } = await transferSpore({
        // outPoint:sporeCell.outPoint,
        outPoint:outPoint,
        fromInfos: [currentAccountInfo],
        toLock: addr,
    });

    let signHash = await signAndSendTransaction(txSkeleton);

    const newTx = formatter.toRawTransaction(signHash);

    const rpc = new RPC(CKB_RPC_URL);

    return rpc.sendTransaction(newTx, "passthrough");
}

async function signAndSendTransaction(txSkeleton) {

    const currentAccount = await currentInfo();

    const {privatekey_show} = currentAccount;

    txSkeleton = commons.common.prepareSigningEntries(txSkeleton);

    let signatures = txSkeleton
        .get("signingEntries")
        .map((entry) => hd.key.signRecoverable(entry.message, privatekey_show))
        .toArray();

    return helpers.sealTransaction(txSkeleton, signatures);
}

function addressToScript  (address) {
    const prefix = address.slice(0, 3)
    if (prefix !== 'ckt' && prefix !== 'ckb') {
        throw new Error('Invalid address prefix')
    }
    const lumosConfig = prefix === 'ckt' ? predefined.AGGRON4 : predefined.LINA
    return parseAddress(address, { config: lumosConfig })
}

const transaction_confirm = async (tx) =>{
    const network = await this.getNetwork();
    return await this._request({
        method:"send_transaction",
        url:network.rpcUrl.node,
        params:[
            tx
        ]
    })
}

