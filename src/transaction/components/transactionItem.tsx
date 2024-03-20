import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EventType } from "@/lib/enum";
import { DataManager } from "@/lib/manager/DataManager";
import { EventManager } from "@/lib/manager/EventManager";
import { useEffect, useState } from "react";

export function TransactionItem() {
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

  return (
    <>
      <div hidden={true}>{loadmore ? 1 : 2}</div>
      <ScrollArea className="flex h-[550px] rounded-md border p-4">
        {txList.map((tx) => (
          <Card key={tx.txHash} hidden={hide} className="m-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground">
                block:{tx.blockNumber}
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tx.txHash}</div>
            </CardContent>
          </Card>
        ))}
      </ScrollArea>
    </>
  );
}
