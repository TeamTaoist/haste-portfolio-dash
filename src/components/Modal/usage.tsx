import styled from "styled-components";
import {useEffect, useState} from "react";
import {helpers} from "@ckb-lumos/lumos";
import {formatUnit} from "@ckb-lumos/bi";

const Box = styled.div`
    line-height: 2em;
`
export default function usage({xUdt,type}:any){
    const [jsonStr,setJsonStr] = useState<any>(null)


    useEffect(() => {
        if(!xUdt)return;

        if(type === "ckb"){
            const minCapacity = helpers.minimalCellCapacityCompatible(xUdt?.allObj);

            const declared = xUdt?.allObj?.cellOutput?.capacity || xUdt.output.capacity;

            setJsonStr({
                declared:`${formatUnit(declared,"ckb")} CKBytes`,
                occupied:`${formatUnit(minCapacity.toString(),"ckb")} CKBytes`,
            })

        }else{
            const minCapacity = helpers.minimalCellCapacityCompatible(xUdt);
            const declared = xUdt?.cellOutput?.capacity;
            setJsonStr({
                declared:`${formatUnit(declared,"ckb")} CKBytes`,
                occupied:`${formatUnit(minCapacity.toString(),"ckb")} CKBytes`,
            })
        }



    }, [xUdt,type]);


    return <Box><div className="bg-gray-100 p-4 h-56 scroll-auto text-gray-500">
        <pre>
            {
                JSON.stringify(jsonStr,null,4)
            }
        </pre>
    </div>
    </Box>
}
