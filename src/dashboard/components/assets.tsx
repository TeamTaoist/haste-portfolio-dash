import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventType } from "@/lib/enum";
import { DataManager } from "@/lib/manager/DataManager";
import { EventManager } from "@/lib/manager/EventManager";
import { useEffect, useState } from "react";
import { formatUnit } from "@ckb-lumos/bi";
import { observer } from "mobx-react";
import { accountStore } from "@/store/AccountStore";
import { RGBHelper } from "@/lib/wallet/RGBHelper";
import { RgbAssert } from "@/lib/interface";

export const Assets = observer(() => {
  const assetList = DataManager.instance.curAsset;
  const [hide, setHide] = useState(false);
  const [rgbAssetList, setRgbAssetList] = useState<RgbAssert[]>();

  const getRgbAsset = async () => {
    if (accountStore.currentAddress) {
      const wallet = accountStore.getWallet(accountStore.currentAddress);
      if (wallet && wallet.chain == "BTC") {
        const RgbAssetListRlt = await RGBHelper.instance.getRgbppAssert(
          accountStore.currentAddress
        );
        setRgbAssetList(RgbAssetListRlt);
        console.log("====>", rgbAssetList);
      }
    }
  };

  useEffect(() => {
    EventManager.instance.subscribe(EventType.dashboard_assets_show, () => {
      setHide(false);
    });
    EventManager.instance.subscribe(EventType.dashboard_assets_hide, () => {
      setHide(true);
    });

    return () => {
      EventManager.instance.unsubscribe(EventType.dashboard_assets_show, () => {
        setHide(false);
      });
      EventManager.instance.unsubscribe(EventType.dashboard_assets_hide, () => {
        setHide(true);
      });
    };
  }, []);

  useEffect(() => {
    getRgbAsset();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 ">
      {assetList.map((asset) => (
        <Card
          key={asset.chain}
          hidden={hide}
          className="bg-primary004 border-2 border-primary006"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white001 font-Montserrat">
              {asset.chain}
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#faf9f9"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-dollar-sign"
            >
              <line x1="12" x2="12" y1="2" y2="22" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>{" "}
          </CardHeader>
          <CardContent className="pb-4 text-left">
            <div className="text-2xl font-bold text-white">
              {formatUnit(asset.balance, "ckb")}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
