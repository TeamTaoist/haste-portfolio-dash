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
import { ckb_UDTInfo } from "@/lib/interface";
import { CkbHepler } from "@/lib/wallet/CkbHelper";
import { toast } from "@/components/ui/use-toast";
import { parseUnit } from "@ckb-lumos/bi";
import { TabsList } from "@radix-ui/react-tabs";

export function TabUdt() {
  const [reload, setReload] = useState(false);
  const [toAddress, setToAddress] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);

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

    CkbHepler.instance
      .getUDTInfo(udt.type_hash)
      .then((rs) => {
        console.log(rs);

        const curAccount = DataManager.instance.getCurAccount();
        CkbHepler.instance
          .transfer_udt({
            from: curAccount.addr,
            to: toAddress,
            amount: parseUnit(amount.toString(), "ckb"),
          })
          .then((txHash) => {
            console.log("transfer udt txHash", txHash);

            toast({
              title: "Success",
              description: txHash,
            });
          })
          .catch((err) => {
            console.error(err.message);

            toast({
              title: "Warning",
              description: err.message,
              variant: "destructive",
            });
          });
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
      setAmount(0);
    }
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
              <p className="text-xs text-muted-foreground">{udt.symbol}</p>
              <Dialog onOpenChange={handlerDialogOpenChange}>
                <DialogTrigger asChild>
                  <Button className="relative mt-2 border-none font-SourceSanPro">
                    Transfer {udt.symbol}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                <Tabs defaultValue="rgb++" className="w-[100%]">
                  <TabsList className="w-[100%]">
                    <TabsTrigger value="rgb++" className="w-[50%]">RGB++</TabsTrigger>
                    <TabsTrigger value={udt.symbol} className="w-[50%]">{udt.symbol}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="rgb++">
                    <DialogHeader>
                      <DialogTitle>Transfer RGB++</DialogTitle>
                      <DialogDescription>
                        * Make sure type correct wallet address
                      </DialogDescription>
                    </DialogHeader>
                  </TabsContent>
                  <TabsContent value={udt.symbol}>
                    <DialogHeader>
                      <DialogTitle>Transfer {udt.symbol}</DialogTitle>
                      <DialogDescription>
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
                      id="toAddress"
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        setAmount(parseFloat(e.target.value));
                      }}
                      className="col-span-3"
                    />
                  </div>
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
