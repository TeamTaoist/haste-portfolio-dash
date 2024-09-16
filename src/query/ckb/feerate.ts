import {getEnv} from "../../settings/env.ts";
import {Main_Config, Test_Config} from "../../lib/constant.ts";
import {RPC} from "@ckb-lumos/lumos";

let jsonRpcId = 0;
export const _request = async(obj:any) => {
    ++jsonRpcId;
    const {method,params,url} = obj;

    const body = { jsonrpc: '2.0', id: jsonRpcId, method, params }
    const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
        },
    });
    const rt = await res.json();
    // Abort retrying if the resource doesn't exist
    if (rt.error) {
        /* istanbul ignore next */
        return Promise.reject(rt.error);
    }

    return rt?.result;

}



export const getFeeRate = async() =>{

    const rpcURL = getEnv() === 'Mainnet' ? Main_Config.CKB_RPC_URL: Test_Config.CKB_RPC_URL ;
    const rpc = new RPC(rpcURL)
    let result = await rpc.getFeeRateStatistics()

    let maxNum = Math.max(parseInt(result.median),1100).toString(16);
    result.median = `0x${maxNum}`;
    return result;
}

