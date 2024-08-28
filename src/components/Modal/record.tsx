import {formatString} from "../../utils/common.ts";
import {RefreshCcw,X} from "lucide-react";
import styled from "styled-components";
import {getEnv} from "../../settings/env.ts";
import {mainConfig, testConfig} from "../../lib/wallet/constants.ts";
import {BtcAssetsApi} from "@rgbpp-sdk/service";
import { useIndexedDB } from "react-indexed-db-hook";
import {useEffect, useState} from "react";
import LoadingBtn from "../../context/loadingBtn.tsx";

const BgBox = styled.div`
    background: #fff;
    width: 50vw;
    padding: 30px;
    box-sizing: border-box;
    border-radius: 10px;
    box-shadow: -5px 5px 10px rgba(0, 0, 0, 0.15);
    .title{
        padding-bottom: 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        svg{
            cursor: pointer;
        }
    }
    .inner{
        height: 50vh;
        overflow-y: auto;
        scrollbar-width: none; /* firefox */
        -ms-overflow-style: none; /* IE 10+ */
        &::-webkit-scrollbar {
            display: none; /* Chrome Safari */
        }
    }
    .rht{
        display: flex;
        align-items: center;
        gap: 10px;
        svg{
            cursor: pointer;
        }
    }
    
    .tag{
        text-transform: capitalize;
        &.delayed{
            color:rgb(242, 136, 46);
        }
        &.failed{
            color: rgb(220, 38, 38);
        }
        &.completed{
            color: rgb(22, 163, 74);
        }
    }

    @media (max-width: 1274px) {
        width: 90vw;
    }

`

const Box = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
    .line{
        font-size: 14px;
    }

    .time{
        font-size: 12px;
        opacity: 0.5;
    }
`

const LoadingBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
    /* HTML: <div class="loader"></div> */
    .loaderB {
        width: 20px;
        aspect-ratio: 1;
        border-radius: 50%;
        background:
                radial-gradient(farthest-side,#ffa516 94%,#0000) top/4px 4px no-repeat,
                conic-gradient(#0000 30%,#ffa516);
        -webkit-mask: radial-gradient(farthest-side,#0000 calc(100% - 4px),#000 0);
        animation: l13 1s infinite linear;
    }
    @keyframes l13{
        100%{transform: rotate(1turn)}
    }
`
export default function Record({handleClose}){

    const { getAll,deleteRecord,update,getByID } = useIndexedDB("records");
    const [list,setList] = useState<any[]>([]);
    const [loading,setLoading] = useState(false);
    const[current,setCurrent]=useState<string>('')

    useEffect(() => {
        getAllList()
    }, []);

    const getAllList = async() =>{
        let res = await getAll();
        setList(res??[])

    }



    const handleRefresh = async(item:any) =>{
        setLoading(true)
        setCurrent(item.txHash)
        try{
            const cfg = getEnv() === 'Testnet' ? testConfig : mainConfig;
            const service = BtcAssetsApi.fromToken(
                cfg.BTC_ASSETS_API_URL,
                cfg.BTC_ASSETS_TOKEN,
                cfg.BTC_ASSETS_ORGIN
            );

            const result = await service.getRgbppTransactionState(item.txHash)

            let recordObj={
                ...item,
                status:result.state,
            }
            await update(recordObj)
            await getAllList()


        }catch(e){

        }finally {
            setLoading(false)
        }

    }

    const formatDate = (str:string) =>{
        return new Date(str).toLocaleString()
    }

    const handleDelete = async(id:number) =>{
        await deleteRecord(id);
        await getAllList()
    }

    return <div className="mask">
        <BgBox>

            <div className="title">
                <span>Record</span>
                <X onClick={()=>handleClose()}/>
            </div>
            <div className="inner">
                {
                    list.map((item: any, index: number) => (<Box key={index}>
                        <div className="lft">
                            <div
                                className="line">{formatString(item.txHash, 5)}</div>
                            <div className="time">{formatDate(item.timestamp)}</div>
                        </div>

                        <div className="rht">
                            <div className={`tag ${item.status}`}>{item.status}</div>
                            {
                                loading && current === item.txHash &&    <LoadingBox>
                                    <div className="loaderB"></div>
                                </LoadingBox>
                            }

                            {
                                item.status === "delayed" &&        <RefreshCcw size={16}  onClick={() => handleRefresh(item)}/>

                            }
                            {
                                item.status !== "delayed" &&    <X size={16} onClick={()=>handleDelete(item.id)}/>
                            }

                        </div>
                    </Box>))
                }

            </div>


        </BgBox>
    </div>
}
