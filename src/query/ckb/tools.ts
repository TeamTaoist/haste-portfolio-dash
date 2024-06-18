import { getEnv } from "../../settings/env";
// import { backend, ckb_explorer_api, CKB_INDEX_URL, CKB_RPC_URL, getSporeTypeScript, getXudtTypeScript} from "../../settings/variable";
import { ckb_SporeInfo, ckb_UDTInfo } from "../../types/BTC";
import { number } from "@ckb-lumos/codec";
import { BI, Cell, helpers, Indexer, RPC, utils } from "@ckb-lumos/lumos";
import superagent from "superagent";
import {backend, getSporeTypeScript, getXudtTypeScript, mainConfig, testConfig} from "../../lib/wallet/constants.ts";

import {predefined} from "@ckb-lumos/config-manager";
import {getSporeScript, predefinedSporeConfigs} from "@spore-sdk/core";
import {_request} from "./feerate.ts";
// config.initializeConfig(CONFIG);

let rpcURL = getEnv() === 'Mainnet'?mainConfig.CKB_RPC_URL:testConfig.CKB_RPC_URL;
let indexURL = getEnv() === 'Mainnet'?mainConfig.CKB_INDEX_URL:testConfig.CKB_INDEX_URL

export const rpc = new RPC(rpcURL);
export const indexer = new Indexer(indexURL, rpcURL);

export const getCKBCapacity = async (address: string) => {



    const lumosConfig =getEnv() === 'Mainnet' ? predefined.LINA :predefined.AGGRON4 ;

  const collector = indexer.collector({
      lock: helpers.parseAddress(address,{config:lumosConfig}),
      type: "empty",
    });
    let balance = BI.from(0);
    for await (const cell of collector.collect()) {
      balance = balance.add(cell.cellOutput.capacity);
    }
    return balance;
}

export const getSpore = async(address: string) => {
    const lock = helpers.parseAddress(address);

    const sporeType = getSporeTypeScript(getEnv() === "Mainnet");

    const sporeCellList: Cell[] = [];

    const sporeCollector = indexer.collector({
      lock,
      type: {
        script: {
          codeHash: sporeType?.codeHash!,
          hashType: sporeType?.hashType!,
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


export const getXudtAndSpore = async(address: string) => {
    // const cfg = getEnv() === 'Mainnet' ? TestnetInfo : MainnetInfo;
    const lumosConfig =getEnv() === 'Mainnet' ? predefined.LINA :predefined.AGGRON4 ;
    const xudtTypeScript = getXudtTypeScript(getEnv() === 'Mainnet');
    const sporeTypeScript = getSporeTypeScript(getEnv() === 'Mainnet');
    const xudt_collector = indexer.collector({
      lock: helpers.parseAddress(address,{config:lumosConfig}),
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
      lock: helpers.parseAddress(address,{config:lumosConfig}),
      type: {
        script: {
          codeHash: sporeTypeScript?.codeHash!,
          hashType: sporeTypeScript?.hashType!,
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
            udt_type: "xUDT",
            data:xudtCell.data,
            type_script: xudtCell.cellOutput.type,
              allObj:xudtCell
          };

          xudtMap[typeHash] = ckbUDTInfo;
          xudtList.push(ckbUDTInfo);
        }

        let addNum: BI | undefined = undefined;
        try {
          //@ts-ignore
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

        //@ts-ignore
        sporeList.push({
          symbol: "DOBs",
          data:sporeCell.data,
          amount: sporeCell.cellOutput.type.args,
          outPoint:sporeCell.outPoint,
          type_hash: typeHash,
          udt_type: "spore_cell",
          type_script: sporeCell.cellOutput.type,
            allObj:sporeCell
        });
      }
    }

    return { xudtList, sporeList };

}

export const getTx = async(address: string, page: number = 0) => {
  const rs = await superagent
    .post(`${backend}/api/explore`)
    .set("Content-Type", "application/json")
    .send({
      req: `https://${getEnv() === 'Mainnet' ?  mainConfig.ckb_explorer_api : testConfig.ckb_explorer_api}/api/v1/address_transactions/${address}?page=${
        page + 1
      }&page_size=10&sort=time.desc`,
    })
    .catch((err) => {
      console.error(err);
    });

  if (rs && rs.status == 200) {
    return rs.text !== '' ? JSON.parse(rs.text): [];
  }
}

export const getClusterList = async(address: string) => {
    const lumosConfig =getEnv() === 'Mainnet' ? predefined.LINA :predefined.AGGRON4 ;
    const hashObj = helpers.parseAddress(address,{config:lumosConfig});
    const{codeHash,hashType,args} = hashObj;


    const clusterConfig = getEnv() === "mainnet" ? predefinedSporeConfigs.Mainnet : predefinedSporeConfigs.Testnet;

    const clusterType = getSporeScript(clusterConfig,"Cluster",["v2"]);


    return await _request({
        method:"get_cells",
        url:indexURL,
        params:[
            {
                script: {
                    code_hash: codeHash,
                    hash_type:hashType,
                    args
                },
                "script_type": "lock",
                script_search_mode: "exact",
                filter: {
                    script: {
                        code_hash: clusterType.script.codeHash,
                        hash_type: clusterType.script.hashType,
                        args: "0x",
                    },
                    script_search_mode: 'prefix',
                    script_type: 'type',
                },
            },
            "desc",
            "0x64"
        ]
    })

}
