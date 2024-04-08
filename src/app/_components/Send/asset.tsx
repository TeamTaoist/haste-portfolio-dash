"use client";

import { CircleX } from "lucide-react";
import { useState } from "react";
import EmptyImage from "../common/Empty/image";
import Image from "next/image";

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
  closeModal: () => void;
}

export default function AssetModal({
  onSelectAsset,
  closeModal,
}: IAssetModalProps) {
  const [selectType, setSelectType] = useState<ASSET_TYPE>(ASSET_TYPE.UDT);
  return (
    <div className="flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none bg-black/50">
      <div
        className="relative w-auto mx-auto max-w-full bg-primary009 p-6 rounded-2xl"
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
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-[10px]">
            <div className="flex p-0.5 border rounded-full transition-colors w-full sm:max-w-[170px] h-[46px] sm:space-x-0 border-muted">
              <button
                className={`w-full py-2 text-sm leading-5 px-3 rounded-full font-medium text-white ${
                  selectType === ASSET_TYPE.UDT ? "bg-primary011" : ""
                } focus:outline-none focus:ring-0 sm:px-4 md:px-4`}
                onClick={() => setSelectType(ASSET_TYPE.UDT)}
              >
                UDT
              </button>
              <button
                className={`w-full py-2 text-sm leading-5 px-3 rounded-full font-medium text-white ${
                  selectType === ASSET_TYPE.SPORE ? "bg-primary011" : ""
                } focus:outline-none focus:ring-0 sm:px-4 md:px-4`}
                onClick={() => setSelectType(ASSET_TYPE.SPORE)}
              >
                Spore
              </button>
            </div>
            <input
              type="search"
              placeholder="Search"
              className="border outline-none text-gray-900 px-4 pl-4 py-2.5 border-slate-300 focus:border-primary-default !mr-0 w-full mr-3 rounded-md bg-default-deprecated"
            />
          </div>
          <div className="mt-4">
            <div className="sm:overflow-y-auto h-full sm:h-[380px]">
              {selectType === ASSET_TYPE.UDT && (
                <UdtAsset onSelect={onSelectAsset} />
              )}
              {selectType === ASSET_TYPE.SPORE && (
                <SporeAsset onSelect={onSelectAsset} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const UdtAsset = ({ onSelect }: { onSelect: SelectFunction }) => {
  const [tokens] = useState(new Array(100).fill(0));

  return tokens.map((_, index) => (
    <button
      key={index}
      className="group group flex rounded-md items-center justify-between w-full space-x-4 px-2 sm:px-4 py-3 text-sm hover:bg-primary010"
      onClick={() => onSelect({ type: ASSET_TYPE.UDT, data: {} })}
    >
      <div className="flex text-left items-center gap-2">
        <Image
          width={32}
          height={32}
          src="/img/btc.png"
          alt="USDT"
          className="w-8 h-8 rounded-full object-cover min-w-[2rem]"
        />
        <div>
          <p className="text-xs sm:text-sm leading-5 font-semibold">SUDT</p>
          <p className="sm:text-xs font-normal text-slate-300">sudtname</p>
        </div>
      </div>
      <div className="flex flex-col items-end sm:max-w-[200px]">
        <p className="sm:text-sm font-normal text-sm">1.12341 SUDT</p>
        <p className="sm:text-xs font-normal text-slate-300">$0.41</p>
      </div>
    </button>
  ));
};

const SporeAsset = ({ onSelect }: { onSelect: SelectFunction }) => {
  const [spores] = useState(new Array(100).fill(0));

  return spores.map((_, index) => (
    <button
      key={index}
      className="group group flex rounded-md items-center justify-start w-full gap-4 px-2 sm:px-4 py-3 text-sm hover:bg-primary010"
      onClick={() => onSelect({ type: ASSET_TYPE.SPORE, data: {} })}
    >
      <div className="relative w-8 h-8 flex items-center justify-center aspect-square">
        {Math.round(Math.random()) % 2 === 0 ? (
          <img
            src="https://img.reservoir.tools/images/v2/polygon/hc%2BnPcLmWxs%2FDW99DlBQ42k40ZoyYV5jCIms5qHjwvuJ0YcFQ9C1r6S71lSDSuimxWvQT3aWXuWUieWJXqV9xtJ3mLYRXHCS%2FKnL6XlVQXPtnCacxwAonWizJmF9iXI4V3FKXdlFlxHSvbstd697Qtr6Gnv1HtK%2BeOwoXx8ZP5EO99xEAkOYV%2BCdaZx%2FBGYw?width=512"
            alt=""
            className="w-full object-cover block rounded-lg"
          />
        ) : (
          <EmptyImage className="h-full w-full max-w-[5rem] max-h-[5rem]" />
        )}
      </div>
      <div className="flex flex-col justify-start items-start truncate">
        <p className="text-xs sm:text-sm leading-5 text-default font-bold">
          fdjaslfh hduiagfdsaf djias;hf
        </p>
      </div>
    </button>
  ));
};
