import styled from "styled-components";
import {useEffect, useState} from "react";
import {useSelector} from "react-redux";
import {RootState} from "../../store/store.ts";
import {helpers} from "@ckb-lumos/lumos";
import {getEnv} from "../../settings/env.ts";
import {mainConfig, testConfig} from "../../lib/wallet/constants.ts";

const Box = styled.div`
    line-height: 2em;
`
export default function Lock({lockScript,type}){
    const currentAddress = useSelector((state: RootState) => state.wallet.currentWalletAddress);

    useEffect(() => {
        if(!currentAddress)return;
            const cfg = getEnv() === 'Testnet' ? testConfig : mainConfig;

            if(type === "ckb"){
                const lS = helpers.parseAddress(currentAddress, {
                    config: cfg.CONFIG,
                });
                setJsonStr(lS)
            }else{
                setJsonStr(lockScript)
            }


    }, [currentAddress,type]);
    const [jsonStr,setJsonStr] = useState<any>(null)
    return <Box><div className="bg-gray-100 p-4 h-56 scroll-auto text-gray-500">
        <pre>
            {
               JSON.stringify(jsonStr,null,4)
            }
        </pre>
    </div>
    </Box>
}
