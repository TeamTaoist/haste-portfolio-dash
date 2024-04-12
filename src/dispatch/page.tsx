import { DispatchPanel } from "./components/dispacth_panel";
import { useEffect, useState } from "react";
import { EventManager } from "@/lib/manager/EventManager";
import { EventType } from "@/lib/enum";
import { DataManager } from "@/lib/manager/DataManager";
import { accountStore } from "@/store/AccountStore";
// import { useLocation } from "react-router-dom";
// import { DataManager } from "@/lib/manager/DataManager";
// import { HttpManager } from "@/lib/api/HttpManager";

export default function Dispatch() {
  const [reload, setReload] = useState(false);

  const curAccount = DataManager.instance.getCurAccount();
  if (!curAccount) {
    throw new Error("Please choose a wallet");
  }

  const wallet = accountStore.getWallet(curAccount);
  if (!wallet) {
    throw new Error("Please choose a wallet");
  }


  // const location = useLocation();

  // useEffect(() => {
  //   DataManager.instance.curMenu = "transaction";
  //   EventManager.instance.publish(EventType.main_nav_reload, {});

  //   console.log("Location changed!", location.pathname);
  //   if (location.pathname != DataManager.instance.curPath) {
  //     DataManager.instance.curPath = location.pathname;
  //     const curAccount = DataManager.instance.getCurAccount();
  //     if (curAccount) {
  //       HttpManager.instance.getTransactions(curAccount);
  //     }
  //   }
  // }, [location]);

  useEffect(() => {
    EventManager.instance.subscribe(EventType.transaction_reload_page, () => {
      setReload(!reload);
    });

    return () => {
      EventManager.instance.unsubscribe(
        EventType.transaction_reload_page,
        () => {
          setReload(!reload);
        }
      );
    };
  }, [reload]);

  return wallet.chain == "BTC"?(<div></div>):(
    <div className="flex flex-col flex-1 space-y-4 p-8 pt-6">
      <div hidden={true}>{reload ? "1" : "2"}</div>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-white001 font-Montserrat">
          批量发送
        </h2>
      </div>
      <DispatchPanel />
    </div>
  );
}
