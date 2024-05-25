import { getEnv } from "../../settings/env";
import { btc_utxo, RgbAssert } from "../../types/BTC";
import { getUtxo } from "../btc/memepool";
import { helpers } from "@ckb-lumos/lumos";
import { getXudtAndSpore } from "../ckb/tools";
import { buildRgbppLockArgs, genRgbppLockScript } from "@rgbpp-sdk/ckb"
import superagent from "superagent";
import {BtcAssetsApi} from "@rgbpp-sdk/service";
import {DataSource} from "@rgbpp-sdk/btc";
import {mainConfig, testConfig} from "../../lib/wallet/constants.ts";


export const getRgbAssets = async (address:string) =>{
  const cfg = getEnv() === 'Testnet' ? testConfig : mainConfig;

  const result = await superagent
      .get(`${cfg.BTC_ASSETS_API_URL}/rgbpp/v1/address/${address}/assets?no_cache=false`)
      .set("Origin",cfg.BTC_ASSETS_ORGIN)
      .set("Authorization",`Bearer ${cfg.BTC_ASSETS_TOKEN}`)
  ;

  if (result.status === 200) {
    return result.body;
  }
}


export const getRgbppAssert = async(address: string) => {
    const result: btc_utxo[] | undefined = await getUtxo(
      address
    );

    const rgbAssertList: RgbAssert[] = [];

    if (result) {
      const rgbppLockArgsList: {
        args: string;
        txHash: string;
        idx: number;
        value: number;
      }[] = [];
      for (let i = 0; i < result.length; i++) {
        const element = result[i];
        const rgbArgs = buildRgbppLockArgs(element.vout, element.txid);
        rgbppLockArgsList.push({
          args: rgbArgs,
          txHash: element.txid,
          idx: element.vout,
          value: element.value,
        });
      }
      const rgbppLocks = rgbppLockArgsList.map((item) => {
        const lock = genRgbppLockScript(item.args, getEnv() === 'Mainnet');

        return {
          lock,
          txHash: item.txHash,
          idx: item.idx,
          value: item.value,
        };
      });
      // const xudtTypeScript = getXudtTypeScript(isMainnet);
      for await (const rgbppLock of rgbppLocks) {
        const address = helpers.encodeToAddress(rgbppLock.lock);
        const { xudtList, sporeList } = await getXudtAndSpore(address);

        if (xudtList.length > 0) {
          for (let i = 0; i < xudtList.length; i++) {
            const xudt = xudtList[i];
            rgbAssertList.push({
              txHash: rgbppLock.txHash,
              idx: rgbppLock.idx,
              ckbCellInfo: xudt,
              value: rgbppLock.value,
            });
          }
        } else if (sporeList.length > 0) {
          for (let i = 0; i < sporeList.length; i++) {
            const spore = sporeList[i];
            rgbAssertList.push({
              txHash: rgbppLock.txHash,
              idx: rgbppLock.idx,
              ckbCellInfo: spore,
              value: rgbppLock.value,
            });
          }
        } else {
          rgbAssertList.push({
            txHash: rgbppLock.txHash,
            idx: rgbppLock.idx,
            value: rgbppLock.value,
          });
        }
      }
    }


    return rgbAssertList;
  }
