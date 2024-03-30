import { Button } from "@/components/ui/button";

import { useToast } from "@/components/ui/use-toast";
import { EventType } from "@/lib/enum";
import { DataManager } from "@/lib/manager/DataManager";
import { EventManager } from "@/lib/manager/EventManager";
import { BtcHepler } from "@/lib/wallet/BtcHelper";
import { CkbHepler } from "@/lib/wallet/CkbHelper";
import { RGBHelper } from "@/lib/wallet/RGBHelper";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@radix-ui/react-select";

export function UserNav() {
  const [isConnect, setIsConnent] = useState(false);
  const [isWalletConnectWallet, setIsWalletConnect] = useState(true);
  const [isJoyIDConnect, setIsJoyIDConnect] = useState(false);
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
        setIsJoyIDConnect(true);
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
    <div>
        <div className="">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="relative rounded-full border-none font-SourceSanPro">
                Connect Wallet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Connect Wallet</DialogTitle>
                <DialogDescription>
                  At least connect a BTC wallet and a CKB wallet
                </DialogDescription>
              </DialogHeader>
              <Separator />
              <div className="flex flex-col gap-4">
                <div className="flex px-4 w-[100%] h-12 border rounded-md border-primary005 font-Montserrat justify-between items-center text-center cursor">
                  <img src="/okx.png" width={24} height={24}/>
                  <div>
                    OKX Wallet
                  </div>
                </div>
                <div className="flex px-4 w-[100%] h-12 border rounded-md border-primary005 font-Montserrat justify-between items-center text-center cursor">
                  <img src="/unisat.png" width={24} height={24}/>
                  <div>
                    Unisat
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div 
                  className={`flex px-4 w-[100%] h-12 border rounded-md font-Montserrat justify-center items-center txt-center cursor
                    ${isJoyIDConnect ? 'bg-green-200' : 'border-primary005'}
                  `}
                  onClick={handlerJoyId}
                >
                  <img src="/joyid.png" className="w-24"/>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

    </div>
  );
}
