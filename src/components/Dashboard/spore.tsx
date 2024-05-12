import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { getXudtAndSpore } from "../../query/ckb/tools";
import { ckb_SporeInfo } from "../../types/BTC";
import { formatString, isImageMIMEType } from "../../utils/common";
import {getSporeById, unpackToRawSporeData} from "@spore-sdk/core";
import {sporeConfig} from "../../utils/config.ts";
import { Buffer } from 'buffer/';

export default function SporeList() {
  const [spores, setSpores] = useState<ckb_SporeInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const currentAddress = useSelector((state: RootState) => state.wallet.currentWalletAddress);
  const wallets = useSelector((state: RootState) => state.wallet.wallets);

  // const getSporeTypeScript = async(id:string) => {
  //   let contentType = await getImg(id);
  //   let blob = await contentType.blob();
  //   let isImage = isImageMIMEType(blob.type);
  //   let textContent: string = '';
  //   let url: string = ''
  //   if (!isImage) {
  //     textContent = await blob.text();
  //   }
  //   try {
  //     let jsonData = JSON.parse(textContent);
  //     url = jsonData.resource.url;
  //   } catch {
  //
  //   }
  //
  //   return { type: blob.type, url: url, textContent }
  // }


  const handleSporeList = async(list: ckb_SporeInfo[]) => {
    const promises = list.map(async item => {
        let sporeInfo = await getImg(item.amount)

        return {...item, image:sporeInfo.image, type: sporeInfo.type, textContent: sporeInfo.textContent};
    });
    const updatedList = await Promise.all(promises);
    return updatedList
  }

  const _getSpore = async(address: string) => {
    const assetsList = await getXudtAndSpore(address);
    const list = await handleSporeList(assetsList.sporeList)
    setSpores(list);
    setIsLoading(false);
  }

  const getCurrentAssets = async() => {
    const currentWallet = wallets.find(wallet => wallet.address === currentAddress);
    const chain = currentWallet?.chain;
    if ( chain && chain === 'btc') {

    } else if (chain && chain === 'ckb') {
      await _getSpore(currentWallet?.address!!);
    }
  }

  useEffect(() => {
    getCurrentAssets()
  }, [currentAddress])

  const getImg = async(id:string,type:string) =>{
    const cell = await getSporeById(id, sporeConfig)
    const spore = unpackToRawSporeData(cell.data);

    const buffer = Buffer.from(spore.content.toString().slice(2), 'hex');
    const base64 = Buffer.from(buffer, "binary" ).toString("base64");

    type = spore.contentType;
    let textContent,image;
    if( type.indexOf("text") > -1){
      textContent =  Buffer.from(buffer, "binary" ).toString()
    }else{
      image = `data:${spore.contentType};base64,${base64}`;
    }

    return {
      image,
      textContent,
      type
    }

  }


  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-2 sm:gap-x-6 md:grid-cols-3 md:gap-x-6 lg:grid-cols-6 xl:grid-cols-5 2xl:grid-cols-6 xl:gap-x-8 text-black mt-8">
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
            key={spore.amount}
            className="relative translate-y-0 hover:z-10 hover:shadow-2xl hover:-translate-y-0.5 bg-inherit rounded-lg shadow-xl transition-all cursor-pointer group bg-white"
          >
            <div className="flex shrink-0 aspect-square rounded-t-md overflow-hidden items-center bg-gray-100 ">
              {
                // eslint-disable-next-line @next/next/no-img-element
                spore.type?.startsWith('image') && <img src={spore.image} alt="" className="w-full object-cover block" />
              }
              {
                // eslint-disable-next-line @next/next/no-img-element
                spore.url && <img src={spore.url} alt="" className="w-full object-cover block" />
              }
              {
                (!spore.type?.startsWith('image') && !spore.url) && <p className="p-3">{spore.textContent}</p>
              }
            </div>
            <div className="p-3">{formatString(spore.amount, 5)}</div>
          </div>
        ))
      )}

    </div>
  );
}
