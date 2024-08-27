import styled from "styled-components";
import {useEffect, useState} from "react";
import {getEnv} from "../../settings/env.ts";
import { scriptToAddress } from "@nervosnetwork/ckb-sdk-utils";
import {getCells} from "../../query/ckb/tools.ts";
import {formatString} from "../../utils/common.ts";
import UdtImg from "../../assets/img/udt.png";
import SporeImg from "../../assets/img/spore.svg";

import BigNumber from "bignumber.js";
import LoadingBtn from "../../context/loadingBtn.tsx";
import {WalletItem} from "../../store/wallet/walletSlice.ts";

const DlBox = styled.dl`
    background: #fff;
    margin: 10px;
    border-radius: 5px;
    padding-bottom:4px;
    border: 1px solid #fff;
    dt{
        padding: 10px 10px 0 16px;
    }
    dd{
        background:#f5f5f5;
        margin: 10px;
        border-radius: 4px;
        padding: 10px;
    }
    .rht{
        opacity: 0.5;
        font-size: 14px;
    }
    &.active,&:hover{
        border: 1px solid rgb(242, 136, 46);
    }
    
`

const FlexLine = styled.div`
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    border-bottom: 1px solid #dedede;
    padding-bottom: 10px;
    &:last-child{
        margin-bottom: 0;
        border-bottom: 0 ;
        padding-bottom: 0;
    }
    img{
        width: 30px;
        background: #fff;
        border-radius: 100%;
    }
    .lft{
        display: flex;
        align-items: center;
        gap: 10px;
    }
`

export default function SplitItem({item,handleSelectSplit,Itemindex,currentIndex}){

    const [loading,setLoading] = useState(false);
    const [assetList, setAssetList] = useState<any>([]);
    const [selectItem,setSelectItem] = useState();



    useEffect(() => {
        getDetail()
    }, [item]);

    const getDetail = async()=>{
        setLoading(true)
        try{
            let lock = item[0].cellOutput.lock;
            const lockAddress = scriptToAddress(lock, getEnv() === 'Mainnet');
            let result = await getCells(lockAddress);
            setAssetList(result?.data[0]?.attributes?.udt_accounts ?? [])
        }catch(e){
            console.error(e)
        }finally {
            setLoading(false)
        }

    }

    const formatNum = (asset:any) =>{
        const {amount,decimal} = asset;

        const amt = new BigNumber(amount)
        const dec = new BigNumber(10).pow(decimal)

        const amtFloat = amt.div(dec)
        return amtFloat.toString()

    }

    return  <DlBox onClick={()=>{handleSelectSplit(item,Itemindex)}} className={currentIndex==Itemindex?"active":""}>

        <dt>Args: {item[0]?.cellOutput?.lock?.args ? formatString(item[0]?.cellOutput?.lock?.args, 5) :""}</dt>
        <dd>
            {
                loading && <LoadingBtn />
            }
            {
                assetList.map((asset: any,index:number) => <FlexLine key={index}>
                    <div className="lft">
                        {
                            asset.udt_type === "xudt" && <img src={UdtImg} alt=""/>
                        }
                        {
                            asset.udt_type !== "xudt" && <img src={SporeImg} alt=""/>
                        }

                        <div>{asset.symbol}</div>
                    </div>

                    {
                        asset.udt_type === "xudt" && <div className="rht">{formatNum(asset)}</div>
                    }
                    {
                        asset.udt_type !== "xudt" && <div className="rht">{formatString(asset?.udt_type_script?.args, 5)}</div>
                    }

                </FlexLine>)
            }

        </dd>
    </DlBox>
}
