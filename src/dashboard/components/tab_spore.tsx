import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { EventType } from "@/lib/enum";
import { DataManager } from "@/lib/manager/DataManager";
import { EventManager } from "@/lib/manager/EventManager";
import { sortStr } from "@/lib/utils";
import { useEffect, useState } from "react";

export function TabSpore() {
  const [reload, setReload] = useState(false);

  const spores = DataManager.instance.tokens.spore;

  useEffect(() => {
    EventManager.instance.subscribe(EventType.dashboard_tokens_reload, () => {
      setReload(!reload);
    });

    return () => {
      EventManager.instance.unsubscribe(
        EventType.dashboard_tokens_reload,
        () => {
          setReload(!reload);
        }
      );
    };
  }, [reload]);

  return (
    <TabsContent value="SPORE" className="space-y-4">
      <div hidden={true}>{reload ? "1" : "2"}</div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {spores &&
          spores.map((spore) => (
            <Card key={spore}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SPORE</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col justify-center">
                  <img src="https://a-simple-demo.spore.pro/api/media/0xff7d234d08aac9927756778f2f028171a073a3b888613a48ccea57df54f8ffec" />
                  <div className="text-2xl font-bold">#{sortStr(spore, 3)}</div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </TabsContent>
  );
}
