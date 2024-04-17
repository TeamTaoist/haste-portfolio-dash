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
import { accountStore } from "@/store/AccountStore";
import { HttpManager } from "@/lib/api/HttpManager";

export function TabUdt() {
  const [reload, setReload] = useState(false);
  const [toAddress, setToAddress] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [isRgb, setIsRgb] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [chooseUdt, setChooseUdt] = useState<ckb_UDTInfo>();

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

  const handlerTransfer = (udt?: ckb_UDTInfo) => {
    console.log("send udt", udt);

    if (!udt) {
      toast({
        title: "Warning",
        description: "Cannot find choose one",
        variant: "destructive",
      });
      return;
    }

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

    if (isRgb) {
      RGBHelper.instance
        .getRgbppAssert(toAddress)
        .then((rs) => {
          rs.sort((a, b) => {
            return a.value > b.value ? 1 : -1;
          });

          let findUtxo: RgbAssert | undefined = undefined;
          // find same utxo
          for (let i = 0; i < rs.length; i++) {
            const utxo = rs[i];
            if (
              utxo.ckbCellInfo &&
              utxo.ckbCellInfo.type_script.args == udt.type_script.args &&
              utxo.ckbCellInfo.type_script.codeHash ==
                udt.type_script.codeHash &&
              utxo.ckbCellInfo.type_script.hashType == udt.type_script.hashType
            ) {
              findUtxo = utxo;
              break;
            }
          }
          // find empty utxo
          if (!findUtxo) {
            for (let i = 0; i < rs.length; i++) {
              const utxo = rs[i];
              if (!utxo.ckbCellInfo && utxo.value <= 1000) {
                findUtxo = utxo;
                break;
              }
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

                if (accountStore.currentAddress) {
                  HttpManager.instance.getAsset(accountStore.currentAddress);
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
          if (accountStore.currentAddress) {
            HttpManager.instance.getAsset(accountStore.currentAddress);
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
    }
  };

  const handlerDialogOpenChange = (e) => {
    if (!e) {
      handleCloseDialog();
    }
  };

  const handleOpenDialog = (udt: ckb_UDTInfo) => {
    setIsRgb(true);
    setAmount(0);
    setToAddress("");
    setIsOpen(true);
    setChooseUdt(udt);
  };

  const handleWithDraw = (udt: ckb_UDTInfo) => {
    CkbHepler.instance
      .withDrawXUDT(udt.type_script)
      .then((txHash) => {
        toast({
          title: "Success",
          description: txHash,
        });

        if (accountStore.currentAddress) {
          HttpManager.instance.getAsset(accountStore.currentAddress);
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
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
  };

  return (
    <TabsContent value="UDT" className="space-y-4">
      <div hidden={true}>{reload ? "1" : "2"}</div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {udts.map((udt) => (
          <Card key={udt.type_hash + (udt.isPending ? "_pending" : "")}>
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
                {import.meta.env.VITE_OpenXudtMelt != "1" ? (
                  <DialogTrigger asChild>
                    {udt.isPending ? (
                      <p>交易确认中</p>
                    ) : (
                      <Button
                        className="relative mt-2 border-none font-SourceSanPro"
                        onClick={() => handleOpenDialog(udt)}
                      >
                        发送 {getSymbol(udt.type_script)}
                      </Button>
                    )}
                  </DialogTrigger>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                    <DialogTrigger asChild>
                      {udt.isPending ? (
                        <p>交易确认中</p>
                      ) : (
                        <Button
                          className="relative mt-2 border-none font-SourceSanPro"
                          onClick={() => handleOpenDialog(udt)}
                        >
                          发送 {getSymbol(udt.type_script)}
                        </Button>
                      )}
                    </DialogTrigger>
                    <Button
                      className="relative mt-2 border-none font-SourceSanPro"
                      onClick={() => handleWithDraw(udt)}
                    >
                      Melt销毁
                    </Button>
                  </div>
                )}
                <DialogContent className="bg-primary006 !border-none">
                  <Tabs defaultValue="rgb++" className="w-[100%]">
                    <TabsList className="w-[100%]">
                      <TabsTrigger
                        value="rgb++"
                        className="w-[50%]"
                        onClick={() => setIsRgb(true)}
                      >
                        发送 {getSymbol(chooseUdt?.type_script)} 到 BTC
                      </TabsTrigger>
                      <TabsTrigger
                        value={getSymbol(chooseUdt?.type_script)}
                        className="w-[50%]"
                        onClick={() => setIsRgb(false)}
                      >
                        发送 {getSymbol(chooseUdt?.type_script)} 到 CKB
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="rgb++">
                      <DialogHeader>
                        <DialogTitle>
                          使用 RGB++ 协议发送到 BTC 链上
                        </DialogTitle>
                        <DialogDescription className="!text-white001">
                          * 注意使用正确的 BTC 地址，目前只支持 Taproot 和
                          Segwit
                        </DialogDescription>
                      </DialogHeader>
                    </TabsContent>
                    <TabsContent value={getSymbol(chooseUdt?.type_script)}>
                      <DialogHeader>
                        <DialogTitle>
                          发送 {getSymbol(chooseUdt?.type_script)}
                        </DialogTitle>
                        <DialogDescription className="!text-white001">
                          * 注意使用正确的 CKB 地址
                        </DialogDescription>
                      </DialogHeader>
                    </TabsContent>
                  </Tabs>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">
                      数量
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        if (
                          parseFloat(e.target.value) >
                          parseFloat(
                            formatUnit(
                              chooseUdt?.amount ? chooseUdt.amount : 0,
                              "ckb"
                            )
                          )
                        ) {
                          setAmount(
                            parseFloat(
                              formatUnit(
                                chooseUdt?.amount ? chooseUdt.amount : 0,
                                "ckb"
                              )
                            )
                          );
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
                      {isRgb ? "BTC" : "CKB"} 地址
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
                      onClick={() => handlerTransfer(chooseUdt)}
                    >
                      确认发送
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
