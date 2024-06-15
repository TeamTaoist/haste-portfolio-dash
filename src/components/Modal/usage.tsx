import styled from "styled-components";
import {useState} from "react";

const Box = styled.div`
    line-height: 2em;
`
export default function usage(){

    const [jsonStr] = useState({
        "code_hash":"0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        "hash_type":"type",
        "args": "0x20fa7347e90a1ff59d571b818ef0827eaf32cd35"})
    return <Box><div className="bg-gray-100 p-4 h-56 scroll-auto text-gray-500">
        <pre>
            {
                JSON.stringify(jsonStr,null,4)
            }
        </pre>
    </div>
    </Box>
}
