"use client";

import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { WalletItem } from "@/store/wallet/walletSlice";
import { ChevronDown } from "lucide-react";
import WalletSelect from "./walletSelect";
import AssetModal, { SelectAssetType } from "./asset";

export default function SendContent() {
  const wallets = useSelector((state: RootState) => state.wallet.wallets);
  const [selectWallet, setSelectWallet] = useState<WalletItem>(wallets[0]);

  const [assetModalVisible, setAssetModalVisible] = useState(false);
  const [selectAsset, setSelectAsset] = useState<SelectAssetType>();

  const [amount, setAmount] = useState<number>();

  const onSend = () => {};

  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="font-semibold ">Send from</p>
        <WalletSelect
          selectWallet={selectWallet}
          wallets={wallets}
          onChangeSelect={(w) => setSelectWallet(w)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-semibold">Send to</p>
        <input
          type="text"
          className="w-full h-11 px-3 text-sm rounded-md text-gray-900 outline-none focus:ring-2 focus:ring-primary-default"
          placeholder="Receive Address"
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-semibold">Asset</p>
        <div className="relative">
          <button
            type="button"
            className="relative w-full cursor-pointer rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm outline-none focus:ring-2 focus:ring-primary-default sm:text-sm sm:leading-6"
            aria-haspopup="listbox"
            aria-expanded="true"
            aria-labelledby="listbox-label"
            onClick={() => setAssetModalVisible(true)}
          >
            {selectAsset ? (
              <>{selectAsset.type}</>
            ) : (
              <>
                <span className="flex items-center h-8">
                  <span className="text-slate-400">Select Asset</span>
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                  <ChevronDown className="text-slate-400" />
                </span>
              </>
            )}
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-semibold">Amount</p>
        <input
          type="number"
          className="w-full h-11 px-3 text-sm rounded-md text-gray-900 outline-none focus:ring-2 focus:ring-primary-default"
          placeholder="0.00"
          value={amount}
        />
      </div>
      <div
        className="w-full bg-primary011 text-primary001 rounded-lg py-2 font-Montserrat text-center cursor-pointer"
        onClick={onSend}
      >
        Send
      </div>
      {assetModalVisible && (
        <AssetModal
          closeModal={() => setAssetModalVisible(false)}
          onSelectAsset={(data) => {
            setSelectAsset(data);
            setAssetModalVisible(false);
          }}
        />
      )}
    </>
  );
}
