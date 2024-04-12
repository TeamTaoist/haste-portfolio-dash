"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import UDTList from "./udt";
import SporeList from "./spore";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { TabsType } from "@/types/tabs";

const TAB_LIST: TabsType[] = [
  {
    value: "udt",
    label: "UDT",
    component: <UDTList />,
  }
];


export default function Dashboard() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const [currentTab, setCurrentTab] = useState<string>();
  const [tabs, setTabs] = useState<TabsType[]>(TAB_LIST)
  const currentAddress = useSelector((state: RootState) => state.wallet.currentWalletAddress);
  const wallets = useSelector((state: RootState) => state.wallet.wallets);
  
  useEffect(() => {
    const currentWallet = wallets.find(wallet => wallet.address === currentAddress);
    if(currentWallet?.chain === 'ckb') {
      setTabs([...TAB_LIST,  {
        value: "spore",
        label: "SPORE",
        component: <SporeList />,
      }]);
    } else if (currentWallet?.chain === 'btc') {
      setTabs(TAB_LIST);
    }
  }, [currentAddress, wallets])

  useEffect(() => {
    setCurrentTab(
      tabs && (tab && tabs.find((t) => t.value === tab) ? tab : tabs[0].value)
    );
  }, [tab, tabs]);
  return (
    <div className="flex-1 h-full min-h-0 overflow-auto p-4">
      <div className="flex sm:space-x-0 bg-inherit border-none z-1 static text-white001">
        {tabs && tabs.map((tab) => (
          <Link
            key={tab.value}
            href={`/?tab=${tab.value}`}
            className={`${
              currentTab === tab.value
                ? "border-primary-default"
                : "border-transparent"
            } p-2 mx-2 font-medium border-b-2 text-default focus:outline-none focus:ring-0 w-full py-0 pb-2 sm:w-[116px] px-0 sm:mx-0 cursor-pointer text-center`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <div className="mt-4">
        {tabs && tabs.find((t) => t.value === currentTab)?.component}
      </div>
    </div>
  );
}
