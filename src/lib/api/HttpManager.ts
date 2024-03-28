import {
  AssetInfo,
  ckb_SporeInfo,
  ckb_TxInfo,
  ckb_UDTInfo,
  txInfo,
} from "../interface";
import { EventManager } from "../manager/EventManager";
import { EventType } from "../enum";
import { DataManager } from "../manager/DataManager";
import { BI } from "@ckb-lumos/lumos";
import { BtcHepler } from "../wallet/BtcHelper";
import { CkbHepler } from "../wallet/CkbHelper";
export class HttpManager {
  private static _instance: HttpManager;
  private constructor() {}

  public static get instance() {
    if (!HttpManager._instance) {
      HttpManager._instance = new HttpManager();
    }
    return this._instance;
  }

  public async getAsset(address: string) {
    EventManager.instance.publish(EventType.dashboard_page_hide_tabs, {});
    EventManager.instance.publish(EventType.dashboard_assets_hide, {});

    let hasTabs = false;

    const assetList: AssetInfo[] = [];

    if (address.startsWith("ckb") || address.startsWith("ckt")) {
      // ckb chain
      hasTabs = true;

      const ckbAddressInfo = await CkbHepler.instance.getAddressInfo(address);
      if (ckbAddressInfo) {
        assetList.push({
          chain: "CKB",
          balance: BI.from(ckbAddressInfo.data.attributes.balance).sub(
            ckbAddressInfo.data.attributes.balance_occupied
          ),
        });

        const ckbSporeInfoList: ckb_SporeInfo[] = [];
        const udtInfoList: ckb_UDTInfo[] = [];
        for (
          let i = 0;
          i < ckbAddressInfo.data.attributes.udt_accounts.length;
          i++
        ) {
          const udt_accounts = ckbAddressInfo.data.attributes.udt_accounts[i];
          if (udt_accounts.udt_type == "spore_cell") {
            ckbSporeInfoList.push(udt_accounts);
          } else {
            udtInfoList.push(udt_accounts);
          }
        }

        DataManager.instance.tokens = {
          udt: udtInfoList,
          spore: ckbSporeInfoList,
        };
      } else {
        assetList.push({
          chain: "CKB",
          balance: BI.from(0),
        });
      }
    } else {
      // btc chain
      const btcBalance = await BtcHepler.instance.getBTC(address);
      if (btcBalance) {
        assetList.push({
          chain: "BTC",
          balance: BI.from(btcBalance.chain_stats.funded_txo_sum),
        });
      } else {
        assetList.push({
          chain: "BTC",
          balance: BI.from(0),
        });
      }
    }

    if (hasTabs) {
      EventManager.instance.publish(EventType.dashboard_page_show_tabs, {});
    } else {
      EventManager.instance.publish(EventType.dashboard_page_hide_tabs, {});
    }

    DataManager.instance.curAsset = assetList;
    EventManager.instance.publish(EventType.dashboard_assets_show, {});
    return assetList;
  }

  public async getTransactions(
    address: string,
    after_tx?: string,
    page: number = 1
  ) {
    if (page == 1) {
      EventManager.instance.publish(EventType.transaction_item_hide, {});
    }

    const txInfoList: txInfo[] = [];
    if (address.startsWith("ckb") || address.startsWith("ckt")) {
      const txList = await CkbHepler.instance.getTx(address, page - 1);
      for (let i = 0; i < txList.data.length; i++) {
        const tx = txList.data[i] as ckb_TxInfo;
        txInfoList.push({
          txHash: tx.attributes.transaction_hash,
          block: tx.attributes.block_number,
        });
      }
    } else {
      const txList = await BtcHepler.instance.getTx(address, after_tx);
      if (txList) {
        for (let i = 0; i < txList.length; i++) {
          const tx = txList[i];
          txInfoList.push({
            txHash: tx.txid,
            block: tx.status.block_height.toString(),
          });
        }
      }
    }

    if (page == 1) {
      DataManager.instance.curTxList = [];
    }

    DataManager.instance.curTxList.push(...txInfoList);

    if (page == 1) {
      EventManager.instance.publish(EventType.transaction_reload_page, {});
      EventManager.instance.publish(EventType.transaction_item_show, {});
    } else {
      EventManager.instance.publish(EventType.transaction_item_load_more, {});
    }
  }
}
