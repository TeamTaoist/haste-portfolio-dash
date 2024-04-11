import { getEnv } from "@/settings/env";
import { CKB_INDEX_URL, CKB_RPC_URL, CONFIG, getSporeTypeScript } from "@/settings/variable";
import { BI, Cell, config, helpers, Indexer, RPC } from "@ckb-lumos/lumos";

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
