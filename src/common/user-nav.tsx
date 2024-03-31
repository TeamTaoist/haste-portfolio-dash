import { Button } from "@/components/ui/button";

import { useToast } from "@/components/ui/use-toast";
import { EventType } from "@/lib/enum";
import { DataManager } from "@/lib/manager/DataManager";
import { EventManager } from "@/lib/manager/EventManager";
import { BtcHepler } from "@/lib/wallet/BtcHelper";
import { CkbHepler } from "@/lib/wallet/CkbHelper";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@radix-ui/react-select";
import { observer } from 'mobx-react';
import { accountStore } from "@/store/AccountStore";

export const UserNav = observer(() => {
  // const [isConnect, setIsConnent] = useState(false);
  const [isUnisatConnect, setIsUnisatConnect] = useState(false);
  const [isJoyIDConnect, setIsJoyIDConnect] = useState(false);
  const [isOKXConnect, setIsOKXConnect] = useState(false);
  const [isOpen, setIsOpen] = useState(
    DataManager.instance.accounts.length <= 0 ? true : false
  );

  const { toast } = useToast();

  const handlerUnisat = () => {
    BtcHepler.instance
      .unisat_onConnect()
      .then((rs) => {
        const { accounts, pubkey } = rs;
        console.log(accounts);

        // DataManager.instance.curWalletType = "unisat";
        // DataManager.instance.curWalletAddr = accounts[0];
        // DataManager.instance.curWalletPubKey = pubkey;

        DataManager.instance.walletInfo[accounts[0]] = {
          address: accounts[0],
          type: "unisat",
          pubkey: pubkey,
          chain: "BTC",
        };

        accountStore.addAccount({
          address: accounts[0],
          type: "unisat",
          pubkey: pubkey,
          chain: "BTC"
        });
        
        const canFind = DataManager.instance.accounts.find(
          (v) => v.addr == accounts[0]
        );
        if (!canFind) {
          DataManager.instance.accounts.push({
            chain: "BTC",
            addr: accounts[0],
          });
        }

        setIsUnisatConnect(true);
        setDefaultAddress(accounts[0]);
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

  const handleOKX = () => {
    BtcHepler.instance
      .okx_onConnect()
      .then((rs) => {
        const { address, publicKey } = rs;
        console.log(address, publicKey);

        accountStore.addAccount({
          address: address,
          type: "okx",
          pubkey: publicKey,
          chain: "BTC",
        });

        setIsOKXConnect(true);
        setDefaultAddress(address);
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
        accountStore.addAccount({
          address: account,
          type: "joyid",
          pubkey: pubkey,
          chain: "CKB",
        });
        setIsJoyIDConnect(true);
        setDefaultAddress(account);
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

  // detect BTC and CKB wallet is both connected

  const setDefaultAddress = (address: string) => {
    accountStore.setCurrentAddress(address);
  }

  // const handleDisconnect = () => {
  //   DataManager.instance.curWalletType = "none";
  //   DataManager.instance.curWalletAddr = "";
  //   setIsConnent(false);
  // };

  const handleOpenChange = (e) => {
    // console.log(e);

    if (!e) {
      handleConfirmConnect();
    } else {
      setIsOpen(true);
    }
  };

  const handleConfirmConnect = () => {
    if (DataManager.instance.accounts.length > 0) {
      setIsOpen(false);

      EventManager.instance.publish(EventType.team_switcher_reload, {});
    } else {
      toast({
        title: "Warning",
        description: "Must connect a wallet",
        variant: "destructive",
      });

      setIsOpen(true);
    }
  };

  return (
    <div>
      <div className="">
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="relative rounded-full border-none font-SourceSanPro">
              Add Wallet
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Wallet</DialogTitle>
              <DialogDescription>
                At least connect a BTC wallet and a CKB wallet
              </DialogDescription>
            </DialogHeader>
            <Separator />
            <div className="flex flex-col gap-4">
              <div
                onClick={handleOKX}
                className={`flex px-4 w-[100%] h-12 border rounded-md font-Montserrat justify-between items-center txt-center cursor
                  ${isOKXConnect ? "bg-green-200" : "border-primary005"}
                  `}
              >
                <img src="/okx.png" width={24} height={24} />
                <div>OKX Wallet</div>
              </div>
              <div
                onClick={handlerUnisat}
                className={`flex px-4 w-[100%] h-12 border rounded-md font-Montserrat justify-between items-center txt-center cursor
                    ${isUnisatConnect ? "bg-green-200" : "border-primary005"}
                  `}
              >
                <img src="/unisat.png" width={24} height={24} />
                <div>Unisat</div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div
                className={`flex px-4 w-[100%] h-12 border rounded-md font-Montserrat justify-center items-center txt-center cursor
                    ${isJoyIDConnect ? "bg-green-200" : "border-primary005"}
                  `}
                onClick={handlerJoyId}
              >
                <img src="/joyid.png" className="w-24" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleConfirmConnect}>Confirm Connect</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
})