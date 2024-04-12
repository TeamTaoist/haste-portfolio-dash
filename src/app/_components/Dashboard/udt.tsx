"use client";

import { useEffect, useState } from "react";
import Image from 'next/image';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from "@/store/store";
import { getBTCAsset } from "@/query/btc/tools";
import { getXudtAndSpore } from "@/query/ckb/tools";
import { ckb_SporeInfo, ckb_UDTInfo } from "@/types/BTC";


export default function UDTList() {
  const [xudtList, setXudtList] = useState<ckb_UDTInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const currentAddress = useSelector((state: RootState) => state.wallet.currentWalletAddress);
  const wallets = useSelector((state: RootState) => state.wallet.wallets);

  const _getSpore = async(address: string) => {
    const assetsList = await getXudtAndSpore(address);
    setXudtList(assetsList.xudtList);
    setIsLoading(false);
  }

  const getCurrentAssets = async() => {
    const currentWallet = wallets.find(wallet => wallet.address === currentAddress);
    const chain = currentWallet?.chain;
    if ( chain && chain === 'btc') {

    } else if (chain && chain === 'ckb') {
      const list = await _getSpore(currentWallet?.address!!);
    }
  }

  useEffect(() => {
    getCurrentAssets()
  }, [currentAddress])


  return (
    <div className="w-full">
      <table className="w-full">
        <thead>
          <tr className="font-SourceSanPro font-semibold text-primary003 grid grid-cols-12 py-2 text-left">
            <th className="col-span-7 lg:col-span-5 cursor-pointer px-2">
              Token
            </th>
            <th className="col-span-4 lg:col-span-2 cursor-pointer px-2">
              Balance
            </th>
          </tr>
        </thead>
        <tbody className="text-white">
          {isLoading ? (
            Array.from(new Array(5)).map((_, index) => (
              <tr key={index} className="hover:bg-primary-100 grid grid-cols-12 group py-2 border-t border-gray-500">
                <td className="col-span-7 lg:col-span-5 px-2">
                  <div className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-300 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-200% animate-shimmer"></div>
                    <div>
                      <div className="h-4 bg-gray-300 w-16 rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-200% animate-shimmer"></div>
                      <div className="h-4 bg-gray-300 w-24 mt-2 rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-200% animate-shimmer"></div>
                    </div>
                  </div>
                </td>
                <td className="px-2 whitespace-nowrap sm:w-auto col-span-3 lg:col-span-2">
                  <div className="h-4 bg-gray-300 w-20 rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-200% animate-shimmer"></div>
                  <div className="h-4 bg-gray-300 w-12 mt-2 rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-200% animate-shimmer"></div>
                </td>
              </tr>
            ))
          ) : (
            xudtList.map((xudt, index) => (
              <tr key={index} className="hover:bg-primary010 grid grid-cols-12 group py-2 border-t border-gray-500">
                <td className="col-span-7 lg:col-span-5 px-2">
                  <div className="flex gap-3 items-center">
                    <div>
                      <Image
                        width={32}
                        height={32}
                        src="/img/btc.png"
                        alt="USDT"
                        className="w-8 h-8 rounded-full object-cover min-w-[2rem]"
                      />
                    </div>
                    <div>
                      <p className="font-semibold">{xudt.symbol}</p>
                      <p className="text-sm text-slate-500 truncate sm:max-w-none max-w-[8rem]">
                        {xudt.symbol}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-2 whitespace-nowrap sm:w-auto col-span-3 lg:col-span-2">
                  <p className="text-sm sm:text-base text-default font-semibold truncate">
                    {xudt.amount}
                  </p>
                  <p className="text-xs sm:text-sm leading-5 font-normal text-slate-300 truncate">
                    $--,--
                  </p>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
