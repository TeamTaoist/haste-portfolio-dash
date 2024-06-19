import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import UDTList from "./udt";
import SporeList from "./spore";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { TabsType } from "../../types/tabs";
import ClusterList from "./cluster.tsx";

const TAB_LIST: TabsType[] = [
  {
    value: "udt",
    label: "UDT",
    component: <UDTList />,
  }
];


export default function Dashboard() {
  const [searchParams] = useSearchParams();
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
        label: "DOB",
        component: <SporeList />,
      },{
        value: "cluster",
        label: "CLUSTER",
        component: <ClusterList />,
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
      <div className="mt-4">
        {
          currentTab === 'udt' && <UDTList />
        }
        {
          currentTab === 'spore' && <SporeList />
        }
        {
          currentTab === 'cluster' && <ClusterList />
        }
      </div>
    </div>
  );
}
