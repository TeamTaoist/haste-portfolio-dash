import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send } from "./components/send";
import { Receive } from "./components/receive";
import { useEffect, useState } from "react";
import { EventManager } from "@/lib/manager/EventManager";
import { EventType } from "@/lib/enum";
import { SendSudt } from "./components/send_sudt";
import { SendSpore } from "./components/send_spore";
import { CkbToBtc } from "./components/ckb_to_btc";

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
    <div className="mt-7">
      <div hidden={true}>{reload ? 1 : 2}</div>
      <Tabs defaultValue="Send" className="space-y-4">
        <div className="flex">
          <TabsList>
            <TabsTrigger value="Send">Send</TabsTrigger>
            <TabsTrigger value="Receive">Receive</TabsTrigger>
            <TabsTrigger value="SendSUDT">SendSUDT</TabsTrigger>
            <TabsTrigger value="SendSpore">SendSpore</TabsTrigger>
            <TabsTrigger value="CkbToBtc">CkbToBtc</TabsTrigger>
          </TabsList>
        </div>
        <Send></Send>
        <Receive></Receive>
        <SendSudt></SendSudt>
        <SendSpore></SendSpore>
        <CkbToBtc></CkbToBtc>
      </Tabs>
    </div>
  );
}
