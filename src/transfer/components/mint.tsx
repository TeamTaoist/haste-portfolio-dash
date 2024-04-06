import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { DataManager } from "@/lib/manager/DataManager";
import { sortStr } from "@/lib/utils";
// import { CkbHepler } from "@/lib/wallet/CkbHelper";
import { parseUnit } from "@ckb-lumos/bi";
import { observer } from "mobx-react";
import { autorun } from "mobx";
import { useEffect, useState } from "react";
import { accountStore } from "@/store/AccountStore";
import { CkbHepler } from "@/lib/wallet/CkbHelper";

export const Mint = observer(() => {
  const [amount, setAmount] = useState<number>(0);
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");

  const handlerCancel = () => {
    setAmount(0);
    setSymbol("");
    setName("");
  };

  const handleMint = () => {
    const curAccount = accountStore.currentAddress;
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

    if (wallet.type == "joyid" && wallet.chain == "CKB") {
      const mintAmount = parseUnit(amount.toString(), "ckb");
      console.log(mintAmount.toString(), name, symbol);

      if (name.length <= 0 || symbol.length <= 0 || mintAmount.lte(0)) {
        toast({
          title: "Warning",
          description: "name or symbol or amount value wrong",
          variant: "destructive",
        });
        return;
      }

      CkbHepler.instance
        .mintXUDT(name, symbol, mintAmount)
        .then((txHash) => {
          console.log("mint success", txHash);

          toast({
            title: "Success",
            description: txHash,
          });
        })
        .catch((err) => {
          console.error(err);

          toast({
            title: "Warning",
            description: err.messgae,
            variant: "destructive",
          });
        });
    }
  };

  useEffect(() => {
    const disposer = autorun(() => {});
    return () => disposer();
  }, []);

  return (
    <TabsContent value="MintXUDT" className="space-y-4">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Mint XUDT</CardTitle>
          {/* <CardDescription>Deploy your new project in one-click.</CardDescription> */}
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Symbol</Label>
                <Input
                  id="symbol"
                  placeholder="Symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Amount</Label>
                <Input
                  id="amount"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) =>
                    setAmount(
                      parseFloat(
                        e.target.value.length <= 0 ? "0" : e.target.value
                      )
                    )
                  }
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Send Address</Label>
                <Label htmlFor="name">
                  {sortStr(DataManager.instance.getCurAccount(), 6)}
                </Label>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handlerCancel}>
            Cancel
          </Button>
          <Button onClick={handleMint}>Mint</Button>
        </CardFooter>
      </Card>
    </TabsContent>
  );
});
