"use client";

import React, {ChangeEvent, useState} from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { WalletItem } from "@/store/wallet/walletSlice";
import { ChevronDown } from "lucide-react";
import WalletSelect from "./walletSelect";
import AssetModal, { SelectAssetType, ASSET_TYPE } from "./asset";
import Image from "next/image";
import {formatString} from "@/utils/common";
import { CkbHepler } from "@/query/ckb/ckbRequest";
import { BI } from "@ckb-lumos/bi";
import {CKB_RPC_URL, getSporeTypeScript} from "@/settings/variable";
import {getEnv} from "@/settings/env";
import {send_DOB, signAndSendTransaction} from "@/lib";
import { getSporeById, getSporeByOutPoint, setSporeConfig, transferSpore } from "@spore-sdk/core";
import { sporeConfig } from "@/utils/config";
import { getSpore } from "@/query/ckb/tools";
import { config, helpers, RPC } from "@ckb-lumos/lumos";
import { formatter } from "@/lib/formatParamas";
import { signRawTransaction } from "@joyid/ckb";
import { Test_Config } from "@/lib/constant";
import { enqueueSnackbar } from "notistack";
import { createJoyIDScriptInfo } from "@/query/ckb/joyid";

export default function SendContent() {
  const wallets = useSelector((state: RootState) => state.wallet.wallets);
  const [selectWallet, setSelectWallet] = useState<WalletItem>(wallets[0]);
  const [to,setTo] = useState('')

  const [assetModalVisible, setAssetModalVisible] = useState(false);
  const [selectAsset, setSelectAsset] = useState<SelectAssetType>();

  const [amount, setAmount] = useState<number>();

  const onSend = () => {
      switch (selectAsset?.type) {
          case ASSET_TYPE.SPORE:
              send_Spore()
              break;
      }

  };
  const handleInput =(e:ChangeEvent)=>{
      const {value} = e.target as HTMLInputElement;
      setTo(value);
  }

  const send_Spore = async () =>{
      // console.log("===send_Spore====",selectWallet,to,selectAsset)
      // const isMainnet = getEnv() == "Testnet" ? false : true;
      // console.log("===isMainnet====",isMainnet)

      // await send_DOB(selectWallet.address,selectAsset?.data?.outPoint,to,isMainnet)
        // const { txSkeleton } = await transferSpore({
        //     outPoint:outPoint,
        //     fromInfos: [currentAccountInfo],
        //     toLock: addr,
        //     config: sporeConfig
        // });
      
      const rpc = new RPC(Test_Config.CKB_RPC_URL);
      let sporeCell = await getSporeById(selectAsset?.data.amount, sporeConfig);
      const { txSkeleton } = await transferSpore({
        outPoint: sporeCell.outPoint!!,
        fromInfos: [selectWallet.address],
        toLock: helpers.parseAddress(to),
        config: sporeConfig
      });
      const tx = helpers.createTransactionFromSkeleton(txSkeleton);
      //@ts-ignore
      const signTx = await signRawTransaction(tx, selectWallet.address);
      try {
        const txHash = rpc.sendTransaction(signTx, "passthrough");
        enqueueSnackbar("Transfer Successful", {variant: "success"})
      } catch {
        enqueueSnackbar("Transfer Error", {variant: "error"})
      }
    }

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
          value={to}
          onChange={(e)=>handleInput(e)}
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
              <>
                {selectAsset.type === ASSET_TYPE.UDT ? (
                  <div className="flex gap-2 items-center">
                    <Image
                      width={32}
                      height={32}
                      src="/img/btc.png"
                      alt="USDT"
                      className="w-8 h-8 rounded-full object-cover min-w-[2rem]"
                    />
                    <div className="leading-5">
                      <div className="font-semibold ">SUDT</div>
                      <div>sudtname</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <div className="relative w-8 h-8 flex items-center justify-center aspect-square">
                      <img
                        src={`https://a-simple-demo.spore.pro/api/media/${selectAsset.data.amount}`}
                        alt=""
                        width={32}
                        height={0}
                        className="w-full object-cover block rounded-lg"
                      />
                    </div>
                    <div>{formatString(selectAsset.data.amount, 5)}</div>
                  </div>
                )}
              </>
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
      {selectAsset?.type !== ASSET_TYPE.SPORE && (
        <div className="flex flex-col gap-2">
          <p className="font-semibold">Amount</p>
          <input
            type="number"
            className="w-full h-11 px-3 text-sm rounded-md text-gray-900 outline-none focus:ring-2 focus:ring-primary-default"
            placeholder="0.00"
            value={amount}
          />
          {!!selectAsset && (
            <p className="sm:text-xs font-normal text-right">
              Available Balance: 0.0787895165 SUDT
            </p>
          )}
        </div>
      )}

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
              console.log(data)
            setSelectAsset(data);
            setAssetModalVisible(false);
          }}
        />
      )}
    </>
  );
}
function registerCustomLockScriptInfos(arg0: any[]) {
  throw new Error("Function not implemented.");
}

