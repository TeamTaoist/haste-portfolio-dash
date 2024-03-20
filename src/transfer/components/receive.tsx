import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { DataManager } from "@/lib/manager/DataManager";
import { sortStr } from "@/lib/utils";

export function Receive() {
  return (
    <TabsContent value="Receive" className="space-y-4">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Receive</CardTitle>
          {/* <CardDescription>Deploy your new project in one-click.</CardDescription> */}
        </CardHeader>
        <CardContent>
          <h1>Address</h1>
          <Label>{sortStr(DataManager.instance.curWalletAddr, 12)}</Label>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button>Copy</Button>
        </CardFooter>
      </Card>
    </TabsContent>
  );
}
