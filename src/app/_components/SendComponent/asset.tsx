"use client";

import { CircleX, Search } from "lucide-react";
import {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
} from "react";
import EmptyImage from "../common/Empty/image";
import Image from "next/image";
import {getXudtAndSpore} from "@/query/ckb/tools";
import {ckb_SporeInfo, ckb_UDTInfo} from "@/types/BTC";
import {useSelector} from "react-redux";
import {RootState} from "@/store/store";
import {formatString} from "@/utils/common";
import {getRgbppAssert} from "@/query/rgbpp/tools";
import {formatUnit} from "@ckb-lumos/bi";
import {WalletItem} from "@/store/wallet/walletSlice";
import { getSymbol } from "@/lib/utils";

export enum ASSET_TYPE {
  UDT,
  SPORE,
}

export type SelectAssetType = {
  type: ASSET_TYPE;
  data: any; // TODO 这里是具体Asset type
};

type SelectFunction = (data: SelectAssetType) => void;

interface IAssetModalProps {
  onSelectAsset: SelectFunction;
  selectWallet: WalletItem;
  closeModal: () => void;
}

export default function AssetModal({
  onSelectAsset,
  closeModal,
                                     selectWallet
}: IAssetModalProps) {
  const assetRef = useRef<AssetRef>(null);
  const [selectType, setSelectType] = useState<ASSET_TYPE>(ASSET_TYPE.UDT);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    assetRef?.current?.search(keyword);
  }, [keyword, assetRef]);

  return (
    <div className="flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none bg-black/50">
      <div
        className="relative w-auto mx-auto max-w-full bg-white p-6 rounded-2xl"
        style={{ width: "644px" }}
      >
        <div className="relative text-xl font-semibold">
          <div className="text-center w-full">Select asset to send</div>
          <span
            className="cursor-pointer h-6 w-6 absolute right-0 top-0 z-50"
            onClick={closeModal}
          >
            <CircleX />
          </span>
        </div>
        <div className="mt-4">
          <div className="flex md:flex-col sm:flex-col justify-between items-center gap-4 sm:gap-[10px]">
            <div className="flex p-0.5 border rounded-full transition-colors w-full h-[46px] sm:space-x-0 border-muted">
              <button
                className={`w-full py-2 text-sm leading-5 px-3 rounded-full font-medium text-black ${
                  selectType === ASSET_TYPE.UDT ? "bg-primary011" : ""
                } focus:outline-none focus:ring-0 sm:px-4 md:px-4`}
                onClick={() => setSelectType(ASSET_TYPE.UDT)}
              >
                {selectWallet?.chain === 'btc'?"RGB++":"UDT"}
              </button>
              <button
                className={`w-full py-2 text-sm leading-5 px-3 rounded-full font-medium text-black ${
                  selectType === ASSET_TYPE.SPORE ? "bg-primary011" : ""
                } focus:outline-none focus:ring-0 sm:px-4 md:px-4 whitespace-nowrap`}
                onClick={() => setSelectType(ASSET_TYPE.SPORE)}
                disabled={selectWallet?.chain === 'btc'}
              >
                {selectWallet?.chain === 'btc'?"RGB++ Spore":"Spore"}
              </button>
            </div>
            <div className="flex items-center gap-3 bg-white border outline-none px-4 pl-4 py-2.5 border-slate-300 !mr-0 w-full mr-3 rounded-md ">
              <Search className="text-slate-500 w-4" />
              <input
                type="search"
                placeholder="Search"
                className="bg-transparent focus:border-transparent focus:outline-none text-gray-900 flex-1 h-full"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4">
            <div className="sm:overflow-y-auto h-full sm:h-[380px]">
              {selectType === ASSET_TYPE.UDT  && (
                <UdtAsset onSelect={onSelectAsset} ref={assetRef} selectWallet={selectWallet} />
              )}
              {selectType === ASSET_TYPE.SPORE && (
                <SporeAsset onSelect={onSelectAsset} ref={assetRef} selectWallet={selectWallet} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface IAssetProps {
  onSelect: SelectFunction;
  selectWallet: WalletItem;
}
type AssetRef = {
  search: (keyword?: string) => void;
};

const UdtAsset = forwardRef<AssetRef, IAssetProps>(({ onSelect,selectWallet }, ref) => {
  // const [tokens] = useState(new Array(100).fill(0));
  const [filteredTokens, setFilteredTokens] = useState(new Array(100).fill(0));
  const [xudtList, setXudtList] = useState<(ckb_UDTInfo | ckb_SporeInfo | undefined)[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // const wallets = useSelector((state: RootState) => state.wallet.wallets);
  const currentAddress = useSelector((state: RootState) => state.wallet.currentWalletAddress);

  const _getSporeAndXudt = async(address: string) => {
    const assetsList = await getXudtAndSpore(address);
    setXudtList(assetsList.xudtList);
    setIsLoading(false);
  }

  const _getRgbAsset = async(address: string) => {
    const assetsList = await getRgbppAssert(address);
    const rgbAssetList = assetsList.filter(asset => asset.ckbCellInfo);
    //@ts-ignore
    setXudtList(rgbAssetList)
    setIsLoading(false);
  }

  const getCurrentAssets = async() => {
    // const currentWallet = wallets.find(wallet => wallet.address === currentAddress);
    const chain = selectWallet?.chain;
    if ( chain && chain === 'btc') {
      await _getRgbAsset(selectWallet?.address!!)
    } else if (chain && chain === 'ckb') {
      const list = await _getSporeAndXudt(selectWallet?.address!!);
    }
  }

  useEffect(() => {
    getCurrentAssets()
  }, [selectWallet?.address])

  useImperativeHandle(ref, () => ({
    search: (keyword?: string) => {
      console.log(">> search in udt", keyword);
      if (!keyword) {
        // setFilteredTokens(tokens);
      }
      // TODO filter name
      // tokens.filter();
    },
  }));

  return <>{ isLoading ? (
      Array.from({ length: 3 }, (_, index) => (
          <div key={index}
               className="group group flex rounded-md items-center justify-start w-full gap-4 px-2 sm:px-4 py-3 text-sm hover:bg-primary011"
          >
            <button
                key={index}
                className="group group flex rounded-md items-center justify-start w-full gap-4 px-2 sm:px-4 py-3 text-sm hover:bg-primary011"
            >
              <div className="relative w-8 h-8 flex items-center justify-center aspect-square">
                <div
                    className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200 bg-200% animate-shimmerSpore"></div>
              </div>
              <div className="flex flex-col justify-start items-start truncate">
                <div className="text-xs sm:text-sm leading-5 text-default font-bold">
                  <div
                      className="h-4 bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200 bg-200% rounded animate-shimmerSpore"></div>
                </div>
              </div>
            </button>
          </div>
      ))
  ) :xudtList.map((udt, index) => (
    <button
      key={index}
      className="group group flex rounded-md items-center justify-between w-full space-x-4 px-2 sm:px-4 py-3 text-sm hover:bg-primary011 hover:text-white"
      onClick={() => onSelect({ type: ASSET_TYPE.UDT, data: {...udt,...udt?.ckbCellInfo} })}
    >
      <div className="flex text-left items-center gap-2">
        <Image
          width={32}
          height={32}
          src="/img/btc.png"
          alt="USDT"
          className="w-8 h-8 rounded-full object-cover min-w-[2rem] border border-gray-200"
        />
        <div>
          <p className="text-xs sm:text-sm leading-5 font-semibold">{udt?.ckbCellInfo?getSymbol(udt?.ckbCellInfo?.type_script):getSymbol(udt?.type_script)}</p>
          <p className="sm:text-xs font-normal text-slate-300">{udt?.ckbCellInfo?.symbol}</p>
        </div>
      </div>
      <div className="flex flex-col items-end sm:max-w-[200px]">
        <p className="sm:text-sm font-normal text-sm">   {udt?.ckbCellInfo?formatUnit(udt?.ckbCellInfo?.amount ?? '0',"ckb"):formatUnit(udt?.amount ?? '0',"ckb")}</p>
        <p className="sm:text-xs font-normal text-slate-300"> $--,--</p>
      </div>
    </button>
  ))}</>
});
UdtAsset.displayName = "UdtAsset";

const SporeAsset = forwardRef<AssetRef, IAssetProps>(({ onSelect,selectWallet }, ref) => {
  // const [spores] = useState(new Array(100).fill(0));
  const [spores, setSpores] = useState<ckb_SporeInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const wallets = useSelector((state: RootState) => state.wallet.wallets);
  const currentAddress = useSelector((state: RootState) => state.wallet.currentWalletAddress);

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

  const _getSpore = async(address: string) => {
    const assetsList = await getXudtAndSpore(address);

    setSpores(assetsList.sporeList);
    setIsLoading(false);
  }

  const [filteredSpores, setFilteredSpores] = useState(new Array(100).fill(0));

  useEffect(() => {
    // TODO
    // get spores
    // setFilteredSpores(spores);
  }, []);

  useImperativeHandle(ref, () => ({
    search: (keyword?: string) => {
      console.log(">> search in spore", keyword)
      if (!keyword) {
        setFilteredSpores(spores);
      }
      // TODO filter name
      // spores.filter();
    },
  }));

  return <>
    {

      isLoading ? (
              Array.from({ length: 3 }, (_, index) => (
                  <div key={index}
                       className="group group flex rounded-md items-center justify-start w-full gap-4 px-2 sm:px-4 py-3 text-sm hover:bg-primary010"
                  >
                    <button
                        key={index}
                        className="group group flex rounded-md items-center justify-start w-full gap-4 px-2 sm:px-4 py-3 text-sm hover:bg-primary010"
                    >
                      <div className="relative w-8 h-8 flex items-center justify-center aspect-square">
                        <div
                            className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200 bg-200% animate-shimmerSpore"></div>
                      </div>
                      <div className="flex flex-col justify-start items-start truncate">
                        <div className="text-xs sm:text-sm leading-5 text-default font-bold">
                          <div
                              className="h-4 bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200 bg-200% rounded animate-shimmerSpore"></div>
                        </div>
                      </div>
                    </button>
                  </div>
              ))
          ) :
          (spores.map((spore, index) => (
              <button
                  key={index}
                  className="group group flex rounded-md items-center justify-start w-full gap-4 px-2 sm:px-4 py-3 text-sm hover:bg-primary010"
                  onClick={() => onSelect({type: ASSET_TYPE.SPORE, data: spore})}
              >
                <div className="relative w-8 h-8 flex items-center justify-center aspect-square">
                  {Math.round(Math.random()) % 2 === 0 ? (
                      <img
                          src={`https://a-simple-demo.spore.pro/api/media/${spore.amount}`}
                          alt=""
                          className="w-full object-cover block rounded-lg"
                      />
                  ) : (
                      <EmptyImage className="h-full w-full max-w-[5rem] max-h-[5rem]"/>
                  )}
                </div>
                <div className="flex flex-col justify-start items-start truncate">
                  <p className="text-xs sm:text-sm leading-5 text-default font-bold">
                    {formatString(spore.amount, 5)}
        </p>
      </div>
    </button>
  )))}</>
});
SporeAsset.displayName = "SporeAsset";
