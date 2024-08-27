"use client";

import React, { useState } from "react";
import SendContent from "../components/SendComponent/send";
import ReceiveContent from "../components/SendComponent/receive";
import SplitContent from "../components/SendComponent/split.tsx";


const Send: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'send' | 'receive' | 'split'>('send');

  return (
    <main className="flex flex-col flex-1 min-h-screen bg-gray-100 text-black h-full">
      <div className="pb-10 md:mx-4 my-4 lg:mx-8 lg:my-0 h-full flex flex-col">
        <div className=" text-hd1mb w-full py-4 px-4 font-Montserrat my-4 pt-2">
          Send & Receive
        </div>
        <div className="flex items-center justify-center w-full flex-1 flex-grow">
          <div className="rounded-2xl bg-white p-4  px-4 sm:px-6 h-auto w-[520px] sm:w-full py-8  sm:rounded-none">
            <div className="flex -mx-4 top-0 overflow-hidden sm:space-x-0 sm:px-7 bg-inherit  border-none z-1 static px-4">
              <div
                onClick={() => {
                  setCurrentTab('send')
                }}
                className={`${
                  currentTab === "send"
                    ? "activeTab text-primary011 font-Montserrat"
                    : ""
                } p-2 mx-2 font-medium relative text-default focus:outline-none focus:ring-0 py-0 pb-2  w-auto sm:w-[116px] px-0 sm:mx-0 cursor-pointer text-left`}
              >
                Send
              </div>
              <div
                onClick={() => {
                  setCurrentTab('receive')
                }}
                className={`${
                  currentTab === "receive"
                    ? "activeTab text-primary011 font-Montserrat"
                    : ""
                } p-2 mx-2 font-medium relative text-default focus:outline-none focus:ring-0 w-auto py-0 pb-2 sm:w-[116px] px-0 sm:mx-0 cursor-pointer text-left`}
              >
                Receive
              </div>
              <div    onClick={() => {
                setCurrentTab('split')
              }}
                      className={`${
                  currentTab === "split"
                      ? "activeTab text-primary011 font-Montserrat"
                      : ""
              } p-2 mx-2 font-medium relative text-default focus:outline-none focus:ring-0 w-auto py-0 pb-2 sm:w-[116px] px-0 sm:mx-0 cursor-pointer text-left`}>
                Split
              </div>
            </div>
            <div className="flex flex-col gap-6 w-full pt-6 pb-2 px-2">
              {currentTab === 'send' && <SendContent />}
              {currentTab === 'receive' && <ReceiveContent /> }
              {currentTab === 'split' && <SplitContent /> }
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Send
