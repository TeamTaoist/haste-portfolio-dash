import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { getXudtAndSpore } from "../../query/ckb/tools";
import { ckb_SporeInfo } from "../../types/BTC";
import {formatString, getImg} from "../../utils/common";
import CellInfo from "../Modal/cellInfo.tsx";
import {getRgbAssets} from "../../query/rgbpp/tools.ts";
import {getEnv} from "../../settings/env.ts";
import {getSporeScript, predefinedSporeConfigs} from "@spore-sdk/core";
import SporeItem from "./sporeItem.tsx";


export default function SporeList() {
  const [spores, setSpores] = useState<ckb_SporeInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const currentAddress = useSelector((state: RootState) => state.wallet.currentWalletAddress);
  const wallets = useSelector((state: RootState) => state.wallet.wallets);
  const [show,setShow] = useState(false)
  const [currentToken,setCurrentToken] = useState(null);

  const handleSporeList = async(list: ckb_SporeInfo[]) => {

    const updatedList = list.map(item => {
        let sporeInfo = getImg(item?.data)
        return {...item, image:sporeInfo.image, type: sporeInfo.type, textContent: sporeInfo.textContent};
    });
    return updatedList
  }

  const _getSpore = async(address: string) => {
    const assetsList = await getXudtAndSpore(address);
    const list = await handleSporeList(assetsList.sporeList)

    setSpores(list as any);
    setIsLoading(false);
  }


  const _getRgbAsset = async (address: string) => {
    const list = await getRgbAssets(address);

    const sporeConfig = getEnv()==="Testnet"? predefinedSporeConfigs.Testnet:predefinedSporeConfigs.Mainnet;
    const versionStr = getEnv() === 'Testnet'?"preview":"latest";
    const sporeType = getSporeScript(sporeConfig,"Spore",["v2",versionStr]);

    const {codeHash} = sporeType.script
    const sporeList = list.filter((item: any) => item.cellOutput.type.codeHash === codeHash);

    // @ts-ignore
    setSpores(sporeList as any)
    setIsLoading(false);
  };

  const getCurrentAssets = async() => {
    const currentWallet = wallets.find(wallet => wallet.address === currentAddress);
    const chain = currentWallet?.chain;
    if ( chain && chain === 'btc') {
      await _getRgbAsset(currentWallet?.address!!)
    } else if (chain && chain === 'ckb') {
      await _getSpore(currentWallet?.address!!);
    }
  }

  useEffect(() => {
    getCurrentAssets()
  }, [currentAddress])


  const handleClose = () => {
    setShow(false);
  }

  const handleCurrent = (dob:any) =>{
    setCurrentToken(dob);
    setShow(true)
  }


  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-2 sm:gap-x-6 md:grid-cols-3 md:gap-x-6 lg:grid-cols-6 xl:grid-cols-5 2xl:grid-cols-6 xl:gap-x-8 text-black mt-8">
      {
          show && <CellInfo xUdt={currentToken} handleClose={handleClose} />
      }
      {isLoading ? (
        Array.from({ length: 3 }, (_, index) => (
          <div key={index}
            className="relative bg-inherit rounded-lg shadow-xl transition-all bg-white"
          >
            <div className="flex shrink-0 aspect-square rounded-t-md overflow-hidden bg-primary011 animate-shimmerSpore">
              <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200 bg-200% animate-shimmerSpore"></div>
            </div>
            <div className="p-3">
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200 bg-200% rounded animate-shimmerSpore mb-2"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200 bg-200% rounded animate-shimmerSpore"></div>
            </div>
          </div>
        ))
      ) : (
        spores.map((spore) => (
          <div
            key={spore.amount || (spore as any)?.cellOutput?.type?.args}
            className="relative translate-y-0 hover:z-10 hover:shadow-2xl hover:-translate-y-0.5 bg-inherit rounded-lg shadow-xl transition-all cursor-pointer group bg-white"
            onClick={()=>handleCurrent(spore)}
          >
            <SporeItem tokenKey={(spore as any)?.cellOutput?.type?.args || (spore as any)?.allObj?.cellOutput?.type?.args} data={spore?.data} key={(spore as any)?.cellOutput?.type?.args} />
            {/*<div className="flex shrink-0 aspect-square rounded-t-md overflow-hidden items-center bg-gray-200 ">*/}
            {/*  {*/}
            {/*    // eslint-disable-next-line @next/next/no-img-element*/}
            {/*    spore.type?.startsWith('image') && <img src={spore.image} alt="" className="w-full object-cover block" />*/}
            {/*  }*/}
            {/*  {*/}
            {/*    // eslint-disable-next-line @next/next/no-img-element*/}
            {/*    spore.url && <img src={spore.url} alt="" className="w-full object-cover block" />*/}
            {/*  }*/}
            {/*  {*/}
            {/*    (!spore.type?.startsWith('image') && !spore.url) && <p className="p-3">{spore.textContent}</p>*/}
            {/*  }*/}
            {/*</div>*/}
            <div className="p-3">{formatString(spore.amount || (spore as any)?.cellOutput?.type?.args, 5)}</div>
          </div>
        ))
      )}

    </div>
  );
}
