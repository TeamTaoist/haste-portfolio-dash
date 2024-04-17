"use client";

import React, {ChangeEvent, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import { RootState } from "@/store/store";
import {setCurrentWalletAddress, WalletItem} from "@/store/wallet/walletSlice";
import { ChevronDown } from "lucide-react";
import WalletSelect from "./walletSelect";
import AssetModal, { SelectAssetType, ASSET_TYPE } from "./asset";
import Image from "next/image";
import {formatString} from "@/utils/common";
import { CkbHepler } from "@/query/ckb/ckbRequest";
import {BI, BIish, formatUnit} from "@ckb-lumos/bi";

import { getSporeById,  transferSpore } from "@spore-sdk/core";
import { sporeConfig } from "@/utils/config";
import { config, helpers, RPC } from "@ckb-lumos/lumos";
import { signRawTransaction } from "@joyid/ckb";
import { Test_Config ,Main_Config} from "@/lib/constant";

import { enqueueSnackbar } from "notistack";
import { parseUnit } from "@ckb-lumos/bi";
import {getEnv} from "@/settings/env";
import {MainnetInfo, TestnetInfo} from "@/settings/variable";
import {getSymbol} from "@/lib/utils";
import {RGBHelper} from "@/lib/wallet/RGBHelper";
import {BtcHepler} from "@/lib/wallet/BtcHelper";
import {RgbAssert} from "@/lib/interface";
import Loading from "@/app/_components/loading";
export default function SendContent() {
  const wallets = useSelector((state: RootState) => state.wallet.wallets);
  const [selectWallet, setSelectWallet] = useState<WalletItem>(wallets[0]);
  const [to,setTo] = useState('')

  const [assetModalVisible, setAssetModalVisible] = useState(false);
  const [selectAsset, setSelectAsset] = useState<SelectAssetType>();
  const [isNative,setIsNative] = useState(true)
    const [loading,setLoading] = useState(false);

  const [amount, setAmount] = useState<number|string>('');
    const dispatch = useDispatch();

  const isToCKB = (to:string) =>{
      return to.startsWith("ckb") || to.startsWith("ckt")
  }

  const onSend = () => {
      setLoading(true)
    if(isNative){
        if(isToCKB(selectWallet.address) !== isToCKB(to)) {
            enqueueSnackbar("Address Error", {variant: "error"})
            return;
        }
        if(isToCKB(to)){
            CkbHepler.instance.transfer_ckb({
                from: selectWallet.address,
                to,
                amount:parseUnit(amount.toString(), "ckb").toBigInt()
            },selectWallet.address)
                .then((rs)=>{
                    enqueueSnackbar("Transfer Successful", {variant: "success"})
                console.log("ckb to ckb tx hash:", rs);
            }).catch((err) => {
                console.error(err);
                enqueueSnackbar("Transfer Error", {variant: "error"})
            }).finally(()=>{
                setLoading(false)
            });
        }else{
            RGBHelper.instance.transferBTC(
                to,
                amount as number
            )
                .then((rs)=>{
                enqueueSnackbar("Transfer Successful", {variant: "success"})
                console.log("btc to btc tx hash:", rs);
            }).catch((err) => {
                console.error(err);
                enqueueSnackbar("Transfer Error", {variant: "error"})
            }).finally(()=>{
                setLoading(false)
            });
        }


    }else{
        switch (selectAsset?.type) {
            case ASSET_TYPE.SPORE:
                send_Spore()
                break;
            case ASSET_TYPE.UDT:
                send_UDT()
                break;
        }
    }

  };
  const handleInput =(e:ChangeEvent)=>{
      const {value,name} = e.target as HTMLInputElement;
      if(name === "to"){
          setTo(value);
      }else{
          setAmount(Number(value))
      }

  }

  const send_Spore = () =>{
      switch (true) {
          case selectWallet.chain === "ckb" && isToCKB(to):
              send_ckb2ckb_Spore()
              break;
          // case selectWallet.chain === "btc" && !isToCKB():
          //     send_btc2btc_Spore()
          //     break;
      }


  }

  const send_UDT =() => {

      switch (true) {
          case selectWallet.chain === "ckb" && isToCKB(to):
              send_ckb2ckb_UDT()
              break;
          case selectWallet.chain === "ckb" && !isToCKB(to):
              send_ckb2btc_UDT()
              break;
          case selectWallet.chain === "btc" && !isToCKB(to):
              send_btc2btc_UDT()
              break;
          case selectWallet.chain === "btc" && isToCKB(to):
              send_btc2ckb_UDT()
              break;



      }
    }

    const send_ckb2ckb_Spore = async () =>{

      const cfg = getEnv() === 'Mainnet' ? Main_Config.CKB_RPC_URL: Test_Config.CKB_RPC_URL ;
      const rpc = new RPC(cfg);
      let sporeCell = await getSporeById(selectAsset?.data.amount, sporeConfig);
      const { txSkeleton } = await transferSpore({
        outPoint: sporeCell.outPoint!!,
        fromInfos: [selectWallet.address],
        toLock: helpers.parseAddress(to, {config: sporeConfig.lumos}),
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
      }finally {
          setLoading(false)
      }
    }
    const send_ckb2ckb_UDT = () =>{
        CkbHepler.instance
            .transfer_udt({
                from: selectWallet.address,
                to: to,
                amount: parseUnit(amount?.toString(), "ckb"),
                typeScript: selectAsset?.data.type_script,
            },selectWallet.address)
            .then((txHash) => {
                console.log("transfer udt txHash", txHash);
                enqueueSnackbar("Transfer Successful ", {variant: "success"})

            })
            .catch((err) => {
                console.error(err);
                enqueueSnackbar("Transfer Error", {variant: "error"})

            }).finally(()=>{
                setLoading(false)
        });
    }



    const send_btc2ckb_UDT = () =>{

        const {txHash,idx,type_script} = selectAsset?.data;
        RGBHelper.instance
            .transfer_btc_to_ckb(
                to,
                type_script,
                BI.from(parseUnit(amount.toString(), "ckb")).toBigInt(),
                txHash,
                idx,
            )
            .then((rs) => {
                console.log("btc to ckb tx hash:", rs);
                enqueueSnackbar("Transfer Successful", {variant: "success"})
            })
            .catch((err) => {
                console.error(err);
                enqueueSnackbar("Transfer Error", {variant: "error"})
            }).finally(()=>{
                setLoading(false)
        });
    }
    const send_btc2btc_UDT = () =>{
        console.log("===send_btc2btc_UDT====",selectWallet,to,selectAsset,amount)
        const {txHash,idx,type_script} = selectAsset?.data;
        RGBHelper.instance
            .transfer_btc_to_btc(
                txHash,
                idx,
                to,
                type_script,
                BI.from(parseUnit(amount.toString(), "ckb")).toBigInt()
            )
            .then((rs) => {
                console.log("btc to btc tx hash:", rs);
                enqueueSnackbar("Transfer Successful", {variant: "success"})
            })
            .catch((err) => {
                console.error(err);
                enqueueSnackbar("Transfer Error", {variant: "error"})
            }).finally(()=>{
            setLoading(false)
        });


    }

    const send_ckb2btc_UDT = async() =>{

        const {type_script} = selectAsset?.data;

        let rs = await RGBHelper.instance.getRgbppAssert(to);
        console.log(rs,selectAsset)

        let findUtxo: RgbAssert | undefined = undefined;
        // find same utxo
        for (let i = 0; i < rs.length; i++) {
            const utxo = rs[i];
            if (
                utxo.ckbCellInfo &&
                utxo.ckbCellInfo.type_script.args == selectAsset?.data.type_script.args &&
                utxo.ckbCellInfo.type_script.codeHash ==
                selectAsset?.data.type_script.codeHash &&
                utxo.ckbCellInfo.type_script.hashType == selectAsset?.data.type_script.hashType
            ) {
                findUtxo = utxo;
                break;
            }
        }
        // find empty utxo
        if (!findUtxo) {
            for (let i = 0; i < rs.length; i++) {
                const utxo = rs[i];
                if (!utxo.ckbCellInfo) {
                    findUtxo = utxo;
                    break;
                }
            }
        }

        if (!findUtxo) {
           // console.error({
           //      title: "Warning",
           //      description: "No can use utxo",
           //      variant: "destructive",
           //  });
            enqueueSnackbar("No can use utxo ", {variant: "error"})
            return;
        }


        const {idx,txHash} = findUtxo;
        RGBHelper.instance
            .transfer_ckb_to_btc(
                txHash,
                idx,
                type_script,
                parseUnit(amount.toString(), "ckb").toBigInt()
            )
            .then((rs) => {
                console.log("ckb to btc tx hash:", rs);
                enqueueSnackbar("Transfer Successful ", {variant: "success"})
            })
            .catch((err) => {
                console.error(err);
                enqueueSnackbar("Transfer Error", {variant: "error"})
            }).finally(()=>{
            setLoading(false)
        });
    }
    //@ts-ignore
    const handleSelect = (w) =>{
        setSelectWallet(w)
        dispatch(setCurrentWalletAddress(w.address))
    }

  return (
      <>
          {
              loading && <Loading />
          }
          <div className="flex flex-col gap-2">
              <p className="font-semibold ">Send from</p>
              <WalletSelect
                  selectWallet={selectWallet}
                  wallets={wallets}
                  onChangeSelect={(w) => handleSelect(w)}
              />
          </div>
          <div className="flex flex-col gap-2">
              <p className="font-semibold">Send to</p>
              <input
                  type="text"
                  className="w-full h-11 px-3 text-sm rounded-md text-gray-900 outline-none focus:ring-2 focus:ring-primary-default bg-gray-100"
                  placeholder="Receive Address"
                  value={to}
                  name="to"
                  onChange={(e) => handleInput(e)}
              />
          </div>

          <div className="flex gap-2 justify-between">
              <p className="font-semibold">Native Token</p>
              <div className="relative">
                  <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={isNative} className="sr-only peer outline-none 1" onChange={()=>setIsNative(!isNative)}/>
                      <div
                          className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-white dark:peer-focus:ring-primary011 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary011"></div>

                  </label>
              </div>

          </div>
          {
              !isNative && <div className="flex flex-col gap-2">
                  <p className="font-semibold">Asset</p>
                  <div className="relative">
                      <button
                          type="button"
                          className="relative w-full cursor-pointer rounded-md bg-gray-100 py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm outline-none focus:ring-2 focus:ring-primary-default sm:text-sm sm:leading-6"
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
                                              <div
                                                  className="font-semibold ">{getSymbol(selectAsset?.data?.type_script)}</div>
                                              <div>{selectAsset?.data?.symbol}</div>
                                          </div>
                                      </div>
                                  ) : (
                                      <div className="flex gap-2 items-center">
                                          <div className="relative w-8 h-8 flex items-center justify-center aspect-square">
                                              <img
                                                  src={`https://a-simple-demo.spore.pro/api/media/${selectAsset?.data?.amount}`}
                                                  alt=""
                                                  width={32}
                                                  height={0}
                                                  className="w-full object-cover block rounded-lg"
                                              />
                                          </div>
                                          <div>{formatString(selectAsset?.data?.amount, 5)}</div>
                                      </div>
                                  )}
                              </>
                          ) : (
                              <>
                <span className="flex items-center h-8">
                  <span className="text-slate-400">Select Asset</span>
                </span>
                                  <span
                                      className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                  <ChevronDown className="text-slate-400"/>
                </span>
                              </>
                          )}
                      </button>
                  </div>
              </div>
          }

          {selectAsset?.type !== ASSET_TYPE.SPORE && (
              <div className="flex flex-col gap-2">
                  <p className="font-semibold">Amount</p>
                  <input
                      type="number"
                      className="w-full h-11 px-3 text-sm rounded-md text-gray-900 outline-none focus:ring-2 focus:ring-primary-default bg-gray-100"
                      placeholder="0.00"
                      value={amount}
                      name="amount"
                      onChange={(e) => handleInput(e)}
                  />

                  {!!selectAsset && (
                      <p className="sm:text-xs font-normal text-right">
                          Available
                          Balance: {formatUnit(selectAsset?.data?.amount, "ckb")} {getSymbol(selectAsset?.data?.type_script)}
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
          {assetModalVisible && selectWallet && (
              <AssetModal
                  closeModal={() => setAssetModalVisible(false)}
                  selectWallet={selectWallet}
                  onSelectAsset={(data) => {
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

