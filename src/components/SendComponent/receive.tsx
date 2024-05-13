"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { WalletItem } from "../../store/wallet/walletSlice";
import WalletSelect from "./walletSelect";
import QRCode from "react-qr-code";
import { Copy } from "lucide-react";
import { enqueueSnackbar } from "notistack";

export default function ReceiveContent() {
  const wallets = useSelector((state: RootState) => state.wallet.wallets);
  const [selectWallet, setSelectWallet] = useState<WalletItem>(wallets[0]);

  const onClickCopy = () => {
    navigator.clipboard.writeText(selectWallet?.address);
    enqueueSnackbar("Address copied successfully", { variant: "success" });
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="font-semibold ">Receive to</p>
        <WalletSelect
          selectWallet={selectWallet}
          wallets={wallets}
          onChangeSelect={(w) => setSelectWallet(w)}
        />
      </div>
      <div className="flex flex-col justify-center">
        <div className="flex justify-center items-center mb-6">
          <QRCode
            value={selectWallet?.address}
            style={{ height: "auto", maxWidth: "100%", width: "250px" }}
          />
        </div>
        <button
          className="cursor-pointer disabled:cursor-auto transition px-5 py-2 rounded-full border flex items-center justify-center text-center text-sm border-default bg-inherit text-default hover:border-transparent bg-primary011 text-white"
          onClick={onClickCopy}
        >
          <Copy className="text-sm" />
          <span className="ml-2.5 font-semibold font-Montserrat">Copy Address</span>
        </button>
      </div>
    </>
  );
}
