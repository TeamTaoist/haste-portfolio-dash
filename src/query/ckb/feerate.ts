import {getEnv} from "../../settings/env.ts";
import {Main_Config, Test_Config} from "../../lib/constant.ts";

let jsonRpcId = 0;
const _request = async(obj:any) => {
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

export const get_feeRate = async() =>{

    const cfg = getEnv() === 'Mainnet' ? Main_Config.CKB_RPC_URL: Test_Config.CKB_RPC_URL ;
    return await _request({
        method:"get_fee_rate_statistics",
        url:cfg,
        params:['0x65']
    })

}
