"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { formatString } from "@/utils/common";
import { WalletItem } from "@/store/wallet/walletSlice";
import { ChevronDown, Check } from "lucide-react";

interface IWalletSelectProps {
  selectWallet?: WalletItem;
  wallets: WalletItem[];
  onChangeSelect: (wallet: WalletItem) => void;
}

export default function WalletSelect({
  selectWallet,
  wallets,
  onChangeSelect,
}: IWalletSelectProps) {
  const [showOptions, setShowOptions] = useState(false);
  const onSelectWallet = (w: WalletItem) => {
    if (w.address === selectWallet?.address) {
      return;
    }
    setShowOptions(false);
    onChangeSelect(w);
  };

  const selectRef = useRef<HTMLDivElement>(null);

  const clickCallback = useCallback((e: globalThis.MouseEvent) => {
    if (!(selectRef.current && selectRef.current.contains(e.target as Node))) {
      setShowOptions(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("click", clickCallback);
    return () => {
      document.removeEventListener("click", clickCallback);
    };
  }, []);

  return (
    <div className="relative" ref={selectRef}>
      <button
        type="button"
        className="relative w-full cursor-pointer rounded-md py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm outline-none focus:ring-2 focus:ring-primary-default sm:text-sm sm:leading-6 bg-gray-100"
        aria-haspopup="listbox"
        aria-expanded="true"
        aria-labelledby="listbox-label"
        onClick={() => setShowOptions(true)}
      >
        <span className="flex items-center h-8">
          {selectWallet?.address ? (
            <>
              {formatString(selectWallet.address, 5)}
              <span className="text-slate-400">
                ({selectWallet.walletName})
              </span>
            </>
          ) : (
            ""
          )}
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
          <ChevronDown className="text-slate-400" />
        </span>
      </button>
      {showOptions && (
        <ul
          className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg outline-none sm:text-sm"
          role="listbox"
          aria-labelledby="listbox-label"
          aria-activedescendant="listbox-option-3"
        >
          {wallets.map((w) => (
            <li
              key={w.address}
              className="text-gray-900 relative cursor-default select-none py-2 pl-3 pr-9 hover:bg-slate-100 "
              onClick={() => onSelectWallet(w)}
            >
              <div className="flex items-center">
                <div className="font-normal truncate">
                  {formatString(w.address, 5)}{" "}
                  <span className="text-slate-400">({w.walletName})</span>
                </div>
              </div>
              {w.address === selectWallet?.address && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <Check className="w-4" />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
