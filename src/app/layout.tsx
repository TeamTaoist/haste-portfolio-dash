"use client"

import DeviceDetector from "./_components/common/DeviceDetector";
import Menu from "@/app/_components/Menu";
import "./globals.css";
import ReduxProvider from "@/context/Provider";
import { commons, config } from "@ckb-lumos/lumos";
import { getEnv } from "@/settings/env";
import { createJoyIDScriptInfo } from "@/query/ckb/joyid";
import { setSporeConfig } from "@spore-sdk/core";
import { sporeConfig } from "@/utils/config";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const forkConfig = {
    ...config.TESTNET,
    SCRIPTS: {
        ...config.TESTNET.SCRIPTS,
        OMNILOCK: {
            ...config.TESTNET.SCRIPTS.OMNILOCK, // Spread existing properties
            CODE_HASH: "0xa7a8a4f8eadb4d9736d32cdbe54259d1ee8e23785e7c28d15a971a0dbdc14ca6", // Override CODE_HASH
            HASH_TYPE: "type", // Set HASH_TYPE
            TX_HASH: "0x65de639c5f4822cef9be430c4884c2b7689147a6b0098f3aa4028d0f7f9689d1", // Set TX_HASH
            INDEX: "0x0", // Set INDEX
            DEP_TYPE: "code" // Set DEP_TYPE
        }
    }
};
console.log('0.0.2');

//@ts-ignore
config.initializeConfig(forkConfig)
setSporeConfig(sporeConfig);
commons.common.registerCustomLockScriptInfos([createJoyIDScriptInfo()])
  return (
    <html lang="en">
      <body>
        <ReduxProvider>
          <DeviceDetector />
            <div className="flex h-full">
              <Menu />
              {children}
            </div>
        </ReduxProvider>
      </body>
    </html>
  );
}
