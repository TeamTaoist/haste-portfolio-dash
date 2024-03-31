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
import { useState } from "react";

export function SendSpore() {
  const [receiveAddress, setReceiverAddress] = useState("");

  const handleSend = () => {
    const curAccount = DataManager.instance.getCurAccount();
    const wallet = DataManager.instance.walletInfo[curAccount.addr];

    console.log(receiveAddress, wallet.address);

    if (wallet.type == "joyid") {
      CkbHepler.instance
        .transfer_spore({
          from: wallet.address,
          to: receiveAddress.trim(),
          amount: 0,
          typeScript: {
            codeHash:
              "0x5e063b4c0e7abeaa6a428df3b693521a3050934cf3b0ae97a800d1bc31449398",
            args: "0xa42dfb08a52a073b1a6ade72087b715751c5094a17bcdcab2a4335abdcf5c898",
            hashType: "data1",
          },
        })
        .then((rs) => {
          console.log("Success send txHash", rs);

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
    } else {
      toast({
        title: "Warning",
        description: "Please use ckb wallet",
        variant: "destructive",
      });
    }
  };

  return (
    <TabsContent value="SendSpore" className="space-y-4">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Send_Spore</CardTitle>
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
                <Label htmlFor="name">DOBs</Label>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Send Address</Label>
                <Label htmlFor="name">
                  {sortStr(DataManager.instance.getCurAccount()?.addr, 6)}
                </Label>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={handleSend}>Send</Button>
        </CardFooter>
      </Card>
    </TabsContent>
  );
}
