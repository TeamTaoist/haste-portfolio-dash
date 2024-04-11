"use client";

import { useEffect, useState } from "react";
import EmptyImage from "../common/Empty/image";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { CkbHepler } from "@/query/ckb/ckbRequest";
import { getSpore, getXudtAndSpore } from "@/query/ckb/tools";
import { ckb_SporeInfo } from "@/types/BTC";
import { formatString } from "@/utils/common";

export default function SporeList() {
  const [spores, setSpores] = useState<ckb_SporeInfo[]>([]);
  const currentAddress = useSelector((state: RootState) => state.wallet.currentWalletAddress);
  const wallets = useSelector((state: RootState) => state.wallet.wallets);

  const _getSpore = async(address: string) => {
    const assetsList = await getXudtAndSpore(address);
    setSpores(assetsList.sporeList);
  }

  const getCurrentAssets = async() => {
    const currentWallet = wallets.find(wallet => wallet.address === currentAddress);
    const list = await _getSpore(currentWallet?.address!!);
  }

  useEffect(() => {
    getCurrentAssets()
  }, [currentAddress])

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-2 sm:gap-x-6 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 xl:gap-x-8 text-white">
      {spores.map((spore, index) => (
        <div
          key={spore.amount}
          className="relative translate-y-0 hover:z-10 hover:shadow-2xl hover:-translate-y-0.5 bg-inherit rounded-lg shadow-xl transition-all cursor-pointer group border border-gray-500"
        >
          <div className="flex shrink-0 aspect-square rounded-t-md overflow-hidden items-center bg-primary011 ">
            <img
                src={`https://a-simple-demo.spore.pro/api/media/${spore.amount}`}
                alt=""
                className="w-full object-cover block"
              />
          </div>
          <div className="p-3">{formatString(spore.amount, 5)}</div>
        </div>
      ))}
    </div>
  );
}
