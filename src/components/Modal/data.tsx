import styled from "styled-components";
import {useEffect, useState} from "react";

const Box = styled.div`
    line-height: 2em;
    pre{
        word-break: break-all;
        white-space: pre-wrap;
        width:950px;
        height: 200px;
        overflow: auto;
    }
`
export default function Data({xUdt}:any){

    useEffect(() => {
        if(!xUdt)return;
        setJsonStr({data:xUdt.data || xUdt.output_data})
    }, [xUdt]);

    const [jsonStr,setJsonStr] = useState<any>(null)
    return <Box><div className="bg-gray-100 p-4 h-56 scroll-auto text-gray-500">
        <pre>
            {
                JSON.stringify(jsonStr,null,4)
            }
        </pre>
    </div>
    </Box>
}
