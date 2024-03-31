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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export function SendSudt() {
  const [receiveAddress, setReceiverAddress] = useState("");
  const [amount, setAmount] = useState("");

  const handlerDeployNewToken = () => {
    const curAccount = DataManager.instance.getCurAccount();
    const wallet = DataManager.instance.walletInfo[curAccount.addr];

    console.log(wallet.address);
    if (wallet.type == "joyid") {
      CkbHepler.instance
        .deploy_sudt(wallet.address, 1000000)
        .then((rs) => {
          console.log("Success deploy", rs);

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

  const handleSend = () => {
    const curAccount = DataManager.instance.getCurAccount();
    const wallet = DataManager.instance.walletInfo[curAccount.addr];

    console.log(receiveAddress, amount, wallet.address);

    if (wallet.type == "joyid") {
      const sendAmount = amount;
      console.log(sendAmount);

      CkbHepler.instance
        .transfer_udt({
          from: wallet.address,
          to: receiveAddress.trim(),
          amount: sendAmount,
          typeScript: {
            codeHash:
              "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
            args: "0x30452490e0f5bc2b2c832ed04a349be90cab3f25aaece06612195642f61fa114",
            hashType: "type",
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
    <TabsContent value="SendSUDT" className="space-y-4">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Send_SUDT</CardTitle>
          {/* <CardDescription>Deploy your new project in one-click.</CardDescription> */}
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name" className="text-left">
                  Select UDT
                </Label>
                <Select>
                  <SelectTrigger className="w-[100%]">
                    <SelectValue placeholder="Select a fruit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Fruits</SelectLabel>
                      <SelectItem value="apple">Apple</SelectItem>
                      <SelectItem value="banana">Banana</SelectItem>
                      <SelectItem value="blueberry">Blueberry</SelectItem>
                      <SelectItem value="grapes">Grapes</SelectItem>
                      <SelectItem value="pineapple">Pineapple</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name" className="text-left">
                  Receive Address
                </Label>
                <Input
                  id="receiver"
                  placeholder="Receive Address"
                  value={receiveAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name" className="text-left">
                  Amount
                </Label>
                <Input
                  id="amount"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name" className="text-left">
                  Send Address
                </Label>
                <Label htmlFor="name">
                  {sortStr(DataManager.instance.getCurAccount()?.addr, 6)}
                </Label>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handlerDeployNewToken}>
            Deploy New Token
          </Button>
          <Button onClick={handleSend}>Send</Button>
        </CardFooter>
      </Card>
    </TabsContent>
  );
}
