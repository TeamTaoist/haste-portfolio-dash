import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { EventType } from "@/lib/enum";
import { DataManager } from "@/lib/manager/DataManager";
import { EventManager } from "@/lib/manager/EventManager";
import { sortStr } from "@/lib/utils";
import { BtcHepler } from "@/lib/wallet/BtcHelper";
import { CkbHepler } from "@/lib/wallet/CkbHelper";
import { RGBHelper } from "@/lib/wallet/RGBHelper";
import { useState } from "react";

export function UserNav() {
  const [isConnect, setIsConnent] = useState(false);

  const { toast } = useToast();

  const handlerUnisat = () => {
    BtcHepler.instance
      .unisat_onConnect()
      .then((rs) => {
        const { accounts, pubkey } = rs;
        console.log(accounts);

        DataManager.instance.curWalletType = "unisat";
        DataManager.instance.curWalletAddr = accounts[0];
        DataManager.instance.curWalletPubKey = pubkey;

        setIsConnent(true);

        EventManager.instance.publish(EventType.transfer_reload_page, {});
      })
      .catch((err) => {
        console.error(err);
        toast({
          title: "Warning",
          description: err.message,
          variant: "destructive",
        });
      });
  };

  const handlerJoyId = () => {
    CkbHepler.instance
      .joyid_onConnect()
      .then((rs) => {
        const { account, pubkey } = rs;
        console.log(account);

        DataManager.instance.curWalletType = "joyid";
        DataManager.instance.curWalletAddr = account;
        DataManager.instance.curWalletPubKey = pubkey;

        setIsConnent(true);

        RGBHelper.instance.btc_connect();

        EventManager.instance.publish(EventType.transfer_reload_page, {});
      })
      .catch((err) => {
        console.error(err);
        toast({
          title: "Warning",
          description: err.message,
          variant: "destructive",
        });
      });
  };

  const handleDisconnect = () => {
    DataManager.instance.curWalletType = "none";
    DataManager.instance.curWalletAddr = "";
    setIsConnent(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {isConnect ? (
          <Button className="relative rounded-full border-none">
            {sortStr(DataManager.instance.curWalletAddr, 6)}
          </Button>
        ) : (
          <Button className="relative rounded-full border-none">
            Connect Wallet
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {isConnect ? (
          <DropdownMenuItem onClick={handleDisconnect}>
            Disconnect
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem onClick={handlerUnisat}>UniSat</DropdownMenuItem>
            <DropdownMenuItem onClick={handlerJoyId}>JoyID</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
