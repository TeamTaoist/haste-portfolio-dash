import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventType } from "@/lib/enum";
import { DataManager } from "@/lib/manager/DataManager";
import { EventManager } from "@/lib/manager/EventManager";
import { useEffect, useState } from "react";
import { formatUnit } from "@ckb-lumos/bi";

export function Assets() {
  const assetList = DataManager.instance.curAsset;

  const [hide, setHide] = useState(false);

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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {assetList.map((asset) => (
        <Card key={asset.chain} hidden={hide}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{asset.chain}</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatUnit(asset.balance, "ckb")}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
