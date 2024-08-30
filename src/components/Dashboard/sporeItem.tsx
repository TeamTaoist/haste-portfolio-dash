import {decodeDOB} from "@taoist-labs/dob-decoder";
import {useEffect, useState} from "react";
import {getEnv} from "../../settings/env.ts";
import DefaultImg from "../../assets/img/spore.svg";

export default function SporeItem({tokenKey,data}:any){
    const [spore,setSpore] = useState<any>(null);

    useEffect(() => {
        if(!tokenKey)return;
        getInfo()
    }, [tokenKey,data]);

    const getInfo = async() =>{
        const asset = await decodeDOB(tokenKey,getEnv() === "Testnet",data,"spore");
        setSpore(asset as any);

    }


    return <div className="flex shrink-0 aspect-square rounded-t-md overflow-hidden items-center bg-gray-200 ">
        {
            // eslint-disable-next-line @next/next/no-img-element
            spore?.contentType?.indexOf("image") > -1 && <img src={spore.data ? spore?.data : DefaultImg} alt="" className="w-full object-cover block"/>
        }

        {
            spore?.contentType?.indexOf("json") > -1 && <img src={spore?.data?.url ?spore?.data?.url: DefaultImg } alt="" className="w-full object-cover block"/>
        }
        {
            spore?.contentType?.indexOf("dob/0") > -1 && <img src={spore?.data?.imgUrl} alt=""/>
        }

        {
            !spore && <img src={DefaultImg} alt="" className="w-full object-cover block" />
        }

        {/*{*/}
        {/*    (!spore?.type?.startsWith('image') && !spore?.url) && <p className="p-3">{spore?.textContent}</p>*/}
        {/*}*/}
    </div>
}
