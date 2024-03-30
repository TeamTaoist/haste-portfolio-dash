import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { EventType } from "@/lib/enum";
import { DataManager } from "@/lib/manager/DataManager";
import { EventManager } from "@/lib/manager/EventManager";
import { sortStr } from "@/lib/utils";
import { BI } from "@ckb-lumos/lumos";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { useEffect, useState } from "react";

export function TabSpore() {
  const [reload, setReload] = useState(false);
  const [toAddress, setToAddress] = useState<string>("");

  const spores = DataManager.instance.tokens.spore;
  useEffect(() => {
    EventManager.instance.subscribe(EventType.dashboard_tokens_reload, () => {
      setReload(!reload);
    });

    return () => {
      EventManager.instance.unsubscribe(
        EventType.dashboard_tokens_reload,
        () => {
          setReload(!reload);
        }
      );
    };
  }, [reload]);

  return (
    <TabsContent value="SPORE" className="space-y-4">
      <div hidden={true}>{reload ? "1" : "2"}</div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {spores &&
          spores.map((spore) => (
            <Card key={spore.type_hash}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SPORE</CardTitle>
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
                <div className="flex flex-col justify-center">
                  <div className="w-32 h-32 overflow-hidden mx-auto">
                    <img src={`https://a-simple-demo.spore.pro/api/media/${BI.from(spore.amount).toHexString()}`} className="w-full h-full object-cover object-center"/>
                  </div>
                  <div className="text-2xl font-bold">
                    #{sortStr(spore.type_hash, 3)}
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="relative mt-2 border-none font-SourceSanPro">
                      Transfer Spore
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Transfer Spore</DialogTitle>
                      <DialogDescription>
                        * Make sure type correct wallet address
                      </DialogDescription>
                    </DialogHeader>
                    <Separator />
                    <div className="flex flex-col gap-4">
                      <img src={`https://a-simple-demo.spore.pro/api/media/${BI.from(spore.amount).toHexString()}`} className="w-full h-full object-cover object-center"/>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="username" className="text-right">
                        To Address
                      </Label>
                      <Input id="toAddress" value={toAddress} onChange={(e) => {
                        setToAddress(e.target.value)
                      }} className="col-span-3" />
                    </div>
                    <DialogFooter>
                      <Button type="submit">Confirm</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
      </div>
    </TabsContent>
  );
}
