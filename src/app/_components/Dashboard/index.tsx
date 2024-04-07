"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import UDTList from "./udt";
import SporeList from "./spore";

const TAB_LIST = [
  {
    value: "udt",
    label: "UDT",
    component: <UDTList />,
  },
  {
    value: "spore",
    label: "SPORE",
    component: <SporeList />,
  },
];

export default function Dashboard() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const [currentTab, setCurrentTab] = useState<string>();

  useEffect(() => {
    setCurrentTab(
      tab && TAB_LIST.find((t) => t.value === tab) ? tab : TAB_LIST[0].value
    );
  }, [tab]);
  return (
    <div className="p-4 flex-1">
      <div className="flex -mx-4 top-0 overflow-hidden sm:space-x-0 sm:px-4 bg-inherit  border-none z-1 static text-white001">
        {TAB_LIST.map((tab) => (
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
      <div>{TAB_LIST.find((t) => t.value === currentTab)?.component}</div>
    </div>
  );
}
