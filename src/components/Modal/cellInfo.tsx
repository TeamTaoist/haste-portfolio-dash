import styled from "styled-components";
import {useEffect, useState} from "react";
import Lock from "./lock";
import Type from "./type.tsx";
import Data from "./data.tsx";
import Usage from "./usage.tsx";
import {XIcon} from "lucide-react";


const MaskBox = styled.div`
    width: 100%;
    height: 100%;
    position:fixed;
    background: rgba(0,0,0,0.5);
    left: 0;
    top: 0;
    z-index: 9;
    display: flex;
    align-items: center;
    justify-content: center;
`

const BgBox = styled.div`
    background: #fff;
    padding: 30px;
    border-radius: 10px;
    min-width: 950px;
    .iconClose{
        cursor: pointer;
    }
`

export default function CellInfo({xUdt,handleClose}:any){
    const [currentTab, setCurrentTab] = useState<string>("lock");

    const [tabs] = useState([
        {
            value: "lock",
            label: "Lock Script",
        },
        {
            value: "type",
            label: "Type Script",
        },
        {
            value: "data",
            label: "Data",
        },
        {
            value: "usage",
            label: "Capacity Usage",
        }
    ])

    return <MaskBox>
        <BgBox>
            <div className="flex w-full justify-between align-top">
                <div className="flex sm:space-x-0 bg-inherit border-none z-1 static text-black gap-4">
                    {tabs && tabs.map((tab) => (
                        <div
                            key={tab.value}
                            onClick={() => {
                                setCurrentTab(tab.value)
                            }}
                            className={`${
                                currentTab === tab.value
                                    ? "activeTab font-Montserrat text-primary011"
                                    : "border-transparent"
                            } p-2 mx-2 font-medium relative text-default focus:outline-none focus:ring-0 w-auto py-0 pb-2 sm:w-[116px] px-0 sm:mx-0 cursor-pointer text-left`}
                        >
                            {tab.label}
                        </div>
                    ))}


                </div>
                <XIcon className="iconClose"  onClick={handleClose}/>
            </div>

            <div className="mt-4">
                {
                    currentTab === 'lock' && <Lock/>
                }
                {
                    currentTab === 'type' && <Type typeScript={xUdt.type_script}/>
                }
                {
                    currentTab === 'data' && <Data xUdt={xUdt}/>
                }
                {
                    currentTab === 'usage' && <Usage xUdt={xUdt} />
                }
            </div>
        </BgBox>
    </MaskBox>
}
