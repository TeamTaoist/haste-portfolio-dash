import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { EventType } from "@/lib/enum";
import { WalletInfo, ckb_SporeInfo } from "@/lib/interface";
import { DataManager } from "@/lib/manager/DataManager";
import { EventManager } from "@/lib/manager/EventManager";
import { sortStr } from "@/lib/utils";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { useEffect, useState } from "react";
import { isTestNet } from "@/lib/wallet/constants";
import { RGBHelper } from "@/lib/wallet/RGBHelper";
import { accountStore } from "@/store/AccountStore";

export function TabRgbSpore() {
  const [reload, setReload] = useState(false);
  const [toAddress, setToAddress] = useState<string>("");
  // const [chooseSpore, setChooseSpore] = useState<ckb_SporeInfo>();

  // const spores = DataManager.instance.tokens.spore;
  const rgbs = DataManager.instance.curRgbAssert;

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

  const handlerConfirm = (
    spore: ckb_SporeInfo,
    rgbTxHash: string,
    rgbIdx: number
  ) => {
    const sporeTypeScript = spore.type_script;

    console.log("spore type script:", sporeTypeScript);

    if (toAddress.length <= 0) {
      toast({
        title: "Warning",
        description: "to address is empty",
        variant: "destructive",
      });
      return;
    }

    const curAccount = DataManager.instance.getCurAccount();
    if (!curAccount) {
      toast({
        title: "Warning",
        description: "Please choose a wallet",
        variant: "destructive",
      });
      return;
    }

    const wallet = accountStore.getWallet(curAccount);
    if (!wallet) {
      throw new Error("Please choose a wallet");
    }

    if (wallet.chain != "BTC") {
      toast({
        title: "Warning",
        description: "Please use BTC wallet",
        variant: "destructive",
      });
      return;
    }

    RGBHelper.instance
      .transferRgbSpore(
        toAddress,
        rgbTxHash,
        rgbIdx,
        spore.type_script,
        wallet as WalletInfo
      )
      .then((txHash) => {
        console.log("===== transfer spore success", txHash);

        toast({
          title: "Success",
          description: txHash,
        });
      })
      .catch((err) => {
        console.error(err);

        toast({
          title: "Warning",
          description: err.message,
          variant: "destructive",
        });
      });
  };

  const handleDialogOpenChange = (e) => {
    if (e) {
      setToAddress("");
    }
  };

  return (
    <TabsContent value="RGB++DOBs" className="space-y-4">
      <div hidden={true}>{reload ? "1" : "2"}</div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {rgbs &&
          rgbs.map((rgb, index) =>
            !rgb.ckbCellInfo || rgb.ckbCellInfo.udt_type != "spore_cell" ? (
              ""
            ) : (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    RGB DOBs
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
                  <div className="flex flex-col justify-center">
                    <div className="w-32 h-32 overflow-hidden mx-auto">
                      <img
                        src={
                          isTestNet()
                            ? `https://a-simple-demo.spore.pro/api/media/${rgb.ckbCellInfo.amount}`
                            : `https://philosopherstone.xyz/api/media/${rgb.ckbCellInfo.amount}`
                        }
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                    <div className="text-2xl font-bold">
                      #{sortStr(rgb.ckbCellInfo.type_hash, 3)}
                    </div>
                  </div>
                  <Dialog onOpenChange={handleDialogOpenChange}>
                    <DialogTrigger asChild>
                      <Button className="relative mt-2 border-none font-SourceSanPro">
                        发送 DOBs
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>发送 DOBs</DialogTitle>
                        <DialogDescription>
                          * 注意请使用正确的地址
                        </DialogDescription>
                      </DialogHeader>
                      <Separator />
                      <div className="flex flex-col gap-4">
                        <img
                          src={
                            isTestNet()
                              ? `https://a-simple-demo.spore.pro/api/media/${rgb.ckbCellInfo.amount}`
                              : `https://philosopherstone.xyz/api/media/${rgb.ckbCellInfo.amount}`
                          }
                          className="w-full h-full object-cover object-center"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username" className="text-right">
                          接收地址
                        </Label>
                        <Input
                          id="toAddress"
                          value={toAddress}
                          onChange={(e) => {
                            setToAddress(e.target.value.trim());
                          }}
                          className="col-span-3"
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          type="submit"
                          onClick={() =>
                            handlerConfirm(
                              rgb.ckbCellInfo as ckb_SporeInfo,
                              rgb.txHash,
                              rgb.idx
                            )
                          }
                        >
                          确认发送
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
