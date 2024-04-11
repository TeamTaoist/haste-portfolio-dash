"use client";

import { useEffect, useState } from "react";
import EmptyImage from "../common/Empty/image";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { CkbHepler } from "@/query/ckb/ckbRequest";
import { getSpore } from "@/query/ckb/tools";

export default function SporeList() {
  const [spores] = useState(new Array(100).fill(0));
  const currentAddress = useSelector((state: RootState) => state.wallet.currentWalletAddress);
  const wallets = useSelector((state: RootState) => state.wallet.wallets);

  const _getSpore = async(address: string) => {
    const assetsList = await getSpore(address);
    console.log(assetsList);
  }

  const getCurrentAssets = async() => {
    const currentWallet = wallets.find(wallet => wallet.address === currentAddress);
    const list = await _getSpore(currentWallet?.address!!);
    console.log('---->', list);
  }

  useEffect(() => {
    getCurrentAssets()
  }, [currentAddress])

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-2 sm:gap-x-6 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 xl:gap-x-8 text-white">
      {spores.map((_, index) => (
        <div
          key={index}
          className="relative translate-y-0 hover:z-10 hover:shadow-2xl hover:-translate-y-0.5 bg-inherit rounded-lg shadow-xl transition-all cursor-pointer group border border-gray-500"
        >
          <div className="flex shrink-0 aspect-square rounded-t-md overflow-hidden items-center bg-primary011 ">
            {Math.round(Math.random()) % 2 === 0 ? (
              // <img
              //   src={`/api/media/${pathAddress}`}
              //   alt=""
              //   className="w-full object-cover block"
              // />
              <a>1</a>
            ) : (
              <div className="flex h-full w-full justify-center items-center text-slate-300">
                {/* <EmptyImage className="h-full w-full max-w-[5rem] max-h-[5rem]" /> */}
                <a>1</a>
              </div>
            )}
          </div>
          <div className="p-3">0x00000000</div>
        </div>
      ))}
    </div>
  );
}
