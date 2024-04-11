import { EventType } from "@/lib/enum";
import { EventManager } from "@/lib/manager/EventManager";
import { observer } from "mobx-react";
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { CkbHepler } from "@/lib/wallet/CkbHelper";
import { toast } from "@/components/ui/use-toast";

export const DispatchPanel = observer(() => {


  const [hide, setHide] = useState(false);

  const [loadmore, setLoadMore] = useState(false);

  const [addressList, setAddressList] = useState("");
  const [codeHash, setCodeHash] = useState("");
  const [scriptArgs, setScriptArgs] = useState("");


  useEffect(() => {
    EventManager.instance.subscribe(EventType.transaction_item_show, () => {
      setHide(false);
    });
    EventManager.instance.subscribe(EventType.transaction_item_hide, () => {
      setHide(true);
    });
    EventManager.instance.subscribe(
      EventType.transaction_item_load_more,
      () => {
        setLoadMore(!loadmore);
      }
    );

  }, []);

  useEffect(() => {
    //

  }, []);

  async function handleDispatch() {
    console.log("dispatch");
    console.log(addressList);

    if (codeHash.length == 0) {
      console.log("no code hash");
      toast({
        title: "Warning",
        description: "Please fill in the xUDT code hash",
        variant: "destructive",
      });
      return;

    }

    if (scriptArgs.length == 0) {
      console.log("no script args");
      toast({
        title: "Warning",
        description: "Please fill in the xUDT args",
        variant: "destructive",
      });
      return;
    }

    if (addressList.length == 0) {
      console.log("no data");
      toast({
        title: "Warning",
        description: "No data, please fill in the address and amount",
        variant: "destructive",
      });
      return;
    }

    let lines = addressList.split('\n');
    let data: [{ toAddress: string; transferAmount: bigint }] = [];

    lines.map((line) => {
      let address = line.split(",")[0].trim();
      let amount = line.split(",")[1].trim();
      if (address.length > 0) {
        data.push({
          toAddress: address,
          transferAmount: BigInt(parseInt(amount))
        })
      } else {
        toast({
          title: "Warning",
          description: "Incorrect data format, please check the address and amount",
          variant: "destructive",
        });
        return;
      }
    });

    console.log(`data len: ${data.length}`)

    if (data.length >= 400) {
      console.log("exceed limit");
      toast({
        title: "Warning",
        description: "Exceed the limit, please dispatch less than 400 addresses",
        variant: "destructive",
      });
      return;
    }

    let amounts: { string: bigint } = {};
    data.map((item) => {
      if (amounts[item.toAddress]) {
        amounts[item.toAddress] += item.transferAmount;
      } else {
        amounts[item.toAddress] = item.transferAmount;
      }
    });

    let dispatch_data: [{ toAddress: string; transferAmount: bigint }] = [];
    for (let [key, value] of Object.entries(amounts)) {
      console.log(`${key}: ${value}`);
      dispatch_data.push({
        toAddress: key,
        transferAmount: value
      })
    }

    console.log(dispatch_data);

    // const xUDTScript: CKBComponents.Script = {
    //   "codeHash": "0x25c29dc317811a6f6f3985a7a9ebc4838bd388d19d0feeecf0bcd60f6c0975bb",
    //   "args": "0x1ebc6b9f540078696b7fe10a9b51b96ab568ee5d2858cf9a2ede5ff0869cd258",
    //   "hashType": "type"
    // };

    const xUDTScript: CKBComponents.Script = {
      "codeHash": codeHash,
      "args": scriptArgs,
      "hashType": "type"
    };


    await CkbHepler.instance.batchTransferXudt(xUDTScript, dispatch_data);
  };

  return (
    <div className="grid w-full gap-1.5">
      <Input type="text" id="codeHash" placeholder="Please fill in the xUDT code hash. You can find your xUDT code hash in https://explorer.nervos.org/." onChange={(e) => setCodeHash(e.target.value)} />
      <Input type="text" id="args" placeholder="Please fill in the xUDT args. You can find your xUDT args in https://explorer.nervos.org/." onChange={(e) => setScriptArgs(e.target.value)} />
      <Textarea id="message" className="flex flex-1 h-[550px] rounded-md border p-4" placeholder="Paste the list you want to dispatch. The format is 'address,amount' (the amount should including decimals)" onChange={(e) => setAddressList(e.target.value)}></Textarea>
      <Button className="relative rounded-full border-none font-SourceSanPro" onClick={handleDispatch}> Dispatch </Button>
    </div>
  );
});
