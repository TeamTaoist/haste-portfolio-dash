import { getEnv } from "@/settings/env";
import { CKB_INDEX_URL, CKB_RPC_URL, CONFIG, getSporeTypeScript, getXudtTypeScript, MainnetInfo, TestnetInfo } from "@/settings/variable";
import { ckb_SporeInfo, ckb_UDTInfo } from "@/types/BTC";
import { number } from "@ckb-lumos/codec";
import { BI, Cell, config, helpers, Indexer, RPC, utils } from "@ckb-lumos/lumos";

config.initializeConfig(CONFIG);

export const rpc = new RPC(CKB_RPC_URL);
export const indexer = new Indexer(CKB_INDEX_URL, CKB_RPC_URL);

export const getCKBCapacity = async (address: string) => {
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

export const getSpore = async(address: string) => {
    const lock = helpers.parseAddress(address);

    const sporeType = getSporeTypeScript(getEnv() === "Mainnet");

    const sporeCellList: Cell[] = [];

    const sporeCollector = indexer.collector({
      lock,
      type: {
        script: {
          codeHash: sporeType.codeHash,
          hashType: sporeType.hashType,
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
    const cfg = getEnv() === 'Mainnet' ? TestnetInfo : MainnetInfo;

    const xudtTypeScript = getXudtTypeScript(getEnv() === 'Mainnet');
    const sporeTypeScript = getSporeTypeScript(getEnv() === 'Mainnet');
    const xudt_collector = indexer.collector({
      lock: helpers.parseAddress(address),
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
      lock: helpers.parseAddress(address),
      type: {
        script: {
          codeHash: sporeTypeScript.codeHash,
          hashType: sporeTypeScript.hashType,
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
            type_script: xudtCell.cellOutput.type,
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

        sporeList.push({
          symbol: "DOBs",
          amount: sporeCell.cellOutput.type.args,
          type_hash: typeHash,
          udt_type: "spore_cell",
          type_script: sporeCell.cellOutput.type,
        });
      }
    }

    return { xudtList, sporeList };


}