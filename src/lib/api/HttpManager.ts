import superagent from "superagent";
import {
  AssetInfo,
  btc_Address,
  ckb_AddressInfo,
  ckb_TxInfo,
  txInfo,
} from "../interface";
import { EventManager } from "../manager/EventManager";
import { EventType } from "../enum";
import { DataManager } from "../manager/DataManager";
import { BI } from "@ckb-lumos/lumos";

export class HttpManager {
  private static _instance: HttpManager;
  private constructor() {}

  public static get instance() {
    if (!HttpManager._instance) {
      HttpManager._instance = new HttpManager();
    }
    return this._instance;
  }

  private _host: string = "https://blockchain-serverless.vercel.app";

  public async getAsset(address: string) {
    EventManager.instance.publish(EventType.dashboard_page_hide_tabs, {});
    EventManager.instance.publish(EventType.dashboard_assets_hide, {});

    const rs = await superagent
      .post(`${this._host}/api/assets`)
      .set("Content-Type", "application/json")
      .send({
        addrList: [address],
      })
      .catch((err) => {
        console.error(err);
      });

    const assetList: AssetInfo[] = [];

    if (rs && rs.status == 200) {
      let hasTabs = false;

      const data = JSON.parse(rs.text);
      if (data["btc_main"]) {
        let btcChain: AssetInfo | undefined = undefined;
        for (let i = 0; i < data["btc_main"].length; i++) {
          const element: btc_Address | undefined = data["btc_main"][i];
          if (element) {
            if (!btcChain) {
              btcChain = {
                chain: "BTC",
                balance: BI.from(0),
              };
            }

            btcChain.balance = btcChain.balance.add(element.final_balance);
          }
        }
        if (btcChain) {
          assetList.push(btcChain);
        }
      }
      if (data["ckb_main"]) {
        let ckbChain: AssetInfo | undefined = undefined;
        DataManager.instance.tokens.spore.length = 0;
        for (let i = 0; i < data["ckb_main"].length; i++) {
          const element: ckb_AddressInfo | undefined = data["ckb_main"][i];
          if (element) {
            if (!ckbChain) {
              ckbChain = {
                chain: "CKB",
                balance: BI.from(0),
              };
            }

            ckbChain.balance = ckbChain.balance.add(
              element.addressInfo.data[0].attributes.balance
            );

            DataManager.instance.curLiveCells = Number.parseInt(
              element.addressInfo.data[0].attributes.live_cells_count
            );

            if (element.addressInfo.data[0].attributes.udt_accounts) {
              for (
                let i = 0;
                i < element.addressInfo.data[0].attributes.udt_accounts.length;
                i++
              ) {
                const item =
                  element.addressInfo.data[0].attributes.udt_accounts[i];
                if (item.udt_type == "spore_cell") {
                  DataManager.instance.tokens.spore.push(item.amount);
                } else if (item.udt_type == "sudt") {
                  DataManager.instance.tokens.udt.push({
                    type: "sUDT",
                    balance: item.amount,
                    symbol: item.symbol,
                  });
                } else if (item.udt_type == "omiga_inscription") {
                  DataManager.instance.tokens.udt.push({
                    type: "xUDT",
                    balance: item.amount,
                    symbol: item.symbol,
                  });
                }
              }
            }
          }
        }
        if (ckbChain) {
          assetList.push(ckbChain);
          hasTabs = true;
        }
      }

      if (hasTabs) {
        EventManager.instance.publish(EventType.dashboard_page_show_tabs, {});
      } else {
        EventManager.instance.publish(EventType.dashboard_page_hide_tabs, {});
      }
    }

    DataManager.instance.curAsset = assetList;
    EventManager.instance.publish(EventType.dashboard_assets_show, {});
    return assetList;
  }

  public async getTransactions(address: string, page: number = 1) {
    if (page == 1) {
      EventManager.instance.publish(EventType.transaction_item_hide, {});
    }

    const rs = await superagent
      .post(`${this._host}/api/transactions`)
      .set("Content-Type", "application/json")
      .send({
        addrList: [address],
        page: page,
      })
      .catch((err) => {
        console.error(err);
      });

    const btc_TxList: btc_Address[] = [];
    const ckb_TxList: ckb_TxInfo[] = [];
    if (rs && rs.status == 200) {
      const data = JSON.parse(rs.text);
      if (data["btc_main"]) {
        btc_TxList.push(...data["btc_main"]);
      }

      if (data["ckb_main"]) {
        ckb_TxList.push(...data["ckb_main"]);
      }
    }

    const txInfoList: txInfo[] = [];
    if (btc_TxList.length > 0) {
      for (let i = 0; i < btc_TxList.length; i++) {
        const element = btc_TxList[i];
        if (element.txs) {
          for (let j = 0; j < element.txs.length; j++) {
            const itemTx = element.txs[j];

            txInfoList.push({
              txHash: itemTx.hash,
              txIndex: itemTx.tx_index,
              blockNumber: itemTx.block_height.toString(),
            });
          }
        }
      }
    }
    if (ckb_TxList.length > 0) {
      for (let i = 0; i < ckb_TxList.length; i++) {
        const element = ckb_TxList[i];
        if (element.objects) {
          for (let j = 0; j < element.objects.length; j++) {
            const itemTx = element.objects[j];

            txInfoList.push({
              txHash: itemTx.txHash,
              txIndex: Number(itemTx.txIndex).toString(),
              blockNumber: Number(itemTx.blockNumber).toString(),
            });
          }
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
