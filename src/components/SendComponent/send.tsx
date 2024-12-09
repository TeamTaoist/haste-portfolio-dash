
import  {ChangeEvent, useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import { RootState } from "../../store/store";
import {setCurrentWalletAddress, WalletItem} from "../../store/wallet/walletSlice";
import { ChevronDown } from "lucide-react";
import WalletSelect from "./walletSelect";
import AssetModal, { SelectAssetType, ASSET_TYPE } from "./asset";
import {formatString} from "../../utils/common";
import { CkbHepler } from "../../query/ckb/ckbRequest";
import {BI, formatUnit} from "@ckb-lumos/bi";

import {getSporeById, transferSpore} from "@spore-sdk/core";
import { sporeConfig } from "../../utils/config";
import { helpers, RPC} from "@ckb-lumos/lumos";
import { signRawTransaction } from "@joyid/ckb";
import { Test_Config ,Main_Config} from "../../lib/constant";

import { enqueueSnackbar } from "notistack";
import { parseUnit } from "@ckb-lumos/bi";
import {getEnv} from "../../settings/env";
import {getSymbol} from "../../lib/utils";
import {RGBHelper} from "../../lib/wallet/RGBHelper";
import {RgbAssert} from "../../lib/interface";
import Loading from "../../components/loading";
import {getFeeRate} from "../../query/ckb/feerate.ts";
import SporeItem from "../Dashboard/sporeItem.tsx";
import {ckb2BTC_spore} from "../../lib/wallet/ckb2BTC.ts";


// import BtcImg from "../../assets/img/btc.png";
export default function SendContent() {
  const wallets = useSelector((state: RootState) => state.wallet.wallets);
  const [selectWallet, setSelectWallet] = useState<WalletItem>(wallets[0]);
  const [to,setTo] = useState('')

  const [assetModalVisible, setAssetModalVisible] = useState(false);
  const [selectAsset, setSelectAsset] = useState<SelectAssetType | null>();
  const [isNative,setIsNative] = useState(false)
    const [loading,setLoading] = useState(false);

  const [amount, setAmount] = useState<number|string>('');
    const dispatch = useDispatch();

    useEffect(() => {
        setTo("")
        setAmount("")
        setSelectAsset(null)


    }, [selectWallet]);

    useEffect(() => {


        if( selectAsset?.type === ASSET_TYPE.SPORE){
            setAmount(1)
        }else{
            setAmount("")
        }

    }, [selectAsset]);


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
          case selectWallet.chain === "btc" && !isToCKB(to):
              send_btc2btc_Spore()
              break;
          case selectWallet.chain === "btc" && isToCKB(to):
              send_btc2ckb_Spore()
              break;
          case selectWallet.chain === "ckb" && !isToCKB(to):
              send_ckb2btc_Spore()
              break;
      }

  }

  const send_btc2ckb_Spore = () =>{
      RGBHelper.instance
          .transfer_btc_to_ckb_spore(
              selectWallet!.address,
              selectWallet!.pubKey,
              to,
              selectAsset?.data.amount,
              selectWallet?.walletName
          )
          .then((rs) => {
              console.log("btc to ckb tx hash:", rs);
              enqueueSnackbar("Transfer Successful", {variant: "success"})
          })
          .catch((err) => {
              console.error(err);
              enqueueSnackbar(err.message, {variant: "error"})
          }).finally(()=>{
          setLoading(false)
      });
  }
  const send_ckb2btc_Spore = () =>{
      ckb2BTC_spore(
              selectWallet!.address,
              selectWallet!.pubKey,
              to,
              selectAsset?.data.amount,
              selectWallet?.walletName
          )
          .then((txSkeleton) => {
              console.log("btc to ckb tx hash:", txSkeleton);
              enqueueSnackbar("Transfer Successful", {variant: "success"})
          })
          .catch((err) => {
              console.error(err);
              enqueueSnackbar(err.message, {variant: "error"})
          }).finally(()=>{
          setLoading(false)
      });
  }

  const send_btc2btc_Spore =() =>{
      RGBHelper.instance
          .transfer_btc_to_btc_spore(
              selectWallet!.address,
              selectWallet!.pubKey,
              to,
              selectAsset?.data.amount,
              selectWallet?.walletName
          )
          .then((rs) => {
              console.log("btc to ckb tx hash:", rs);
              enqueueSnackbar("Transfer Successful", {variant: "success"})
          })
          .catch((err) => {
              console.error(err);
              enqueueSnackbar(err.message, {variant: "error"})
          }).finally(()=>{
          setLoading(false)
      });

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

      let feeRateRt = await getFeeRate();
      let feeRate = BI.from(feeRateRt.median).toString()

      let sporeCell = await getSporeById(selectAsset?.data.amount, sporeConfig);
      let outputCell = JSON.parse(JSON.stringify(sporeCell));
        outputCell.cellOutput.lock = helpers.parseAddress(to, {config: sporeConfig.lumos});
        let inputMin = helpers.minimalCellCapacityCompatible(sporeCell);
        let outputMin = helpers.minimalCellCapacityCompatible(outputCell);

        let minBi = outputMin.sub(inputMin.toString());

        let amount:any;
        if(minBi.gt("0")){
            amount = minBi
        }else{
            amount = BI.from("0")
        }

      const { txSkeleton } = await transferSpore({
        outPoint: sporeCell.outPoint!!,
        fromInfos: [selectWallet.address],
        toLock: helpers.parseAddress(to, {config: sporeConfig.lumos}),
        config: sporeConfig,
          feeRate,
         capacityMargin:amount,
        useCapacityMarginAsFee:false
      });


      //@ts-ignore

        if(selectWallet.walletName === "joyidckb"){
            const tx = helpers.createTransactionFromSkeleton(txSkeleton);
            try {
                const signTx = await signRawTransaction(tx as any, selectWallet.address);
                await rpc.sendTransaction(signTx, "passthrough");
                enqueueSnackbar("Transfer Successful", {variant: "success"})
            } catch(e) {
                console.error(e)
                enqueueSnackbar("Transfer Error", {variant: "error"})
            }finally {
                setLoading(false)
            }
        }else if(selectWallet.walletName === "rei"){
            try {
                const txObj = helpers.transactionSkeletonToObject(txSkeleton)
                 await (window as any).rei?.ckb.request({method:"ckb_sendRawTransaction",data:{
                        txSkeleton:txObj
                    }})
                enqueueSnackbar("Transfer Successful", {variant: "success"})
            } catch(e) {
                console.error(e)
                enqueueSnackbar("Transfer Error:", {variant: "error"})
            }finally {
                setLoading(false)
            }
        }

    }
    const send_ckb2ckb_UDT = () =>{

        CkbHepler.instance
            .transfer_udt({
                from: selectWallet.address,
                to: to,
                amount: parseUnit(amount?.toString(), "ckb"),
                walletName:selectWallet.walletName,
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
        const {cellOutput:{type:type_script,lock}} = selectAsset?.data;
        // const {txHash,idx,type_script} = selectAsset?.data;
        RGBHelper.instance
            .transfer_btc_to_ckb(
                to,
                type_script,
                BI.from(parseUnit(amount.toString(), "ckb")).toBigInt(),
                lock
            )
            .then((rs) => {
                console.log("btc to ckb tx hash:", rs);
                enqueueSnackbar("Transfer Successful", {variant: "success"})
            })
            .catch((err) => {
                console.error(err);
                enqueueSnackbar(err.message, {variant: "error"})
            }).finally(()=>{
                setLoading(false)
        });
    }
    const send_btc2btc_UDT = () =>{
        const {cellOutput:{type:type_script,lock}} = selectAsset?.data;

        RGBHelper.instance
            .transfer_btc_to_btc(
                to,
                type_script,
                BI.from(parseUnit(amount.toString(), "ckb")).toBigInt(),
                lock
            )
            .then((rs) => {
                console.log("btc to btc tx hash:", rs);
                enqueueSnackbar("Transfer Successful", {variant: "success"})
            })
            .catch((err) => {
                console.error(err);
                enqueueSnackbar(err.message, {variant: "error"})
            }).finally(()=>{
            setLoading(false)
        });
    }

    const send_ckb2btc_UDT = async() =>{
        const {type_script} = selectAsset?.data;


        let rs = await RGBHelper.instance.getRgbppAssert(to);
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
                          className="relative w-full cursor-pointer rounded-md bg-gray-100 py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm outline-none focus:ring-2 focus:ring-primary-default sm:text-sm sm:leading-6 h-11"
                          aria-haspopup="listbox"
                          aria-expanded="true"
                          aria-labelledby="listbox-label"
                          onClick={() => setAssetModalVisible(true)}
                      >
                          {selectAsset ? (
                              <>
                                  {selectAsset?.type === ASSET_TYPE.UDT ? (
                                      <div className="flex gap-2 items-center">
                                          {/*<img*/}
                                          {/*    width={32}*/}
                                          {/*    height={32}*/}
                                          {/*    src={BtcImg}*/}
                                          {/*    alt="USDT"*/}
                                          {/*    className="w-8 h-8 rounded-full object-cover min-w-[2rem]"*/}
                                          {/*/>*/}
                                          <div className="leading-5">
                                              {
                                                  !!selectAsset?.symbol && <div
                                                      className="font-semibold uppercase">{selectAsset?.symbol}</div>
                                              }

                                              {
                                                  !!selectAsset?.data?.symbol && <div
                                                      className="text-xs text-gray-500 uppercase">{selectAsset?.data?.symbol}</div>
                                              }

                                          </div>
                                      </div>
                                  ) : (
                                      <div className="flex gap-2 items-center">
                                          <div className="w-8 h-8">
                                              <SporeItem tokenKey={selectAsset?.data?.amount} data={selectAsset?.data?.data} key={(selectAsset as any)?.data?.amount} />
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

                  {!!selectAsset && !isNative&& (
                      <p className="sm:text-xs font-normal text-right text-xs">
                          Available
                          Balance: {formatUnit( selectAsset?.data?.sum && selectAsset?.data?.sum?.toString() || selectAsset?.data?.amount, "ckb")} <span className="uppercase">{selectAsset?.symbol}</span>
                      </p>
                  )}
              </div>
          )}
          <button
              className="w-full bg-primary011 text-primary001 rounded-lg py-2 font-Montserrat text-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={(isNative &&(!to.length || !amount) )  || (!isNative && (!to.length || !amount || selectAsset==null))}
              onClick={onSend}
          >Send
          </button>
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


