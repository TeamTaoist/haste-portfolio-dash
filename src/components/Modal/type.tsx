import styled from "styled-components";
import {useState} from "react";

const Box = styled.div`
    line-height: 2em;
`
export default function Type({typeScript}:any){

    const [jsonStr] = useState(typeScript)
    return <Box><div className="bg-gray-100 p-4 h-56 scroll-auto text-gray-500">
        <pre>
            {
                JSON.stringify(jsonStr,null,4)
            }
        </pre>
    </div>
    </Box>
}
