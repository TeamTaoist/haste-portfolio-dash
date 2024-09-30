import {BrowserRouter as Router} from "react-router-dom";
import RouterLink from "./router/router.tsx";

import ReduxProvider from "./context/Provider";
import { commons, config } from "@ckb-lumos/lumos";
import { createJoyIDScriptInfo } from "./query/ckb/joyid";
import { setSporeConfig } from "@spore-sdk/core";
import { sporeConfig } from "./utils/config";

import DeviceDetector from "./components/common/DeviceDetector";
import Menu from "./components/Menu";
import "./assets/css/layout.css"
import "./assets/css/loading.css"
import "./assets/css/globals.css"
import styled from "styled-components";
import Version from "./version";

import { DBConfig } from "./utils/DBconfig";
import { initDB } from "react-indexed-db-hook";

initDB(DBConfig);
import * as Sentry from "@sentry/react";

if(import.meta.env.VITE_CHAIN === "livenet" ){
    Sentry.init({
        dsn: "https://fe5204c4bc39123bdac5b0f2f933234b@o4507175892353024.ingest.us.sentry.io/4508040351907840",
        integrations: [
            Sentry.replayIntegration(),
        ],
        // Session Replay
        replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
        replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
    });
}

const BottomBox = styled.div`
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100vw;
    background: #fff;
    font-size: 10px;
    padding: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(17, 24, 39,0.5);
    border-top: 1px solid #f2f2f2;
    gap: 10px;
`


function App() {

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
    console.log('0.0.3');

//@ts-ignore
    config.initializeConfig(forkConfig)
    setSporeConfig(sporeConfig);
    commons.common.registerCustomLockScriptInfos([createJoyIDScriptInfo()])

  return (
      <Router>
      <ReduxProvider>
          <DeviceDetector/>
          <div className="flex h-full" >
              <Menu/>
              {/*{children}*/}
              <RouterLink/>
          </div>

          <BottomBox><span>Copyright &copy; haste.pro</span> <Version /></BottomBox>
      </ReduxProvider>
      </Router>
  )
}

export default App
