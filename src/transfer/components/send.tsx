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
import { CkbHepler } from "@/lib/wallet/CkbHelper";
import { parseUnit } from "@ckb-lumos/bi";
import { observer } from "mobx-react";
import { autorun } from "mobx";
import { useEffect, useState } from "react";
import { accountStore } from "@/store/AccountStore";
import { RGBHelper } from "@/lib/wallet/RGBHelper";

export const Send = observer(() => {
  const [receiveAddress, setReceiverAddress] = useState("");
  const [amount, setAmount] = useState<number>(0);

  const handlerCancel = () => {
    setReceiverAddress("");
    setAmount(0);
  };

  const handleSend = () => {
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

    console.log(receiveAddress, amount, wallet.address);

    if (wallet.type == "joyid" && wallet.chain == "CKB") {
      const sendCkb = parseUnit(amount.toString(), "ckb");
      console.log(sendCkb);

      CkbHepler.instance
        .transfer_ckb({
          from: wallet.address,
          to: receiveAddress.trim(),
          amount: sendCkb,
        })
        .then((rs) => {
          console.log(rs);

          toast({
            title: "Success",
            description: rs,
          });

          handlerCancel();
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
      RGBHelper.instance
        .transferBTC(receiveAddress.trim(), parseUnit(amount.toString(), "ckb"))
        .then((rs) => {
          console.log("Send BTC txHash", rs);
          toast({
            title: "Success",
            description: rs,
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
    }
  };

  useEffect(() => {
    const disposer = autorun(() => {});
    return () => disposer();
  }, []);

  return (
    <TabsContent value="Send" className="space-y-4">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Send</CardTitle>
          {/* <CardDescription>Deploy your new project in one-click.</CardDescription> */}
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Receive Address</Label>
                <Input
                  id="receiver"
                  placeholder="Receive Address"
                  value={receiveAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
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
          <Button onClick={handleSend}>Send</Button>
        </CardFooter>
      </Card>
    </TabsContent>
  );
});
