// import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Assets } from "./components/assets";
import { useEffect, useState } from "react";
import { EventManager } from "@/lib/manager/EventManager";
import { EventType } from "@/lib/enum";
import { TabUdt } from "./components/tab_udt";
import { TabSpore } from "./components/tab_spore";
import { useLocation } from "react-router-dom";
import { DataManager } from "@/lib/manager/DataManager";
import { HttpManager } from "@/lib/api/HttpManager";
import { TabRgb } from "./components/tab_rgb";

export default function Dashboard() {
  const [hideTab, setHideTab] = useState(true);

  const location = useLocation();

  const [hide, setHide] = useState(false);

  const [tabValue, setTabValue] = useState<string>("");

  useEffect(() => {
    DataManager.instance.curMenu = "asset";
    EventManager.instance.publish(EventType.main_nav_reload, {});

    console.log("Location changed!", location.pathname);
    if (location.pathname != DataManager.instance.curPath) {
      DataManager.instance.curPath = location.pathname;
      const curAccount = DataManager.instance.getCurAccount();
      if (curAccount) {
        HttpManager.instance.getAsset(curAccount.addr);
      }
    }
  }, [location]);

  useEffect(() => {
    EventManager.instance.subscribe(EventType.dashboard_page_show_tabs, () => {
      setHideTab(false);
      setTabValue("UDT");
    });
    EventManager.instance.subscribe(EventType.dashboard_page_hide_tabs, () => {
      setHideTab(true);
      setTabValue("RGB++");
    });

    return () => {
      EventManager.instance.unsubscribe(
        EventType.dashboard_page_show_tabs,
        () => {
          setHideTab(false);
        }
      );
      EventManager.instance.unsubscribe(
        EventType.dashboard_page_hide_tabs,
        () => {
          setHideTab(true);
        }
      );
    };
  }, []);

  useEffect(() => {
    EventManager.instance.subscribe(EventType.dashboard_assets_show, () => {
      setHide(false);
    });
    EventManager.instance.subscribe(EventType.dashboard_assets_hide, () => {
      setHide(true);
    });

    return () => {
      EventManager.instance.unsubscribe(EventType.dashboard_assets_show, () => {
        setHide(false);
      });
      EventManager.instance.unsubscribe(EventType.dashboard_assets_hide, () => {
        setHide(true);
      });
    };
  }, []);

  return (
    <>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-white001 font-Montserrat">
            Chain
          </h2>
        </div>
        <Assets />
        <Tabs value={tabValue} className="space-y-4" hidden={hide}>
          <div className="flex">
            <TabsList>
              {!hideTab ? (
                <TabsTrigger value="UDT" onClick={() => setTabValue("UDT")}>
                  UDT
                </TabsTrigger>
              ) : (
                ""
              )}
              {!hideTab ? (
                <TabsTrigger value="SPORE" onClick={() => setTabValue("SPORE")}>
                  SPORE
                </TabsTrigger>
              ) : (
                ""
              )}
              {!hideTab ? (
                ""
              ) : (
                <TabsTrigger value="RGB++" onClick={() => setTabValue("RGB++")}>
                  RGB++
                </TabsTrigger>
              )}
            </TabsList>
          </div>
          <TabUdt></TabUdt>
          <TabSpore></TabSpore>
          <TabRgb></TabRgb>
        </Tabs>
      </div>
    </>
  );
}
