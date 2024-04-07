import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
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
import { RgbAssert, ckb_UDTInfo } from "@/lib/interface";
import { CkbHepler } from "@/lib/wallet/CkbHelper";
import { toast } from "@/components/ui/use-toast";
import { parseUnit } from "@ckb-lumos/bi";
import { TabsList } from "@radix-ui/react-tabs";
import { RGBHelper } from "@/lib/wallet/RGBHelper";
import { getSymbol } from "@/lib/utils";

export function TabUdt() {
  const [reload, setReload] = useState(false);
  const [toAddress, setToAddress] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [isRgb, setIsRgb] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

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

  const udts = DataManager.instance.tokens.udt;

  const handlerTransfer = (udt: ckb_UDTInfo) => {
    if (amount <= 0) {
      toast({
        title: "Warning",
        description: "Amount is wrong",
        variant: "destructive",
      });
      return;
    }

    if (toAddress.length <= 0) {
      toast({
        title: "Warning",
        description: "to address is empty",
        variant: "destructive",
      });
      return;
    }

    console.log(udt);

    if (isRgb) {
      RGBHelper.instance
        .getRgbppAssert(toAddress)
        .then((rs) => {
          rs.sort((a, b) => {
            return a > b ? 1 : -1;
          });

          let findUtxo: RgbAssert | undefined = undefined;
          for (let i = 0; i < rs.length; i++) {
            const utxo = rs[i];
            if (!utxo.ckbCellInfo) {
              findUtxo = utxo;
              break;
            }
          }

          if (!findUtxo) {
            toast({
              title: "Warning",
              description: "No can use utxo",
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

          if (findUtxo) {
            RGBHelper.instance
              .transfer_ckb_to_btc(
                findUtxo.txHash,
                findUtxo.idx,
                udt.type_script,
                parseUnit(amount.toString(), "ckb").toBigInt()
              )
              .then((rs) => {
                console.log("ckb to btc tx hash:", rs);

                toast({
                  title: "Success",
                  description: rs,
                });

                handleCloseDialog();
              })
              .catch((err) => {
                console.error(err);

                toast({
                  title: "Warning",
                  description: err.message,
                  variant: "destructive",
                });
              });
          }
        })
        .catch((err) => {
          console.error(err);

          toast({
            title: "Warning",
            description: err.message,
            variant: "destructive",
          });
        });
    } else {
      const curAccount = DataManager.instance.getCurAccount();
      if (!curAccount) {
        toast({
          title: "Warning",
          description: "Please choose a wallet",
          variant: "destructive",
        });
        return;
      }

      CkbHepler.instance
        .transfer_udt({
          from: curAccount,
          to: toAddress,
          amount: parseUnit(amount.toString(), "ckb"),
          typeScript: udt.type_script,
        })
        .then((txHash) => {
          console.log("transfer udt txHash", txHash);

          toast({
            title: "Success",
            description: txHash,
          });

          handleCloseDialog();
        })
        .catch((err) => {
          console.error(err);

          toast({
            title: "Warning",
            description: err.message,
            variant: "destructive",
          });
        });
    }
  };

  const handlerDialogOpenChange = (e) => {
    if (!e) {
      handleCloseDialog();
    }
  };

  const handleOpenDialog = () => {
    setIsRgb(true);
    setAmount(0);
    setToAddress("");
    setIsOpen(true);
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
  };

  return (
    <TabsContent value="UDT" className="space-y-4">
      <div hidden={true}>{reload ? "1" : "2"}</div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {udts.map((udt) => (
          <Card key={udt.type_hash}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {udt.udt_type}
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
                {formatUnit(udt.amount, "ckb")}
              </div>
              <p className="text-xs text-muted-foreground">
                {getSymbol(udt.type_script)}
              </p>
              <Dialog open={isOpen} onOpenChange={handlerDialogOpenChange}>
                <DialogTrigger asChild>
                  <Button
                    className="relative mt-2 border-none font-SourceSanPro"
                    onClick={handleOpenDialog}
                  >
                    Transfer {getSymbol(udt.type_script)}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-primary006 !border-none">
                  <Tabs defaultValue="rgb++" className="w-[100%]">
                    <TabsList className="w-[100%]">
                      <TabsTrigger
                        value="rgb++"
                        className="w-[50%]"
                        onClick={() => setIsRgb(true)}
                      >
                        Transfer to BTC
                      </TabsTrigger>
                      <TabsTrigger
                        value={getSymbol(udt.type_script)}
                        className="w-[50%]"
                        onClick={() => setIsRgb(false)}
                      >
                        Transfer {getSymbol(udt.type_script)} on CKB
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="rgb++">
                      <DialogHeader>
                        <DialogTitle>Transfer to BTC use RGB++</DialogTitle>
                        <DialogDescription className="!text-white001">
                          * Make sure type correct wallet address
                        </DialogDescription>
                      </DialogHeader>
                    </TabsContent>
                    <TabsContent value={getSymbol(udt.type_script)}>
                      <DialogHeader>
                        <DialogTitle>
                          Transfer {getSymbol(udt.type_script)}
                        </DialogTitle>
                        <DialogDescription className="!text-white001">
                          * Make sure type correct wallet address
                        </DialogDescription>
                      </DialogHeader>
                    </TabsContent>
                  </Tabs>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">
                      Amount
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        if (
                          parseFloat(e.target.value) >
                          parseFloat(formatUnit(udt.amount, "ckb"))
                        ) {
                          setAmount(parseFloat(formatUnit(udt.amount, "ckb")));
                        } else {
                          setAmount(
                            parseFloat(
                              e.target.value.length <= 0 ? "0" : e.target.value
                            )
                          );
                        }
                      }}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">
                      {isRgb ? "BTC" : "CKB"} Address
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
                    <Button type="submit" onClick={() => handlerTransfer(udt)}>
                      Confirm
                    </Button>
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
