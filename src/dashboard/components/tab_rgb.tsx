import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventType } from "@/lib/enum";
import { DataManager } from "@/lib/manager/DataManager";
import { EventManager } from "@/lib/manager/EventManager";
import { useEffect, useState } from "react";
import { formatUnit } from "@ckb-lumos/bi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RgbAssert } from "@/lib/interface";
import { CkbHepler } from "@/lib/wallet/CkbHelper";
import { toast } from "@/components/ui/use-toast";
import { RGBHelper } from "@/lib/wallet/RGBHelper";
import { BI } from "@ckb-lumos/lumos";
import { accountStore } from "@/store/AccountStore";

export function TabRgb() {
  const [reload, setReload] = useState(false);
  const [toAddress, setToAddress] = useState<string>("");
  const [isRgb, setIsRgb] = useState(true);
  // const [amount, setAmount] = useState<number>(0);

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

  const rgbs = DataManager.instance.curRgbAssert;

  const handlerTransfer = (rgb: RgbAssert) => {
    if (toAddress.length <= 0) {
      toast({
        title: "Warning",
        description: "to address is empty",
        variant: "destructive",
      });
      return;
    }

    console.log(rgb);
    if (!rgb.ckbCellInfo) {
      toast({
        title: "Warning",
        description: "No cell info",
        variant: "destructive",
      });
      return;
    }

    CkbHepler.instance
      .getUDTInfo(rgb.ckbCellInfo.type_hash)
      .then((rs) => {
        console.log(rs);

        const curAccount = DataManager.instance.getCurAccount();
        if (!curAccount) {
          toast({
            title: "Warning",
            description: "Please choose a wallet",
            variant: "destructive",
          });
          return;
        }

        if (!isRgb) {
          // transfer to other btc
          RGBHelper.instance
            .transfer_btc_to_btc(
              rgb.txHash,
              rgb.idx,
              toAddress,
              {
                codeHash: rs["data"]["attributes"]["type_script"]["code_hash"],
                hashType: rs["data"]["attributes"]["type_script"]["hash_type"],
                args: rs["data"]["attributes"]["type_script"]["args"],
              },
              BI.from(rgb.ckbCellInfo?.amount).toBigInt()
            )
            .then((rs) => {
              console.log("btc to btc tx hash:", rs);

              toast({
                title: "Success",
                description: rs,
              });

              accountStore.setCurrentAddress(curAccount);
            })
            .catch((err) => {
              console.error(err.message);

              toast({
                title: "Warning",
                description: err.message,
                variant: "destructive",
              });
            });
        } else {
          RGBHelper.instance
            .transfer_btc_to_ckb(
              toAddress,
              {
                codeHash: rs["data"]["attributes"]["type_script"]["code_hash"],
                hashType: rs["data"]["attributes"]["type_script"]["hash_type"],
                args: rs["data"]["attributes"]["type_script"]["args"],
              },
              BI.from(rgb.ckbCellInfo?.amount).toBigInt(),
              rgb.txHash,
              rgb.idx
            )
            .then((rs) => {
              console.log("ckb to btc tx hash:", rs);

              toast({
                title: "Success",
                description: rs,
              });

              accountStore.setCurrentAddress(curAccount);
            })
            .catch((err) => {
              console.error(err.message);

              toast({
                title: "Warning",
                description: err.message,
                variant: "destructive",
              });
            });
        }
      })
      .catch((err) => {
        console.error(err.message);

        toast({
          title: "Warning",
          description: err.message,
          variant: "destructive",
        });
      });
  };

  const handlerDialogOpenChange = (e) => {
    if (e) {
      setToAddress("");
    }
  };

  return (
    <TabsContent value="RGB++" className="space-y-4">
      <div hidden={true}>{reload ? "1" : "2"}</div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {rgbs.map((rgb) =>
          !rgb.ckbCellInfo ? (
            ""
          ) : (
            <Card key={rgb.ckbCellInfo.type_hash}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {rgb.ckbCellInfo.udt_type}
                </CardTitle>
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
                  {formatUnit(rgb.ckbCellInfo.amount, "ckb")}
                </div>
                <p className="text-xs text-muted-foreground">
                  {rgb.ckbCellInfo.symbol}
                </p>
                <Dialog onOpenChange={handlerDialogOpenChange}>
                  <DialogTrigger asChild>
                    <Button className="relative mt-2 border-none font-SourceSanPro">
                      Transfer {rgb.ckbCellInfo.symbol}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <Tabs defaultValue="rgb++" className="w-[100%]">
                      <TabsList className="w-[100%]">
                        <TabsTrigger
                          value="rgb++"
                          className="w-[50%]"
                          onClick={() => setIsRgb(true)}
                        >
                          RGB++
                        </TabsTrigger>
                        <TabsTrigger
                          value={rgb.ckbCellInfo.symbol}
                          className="w-[50%]"
                          onClick={() => setIsRgb(false)}
                        >
                          {rgb.ckbCellInfo.symbol}
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="rgb++">
                        <DialogHeader>
                          <DialogTitle>Transfer to CKB use RGB++</DialogTitle>
                          <DialogDescription className="!text-white001">
                            * Make sure type correct wallet address
                          </DialogDescription>
                        </DialogHeader>
                      </TabsContent>
                      <TabsContent value={rgb.ckbCellInfo.symbol}>
                        <DialogHeader>
                          <DialogTitle>
                            Transfer {rgb.ckbCellInfo.symbol}
                          </DialogTitle>
                          <DialogDescription className="!text-white001">
                            * Make sure type correct wallet address
                          </DialogDescription>
                        </DialogHeader>
                      </TabsContent>
                    </Tabs>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="username" className="text-right">
                        To Address
                      </Label>
                      <Input
                        id="toAddress"
                        value={toAddress}
                        onChange={(e) => {
                          setToAddress(e.target.value);
                        }}
                        className="col-span-3"
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        onClick={() => handlerTransfer(rgb)}
                      >
                        Confirm
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </TabsContent>
  );
}
