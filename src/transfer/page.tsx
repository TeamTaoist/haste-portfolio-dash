import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send } from "./components/send";
// import { Receive } from "./components/receive";
import { useEffect, useState } from "react";
import { EventManager } from "@/lib/manager/EventManager";
import { EventType } from "@/lib/enum";
import { DataManager } from "@/lib/manager/DataManager";
import { useLocation } from "react-router-dom";
import { Mint } from "./components/mint";
import { isTestNet } from "@/lib/wallet/constants";
import { accountStore } from "@/store/AccountStore";
import { autorun } from "mobx";
import { observer } from "mobx-react";
// import { SendSudt } from "./components/send_sudt";
// import { SendSpore } from "./components/send_spore";
// import { CkbToBtc } from "./components/ckb_to_btc";
// import { BtcToCkb } from "./components/btc_to_ckb";

export const Transfer = observer(() => {
  const [reload, setReload] = useState(false);

  const location = useLocation();

  useEffect(() => {
    DataManager.instance.curMenu = "send&receive";
    EventManager.instance.publish(EventType.main_nav_reload, {});

    console.log("Location changed!", location.pathname);
    if (location.pathname != DataManager.instance.curPath) {
      DataManager.instance.curPath = location.pathname;
    }
  }, [location]);

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

  useEffect(() => {
    const disposer = autorun(() => {});
    return () => disposer();
  }, []);

  return (
    <div className="mx-auto mt-7">
      <div hidden={true}>{reload ? 1 : 2}</div>
      <Tabs defaultValue="Send" className="space-y-4">
        <div className="flex justify-center">
          <TabsList>
            <TabsTrigger value="Send">Send</TabsTrigger>
            {isTestNet() &&
            accountStore.currentAddress &&
            accountStore.currentAddress.startsWith("ckt") ? (
              <TabsTrigger value="MintXUDT">MintXUDT</TabsTrigger>
            ) : (
              ""
            )}
            {/* <TabsTrigger value="Receive">Receive</TabsTrigger> */}
            {/* <TabsTrigger value="SendSUDT">SendSUDT</TabsTrigger>
            <TabsTrigger value="SendSpore">SendSpore</TabsTrigger>
            <TabsTrigger value="CkbToBtc">CkbToBtc</TabsTrigger>
            <TabsTrigger value="BtcToCkb">BtcToCkb</TabsTrigger> */}
          </TabsList>
        </div>
        <div className="flex justify-center">
          <Send></Send>
          <Mint></Mint>
          {/* <Receive></Receive> */}
          {/* <SendSudt></SendSudt>
          <SendSpore></SendSpore>
          <CkbToBtc></CkbToBtc>
          <BtcToCkb></BtcToCkb> */}
        </div>
      </Tabs>
    </div>
  );
});

// export default Transfer;
