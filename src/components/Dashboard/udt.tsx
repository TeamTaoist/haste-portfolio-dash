
import { useEffect, useState } from "react";
import { useSelector } from 'react-redux';
import { RootState } from "../../store/store";
import { getXudtAndSpore } from "../../query/ckb/tools";
import { ckb_SporeInfo, ckb_UDTInfo } from "../../types/BTC";
import { getRgbppAssert } from "../../query/rgbpp/tools";
import { getSymbol } from "../../lib/utils";
import { formatUnit } from "@ckb-lumos/bi";
import Loading from "../loading";
import {BI} from "@ckb-lumos/lumos";
import {
  BookDashed
} from "lucide-react";
import {EventType} from "../../lib/enum";

import BtcImg from "../../assets/img/btc.png";

export default function UDTList() {
  const [xudtList, setXudtList] = useState<(ckb_UDTInfo | ckb_SporeInfo | undefined)[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const currentAddress = useSelector((state: RootState) => state.wallet.currentWalletAddress);
  const wallets = useSelector((state: RootState) => state.wallet.wallets);
  const [loadingPage,setLoadingPage] = useState(false)
  const [reloadData,setReloadData] = useState([])

  const _getSporeAndXudt = async(address: string) => {
    const assetsList = await getXudtAndSpore(address);
    setXudtList(assetsList.xudtList);
    setIsLoading(false);
  }

  useEffect(() => {
    document.addEventListener(EventType.dashboard_tokens_reload,refreshDom)
    return () =>{
      document.removeEventListener(EventType.dashboard_tokens_reload,refreshDom)
    }
  }, []);

  const refreshDom = () =>{
    console.log(reloadData)
    setReloadData([])
  }

  const _getRgbAsset = async(address: string) => {
    const assetsList = await getRgbppAssert(address);
    const rgbAssetList = assetsList.filter(asset => asset.ckbCellInfo);


    const groupedData = rgbAssetList.reduce((acc:any, obj) => {
      const key= obj?.ckbCellInfo?.type_script?.args! ;
      if (!acc[key]) {
        acc[key] = { category: key, sum: BI.from(0),...obj };
      }
      acc[key].sum = acc[key].sum.add((obj?.ckbCellInfo?.amount));

      return acc;
    }, {});


    const result = Object.values(groupedData);
    //@ts-ignore
    // setXudtList(rgbAssetList)
    setXudtList(result)
    setIsLoading(false);
  }

  const getCurrentAssets = async() => {


    try{
      const currentWallet = wallets.find(wallet => wallet.address === currentAddress);
      const chain = currentWallet?.chain;
      if ( chain && chain === 'btc') {
        await _getRgbAsset(currentWallet?.address!!)
      } else if (chain && chain === 'ckb') {
        await _getSporeAndXudt(currentWallet?.address!!);
      }
    }catch (e) {
      console.error("getCurrentAssets",e)
    }finally {
      setLoadingPage(false)
    }

  }

  useEffect(() => {
    setLoadingPage(true)
    getCurrentAssets()
  }, [currentAddress])


  return (
    <div className="w-full h-full relative">
      {
          loadingPage && <Loading />
      }
      <table className="w-full">
        <thead>
          <tr className="font-SourceSanPro font-semibold text-black opacity-30 grid grid-cols-12 py-2 text-left">
            <th className="col-span-7 lg:col-span-5 cursor-pointer px-8">
              Token
            </th>
            <th className="col-span-4 lg:col-span-2 cursor-pointer px-8">
              Balance
            </th>
          </tr>
        </thead>
        <tbody className="text-black">

          {isLoading ? (
            Array.from(new Array(5)).map((_, index) => (
              <tr key={index} className="hover:bg-gray-200 grid grid-cols-12 group py-6 border-0 bg-white mb-4 rounded-lg">
                <td className="col-span-7 lg:col-span-5 px-8">
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
          ) :
              (
                  <>{
                    !!xudtList.length && xudtList.map((xudt, index) => (
                    <tr key={index} className="hover:bg-gray-200 grid grid-cols-12 group py-6 border-0 bg-white mb-4 rounded-l ">
                      <td className="col-span-7 lg:col-span-5 px-8">
                        <div className="flex gap-3 items-center">
                          <div>
                            <img
                                width={32}
                                height={32}
                                src={BtcImg}
                                alt="USDT"
                                className="w-8 h-8 rounded-full object-cover min-w-[2rem]"
                            />
                          </div>
                          <div>

                            <p className="font-semibold">{xudt?.ckbCellInfo?getSymbol(xudt?.ckbCellInfo?.type_script):getSymbol(xudt?.type_script)}</p>

                            {/*<p className="font-bold">{xudt && xudt.symbol}</p>*/}

                            <p className="text-sm text-slate-500 truncate sm:max-w-none max-w-[8rem]">
                              {xudt?.ckbCellInfo?getSymbol(xudt?.ckbCellInfo?.type_script):getSymbol(xudt?.type_script)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-2 whitespace-nowrap sm:w-auto col-span-3 lg:col-span-2">
                        <p className="text-sm sm:text-base text-default font-semibold truncate text-base font-din">
                          {/*{formatUnit(((xudt?.ckbCellInfo?.amount || xudt?.amount) ?? 0), 'ckb')}*/}
                          {formatUnit(((xudt?.sum?.toString() || xudt?.amount) ?? 0), 'ckb')}
                        </p>
                        {/* <p className="text-xs sm:text-sm leading-5 font-normal text-slate-300 truncate">
                    $--,--
                  </p> */}
                      </td>
                    </tr>
                ))}


              </>

             )


          }
        </tbody>
      </table>
      {          !xudtList.length &&

          <div className="w-full flex justify-center gap-5 opacity-20 py-20  mt-10"><BookDashed />No data</div>
      }
    </div>
  );
}
