import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HttpManager } from "@/lib/api/HttpManager";
import { EventType } from "@/lib/enum";
import { DataManager } from "@/lib/manager/DataManager";
import { EventManager } from "@/lib/manager/EventManager";
import { isTestNet, mainConfig, testConfig } from "@/lib/wallet/constants";
import { accountStore } from "@/store/AccountStore";
import { autorun } from "mobx";
import { observer } from "mobx-react";
import { useEffect, useState } from "react";

export const TransactionItem = observer(() => {
  const cfg = isTestNet() ? testConfig : mainConfig;

  const txList = DataManager.instance.curTxList;

  const [hide, setHide] = useState(false);

  const [loadmore, setLoadMore] = useState(false);

  useEffect(() => {
    EventManager.instance.subscribe(EventType.transaction_item_show, () => {
      setHide(false);
    });
    EventManager.instance.subscribe(EventType.transaction_item_hide, () => {
      setHide(true);
    });
    EventManager.instance.subscribe(
      EventType.transaction_item_load_more,
      () => {
        setLoadMore(!loadmore);
      }
    );

    return () => {
      EventManager.instance.unsubscribe(EventType.transaction_item_show, () => {
        setHide(false);
      });
      EventManager.instance.unsubscribe(EventType.transaction_item_hide, () => {
        setHide(true);
      });
      EventManager.instance.unsubscribe(
        EventType.transaction_item_load_more,
        () => {
          setLoadMore(!loadmore);
        }
      );
    };
  }, [loadmore]);

  useEffect(() => {
    const disposer = autorun(() => {
      if (accountStore.currentAddress) {
        HttpManager.instance.getTransactions(accountStore.currentAddress);
      }
    });
    return () => disposer();
  }, []);

  return (
    <>
      <div hidden={true}>{loadmore ? 1 : 2}</div>
      <ScrollArea className="flex flex-1 h-[550px] rounded-md border p-4">
        {txList.map((tx) => (
          <Card key={tx.txHash} hidden={hide} className="m-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground">
                block:{tx.block}
              </p>
            </CardHeader>
            <CardContent>
              <div className="font-SourceSanPro text-left flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#080808"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-chevron-right"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
                <a
                  href={
                    tx.txHash && tx.txHash.startsWith("0x")
                      ? `https://${
                          cfg.isMainnet ? "" : "pudge."
                        }explorer.nervos.org/transaction/${tx.txHash}`
                      : `https://mempool.space/${
                          cfg.isMainnet ? "" : "testnet"
                        }/tx/${tx.txHash}`
                  }
                  target="_href"
                >
                  {tx.txHash}
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </ScrollArea>
    </>
  );
});
