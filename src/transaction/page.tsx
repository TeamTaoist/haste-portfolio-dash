import { TransactionItem } from "./components/transactionItem";
import { useEffect, useState } from "react";
import { EventManager } from "@/lib/manager/EventManager";
import { EventType } from "@/lib/enum";
import { useLocation } from "react-router-dom";
import { DataManager } from "@/lib/manager/DataManager";
import { HttpManager } from "@/lib/api/HttpManager";

export default function Transaction() {
  const [reload, setReload] = useState(false);

  const location = useLocation();

  useEffect(() => {
    console.log("Location changed!", location.pathname);
    if (location.pathname != DataManager.instance.curPath) {
      DataManager.instance.curPath = location.pathname;
      const curAccount = DataManager.instance.getCurAccount();
      HttpManager.instance.getTransactions(curAccount.addr);
    }
  }, [location]);

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

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div hidden={true}>{reload ? "1" : "2"}</div>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
      </div>
      <TransactionItem />
    </div>
  );
}
