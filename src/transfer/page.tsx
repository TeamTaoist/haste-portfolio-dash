import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send } from "./components/send";
import { Receive } from "./components/receive";
import { useEffect, useState } from "react";
import { EventManager } from "@/lib/manager/EventManager";
import { EventType } from "@/lib/enum";
// import { SendSudt } from "./components/send_sudt";
// import { SendSpore } from "./components/send_spore";
// import { CkbToBtc } from "./components/ckb_to_btc";
// import { BtcToCkb } from "./components/btc_to_ckb";

export function Transfer() {
  const [reload, setReload] = useState(false);

  useEffect(() => {
    EventManager.instance.subscribe(EventType.transfer_reload_page, () => {
      setReload(!reload);
    });

    return () => {
      EventManager.instance.unsubscribe(EventType.transfer_reload_page, () => {
        setReload(!reload);
      });
    };
  }, [reload]);

  return (
    <div className="mx-auto mt-7">
      <div hidden={true}>{reload ? 1 : 2}</div>
      <Tabs defaultValue="Send" className="space-y-4">
        <div className="flex justify-center">
          <TabsList>
            <TabsTrigger value="Send">Send</TabsTrigger>
            <TabsTrigger value="Receive">Receive</TabsTrigger>
            {/* <TabsTrigger value="SendSUDT">SendSUDT</TabsTrigger>
            <TabsTrigger value="SendSpore">SendSpore</TabsTrigger>
            <TabsTrigger value="CkbToBtc">CkbToBtc</TabsTrigger>
            <TabsTrigger value="BtcToCkb">BtcToCkb</TabsTrigger> */}
          </TabsList>
        </div>
        <div className="flex justify-center">
          <Send></Send>
          <Receive></Receive>
          {/* <SendSudt></SendSudt>
          <SendSpore></SendSpore>
          <CkbToBtc></CkbToBtc>
          <BtcToCkb></BtcToCkb> */}
        </div>
      </Tabs>
    </div>
  );
}
