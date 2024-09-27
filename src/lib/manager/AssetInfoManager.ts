import { BI, Script, utils } from "@ckb-lumos/lumos";
import { xudt_info } from "../interface";
import { CkbHepler } from "../wallet/CkbHelper";
import { EventManager } from "./EventManager";
import { EventType } from "../enum";
import { unserializeTokenInfo } from "../utils";

class AssetInfoManager {
  constructor() {}

  private infoData: { [key: string]: xudt_info } = {};

  private checking: { [key: string]: boolean } = {};

  private async findXudtInfo(xudtTS: Script) {
    const hash = utils.computeScriptHash(xudtTS);

    const txInfo = await CkbHepler.instance.indexer.getTransactions(
      {
        groupByTransaction: true,
        script: xudtTS,
        scriptType: "type",
      },
      {
        order: "asc",
        sizeLimit: 1,
      }
    );

    const ckTxInfo = await CkbHepler.instance.getTxInfo(
      txInfo.objects[0].txHash
    );

    const idx = BI.from(txInfo.objects[0].cells[0][1]).toNumber();
    const info = ckTxInfo?.data.attributes.display_outputs[idx].extra_info;
    if (
      info &&
      info != undefined &&
      info.symbol &&
      info.symbol.length > 0 &&
      info.decimal
    ) {
      const info = ckTxInfo.data.attributes.display_outputs[idx].extra_info;
      if (info) {
        this.infoData[hash] = {
          symbol: info.symbol,
          name: info.name,
          decimal: parseInt(info.decimal),
        };
        // EventManager.instance.publish(EventType.dashboard_tokens_reload, {});
      }
    } else if (
      ckTxInfo &&
      ckTxInfo.data.attributes.display_outputs.length >= 3
    ) {
      const outputData = await CkbHepler.instance.getCellOutPutData(
        ckTxInfo.data.attributes.display_outputs[0].id
      );


      if (outputData) {
        const info = unserializeTokenInfo(outputData.data.attributes.data);
        this.infoData[hash] = info;


        // EventManager.instance.publish(EventType.dashboard_tokens_reload, {});
      }
    }
    return this.infoData[hash]
  }

  async getXUDTInfo(xudtTS: Script) {
    const hash = utils.computeScriptHash(xudtTS);

    if (this.infoData[hash]) {
      return this.infoData[hash];
    }

    const info = localStorage ? localStorage.getItem(hash): '';
    if (!info) {
      if (!this.checking[hash]) {
        this.checking[hash] = true;
        // await this.findXudtInfo(xudtTS)
        //   .catch((err) => {
        //     console.error(err);
        //   })
        //   .finally(() => {
        //     this.checking[hash] = false;
        //   });


       let dataUDT =  await this.findXudtInfo(xudtTS);
        this.checking[hash] = false;
       return dataUDT
      }
    } else {
      const data = JSON.parse(info) as xudt_info;
      if (!this.infoData[hash]) {
        this.infoData[hash] = data;
      }
      return data;
    }
  }
}

export const assetInfoMgr = new AssetInfoManager();
