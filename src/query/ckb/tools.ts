import { CKB_INDEX_URL, CKB_RPC_URL, CONFIG } from "@/settings/variable";
import { BI, config, helpers, Indexer, RPC } from "@ckb-lumos/lumos";

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