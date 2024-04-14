"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import SendContent from "../_components/Send/send";
import ReceiveContent from "../_components/Send/receive";

enum TABVALUE {
  SEND = "send",
  RECEIVE = "receive",
}

export default function Send() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") as TABVALUE;
  const [currentTab, setCurrentTab] = useState<TABVALUE>();

  useEffect(() => {
    setCurrentTab(
      [TABVALUE.SEND, TABVALUE.RECEIVE].includes(tab) ? tab : TABVALUE.SEND
    );
  }, [tab]);

  return (
    <main className="flex flex-col flex-1 min-h-screen bg-gray-100 text-black">
      <div className="pb-10 md:mx-4 my-4 lg:mx-8 lg:my-0 h-full">
        <div className=" text-hd1mb w-full py-4 px-4 font-Montserrat my-4">
          Send & Receive
        </div>
        <div className="flex items-center justify-center w-full flex-1">
          <div className="rounded-2xl bg-white p-4rounded-2xl py-5 px-4 sm:px-6 h-auto w-[420px] py-8">
            <div className="flex -mx-4 top-0 overflow-hidden sm:space-x-0 sm:px-4 bg-inherit  border-none z-1 static">
              <Link
                href="/send?tab=send"
                className={`${
                  currentTab === "receive"
                    ? "border-transparent"
                    : "border-primary-default"
                } p-2 mx-2 font-medium border-b-2 text-default focus:outline-none focus:ring-0 w-full py-0 pb-2 sm:w-[116px] px-0 sm:mx-0 cursor-pointer text-center`}
              >
                Send
              </Link>
              <Link
                href="/send?tab=receive"
                className={`${
                  currentTab === "receive"
                    ? "border-primary-default"
                    : "border-transparent"
                } p-2 mx-2 font-medium border-b-2 text-default focus:outline-none focus:ring-0 w-full py-0 pb-2 sm:w-[116px] px-0 sm:mx-0 cursor-pointer text-center`}
              >
                Receive
              </Link>
            </div>
            <div className="flex flex-col gap-6 w-full pt-6 pb-2">
              {tab === TABVALUE.RECEIVE ? <ReceiveContent /> : <SendContent />}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
