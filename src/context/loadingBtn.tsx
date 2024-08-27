import styled from "styled-components";

const Box = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
    /* HTML: <div class="loader"></div> */
    .loaderB {
        width: 30px;
        aspect-ratio: 1;
        border-radius: 50%;
        background:
                radial-gradient(farthest-side,#ffa516 94%,#0000) top/8px 8px no-repeat,
                conic-gradient(#0000 30%,#ffa516);
        -webkit-mask: radial-gradient(farthest-side,#0000 calc(100% - 8px),#000 0);
        animation: l13 1s infinite linear;
    }
    @keyframes l13{
        100%{transform: rotate(1turn)}
    }
`
export default function LoadingBtn(){
    return <Box>
        <div className="loaderB"></div>
    </Box>
}
