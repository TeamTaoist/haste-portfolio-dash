
import {useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import { RootState } from "../../store/store";
import {setCurrentWalletAddress, WalletItem} from "../../store/wallet/walletSlice";
import WalletSelect from "./walletSelect";


import Loading from "../../components/loading";
import {getRgbAssets} from "../../query/rgbpp/tools.ts";
import SplitItem from "./splitItem.tsx";
import { Uint256LE, Uint32BE, Uint32LE} from "@ckb-lumos/codec/lib/number";
import {bytes} from "@ckb-lumos/codec";
import {append0x} from "@rgbpp-sdk/ckb";
import {BI} from "@ckb-lumos/lumos";
import LeapHelper from "rgbpp-leap-helper/lib";
import {getEnv} from "../../settings/env.ts";
import {mainConfig, testConfig} from "../../lib/wallet/constants.ts";
import {BtcHepler} from "../../lib/wallet/BtcHelper.ts";
import {WalletType} from "../../lib/interface.ts";
import {bitcoin} from "@rgbpp-sdk/btc";


export default function SplitContent() {
    const wallets = useSelector((state: RootState) => state.wallet.wallets);
    const [selectWallet, setSelectWallet] = useState<WalletItem>();

    const[list,setList] = useState<any[]>([]);

    const [filterwallet, setFilterwallet] = useState<WalletItem[]>();

    const [loading,setLoading] = useState(false);

    const [currentIndex, setCurrentIndex] = useState<number|null>(null);

    const[selectSplit, setSelectSplit] = useState<{txHash:string; index:number}|null>(null);

    const dispatch = useDispatch();

    useEffect(() => {
        if(!selectWallet?.address)return;

        _getRgbAsset(selectWallet.address)

    }, [selectWallet]);

    useEffect(() => {

        const btcAddr = wallets?.filter(wallet => wallet.chain === "btc") ?? [];
        setFilterwallet(btcAddr)
        setSelectWallet(btcAddr[0])


    }, [wallets]);


    const _getRgbAsset = async(address: string) => {
        setList([])

        const list = await getRgbAssets(address);

        const groupedData = list.reduce((acc:any, obj:any) => {
            const key= obj?.cellOutput?.lock?.args!;
            if (!acc[key]) {
                acc[key] = []
            }
            acc[key].push(obj)

            return acc;
        }, {});


        const result = Object.values(groupedData);

        const filterArr = result.filter((item:any) => item.length > 1) ?? []
        setList(filterArr)
    }

    const onConfirm = async() => {
        setLoading(true)
        console.log(selectWallet)
        try{

            const cfg = getEnv() === 'Testnet' ? testConfig : mainConfig;
            const rgbppLeapHelper = new LeapHelper(
                false,
                cfg.BTC_ASSETS_API_URL,
                cfg.BTC_ASSETS_TOKEN,
                cfg.BTC_ASSETS_ORGIN
            );
            const { unsignedPsbt, ckbVirtualTxResult } =
                await rgbppLeapHelper.splitRgbppUtxoCreateUnsignedPsbt({
                    btcAddress: selectWallet!.address as string,
                    btcPubKey: selectWallet!.pubKey,
                    txHash: selectSplit!.txHash,
                    idx: selectSplit!.index,
                });

            console.log("unsignedPsbt, ckbVirtualTxResult",unsignedPsbt, ckbVirtualTxResult)

            const psbtHex = await BtcHepler.instance.signPsdt(
                unsignedPsbt.toHex(),
                selectWallet?.walletName! as WalletType
            );
            console.log("psbtHex",bitcoin.Psbt.fromHex(psbtHex))

            const btcTxId = await rgbppLeapHelper.sendPsbt({
                ckbVirtualTxResult,
                psbt: bitcoin.Psbt.fromHex(psbtHex),
            });

            console.log("btcTxId",btcTxId)

        }catch(error){
            console.error(error)
        }finally {
            setLoading(false)
        }


    };
    //@ts-ignore
    const handleSelect = (w) =>{
        setSelectWallet(w)
        dispatch(setCurrentWalletAddress(w.address))
    }

    const handleSelectSplit = (asset:any,Itemindex) =>{
        const str = asset[0]?.cellOutput?.lock?.args.substring(2);

        const index = str.substring(0, 8);
        const txHash = str.substring(8);

        const indexBefore = BI.from((append0x(index)));
        const indexFomat = Uint32LE.pack(indexBefore.toString());
        const indexFinished = Uint32BE.unpack(indexFomat);

        const txHashFomat = Uint256LE.pack(append0x(txHash));
        const txHashFinished = bytes.hexify(txHashFomat)
        setCurrentIndex(Itemindex)

        console.log({
            txHash: txHashFinished,
            index:indexFinished
        })
        setSelectSplit({
            txHash: txHashFinished,
            index:indexFinished
        })
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
                    wallets={filterwallet}
                    onChangeSelect={(w) => handleSelect(w)}
                />
            </div>

            <div className="relative w-full cursor-pointer rounded-md text-left text-gray-900 shadow-sm outline-none focus:ring-2 focus:ring-primary-default sm:text-sm sm:leading-6 bg-gray-100 h-80 overflow-auto">
                {
                    !!list.length && list.map((item:any,index:number) => (    <SplitItem key={item[0]?.cellOutput?.lock?.args} item={item} handleSelectSplit={handleSelectSplit} Itemindex={index} currentIndex={currentIndex} />))
                }
                {
                    !list.length && <div className="w-full text-center mt-10">no data</div>
                }

            </div>


            <button
                className="w-full bg-primary011 text-primary001 rounded-lg py-2 font-Montserrat text-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={onConfirm} disabled={selectSplit == null}
            >Split
            </button>

        </>
    );
}


