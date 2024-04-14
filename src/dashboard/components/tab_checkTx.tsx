import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { EventType } from "@/lib/enum";
import { EventManager } from "@/lib/manager/EventManager";
import { RGBHelper } from "@/lib/wallet/RGBHelper";
import { TabsContent } from "@radix-ui/react-tabs";
import { useEffect, useState } from "react";

export function TabCheckTx() {
  const [txHash, setTxHash] = useState("");

  const [result, setResult] = useState("");

  const handleCheckTx = async (txHash: string) => {
    if (txHash.length <= 0) {
      toast({
        title: "Warning",
        description: "No transaction hash",
        variant: "destructive",
      });
      return;
    }

    const retryStat = await RGBHelper.instance
      .retryBtcTxId(txHash)
      .catch((err) => {
        toast({
          title: "Warning",
          description: err.message,
          variant: "destructive",
        });
      });

    if (retryStat) {
      setResult(JSON.stringify(retryStat));
    }
  };

  useEffect(() => {
    EventManager.instance.subscribe(EventType.dashboard_checkRgb_reload, () => {
      setTxHash("");
      setResult("");
    });

    return () => {
      EventManager.instance.unsubscribe(
        EventType.dashboard_checkRgb_reload,
        () => {
          setTxHash("");
          setResult("");
        }
      );
    };
  }, []);

  return (
    <TabsContent value="CheckTx" className="space-y-4">
      <div className="grid gap-1 md:grid-cols-1 lg:grid-cols-1">
        <Card key={Date.now()}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {"获取RGB++资产交易状态"}
            </CardTitle>
            {/* <svg
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
            </svg> */}
          </CardHeader>
          <CardContent>
            <div className="flex grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className=" text-right w-36">
                BTC交易哈希
              </Label>
              <Input
                id="txHash"
                type="string"
                value={txHash}
                onChange={(e) => {
                  setTxHash(e.target.value);
                }}
                className="col-span-3"
              />
              <Button type="submit" onClick={() => handleCheckTx(txHash)}>
                检查
              </Button>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <p>{result.length > 0 ? result : ""}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
