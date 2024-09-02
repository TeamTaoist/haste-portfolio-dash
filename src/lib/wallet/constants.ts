import { CellDep, Script, config } from "@ckb-lumos/lumos";
import { NetworkType } from "@rgbpp-sdk/btc";
import {getEnv} from "../../settings/env.ts";
import {predefinedSporeConfigs} from "@spore-sdk/core";

export const CONFIG = getEnv() === 'Mainnet' ? config.MAINNET : config.TESTNET;

export const testConfig = {
  isMainnet: false,
  CONFIG: config.predefined.AGGRON4,
  CKB_RPC_URL: "https://testnet.ckb.dev",
  CKB_INDEX_URL: "https://testnet.ckb.dev",
  DOB_AGGREGATOR_URL:"https://cota.nervina.dev/aggregator",
  BTC_ASSETS_API_URL: "https://btc-assets-api.testnet.mibao.pro",

  BTC_ASSETS_TOKEN:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzb3VsLXRlc3QtYXBwIiwiYXVkIjoibG9jYWxob3N0IiwiaWF0IjoxNzExNTM0OTMxfQ.NAhr_3Aro90wLwKOYvnjMme_YslZspRmf5GzBvxw3FU",
  BTC_ASSETS_ORGIN: "localhost",

  ckb_explorer_api: "testnet-api.explorer.nervos.org",
  rgb_networkType: NetworkType.TESTNET,

  joyIdUrl: "https://testnet.joyid.dev",
};

// main config
export const mainConfig = {
  isMainnet: true,
  CONFIG: config.predefined.LINA,
  CKB_RPC_URL: "https://mainnet.ckbapp.dev",
  CKB_INDEX_URL: "https://mainnet.ckbapp.dev/indexer",
  DOB_AGGREGATOR_URL:"https://cota.nervina.dev/mainnet-aggregator",
  BTC_ASSETS_API_URL: "https://api.rgbpp.io",
  BTC_ASSETS_TOKEN:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJIYXN0ZSBQcm8iLCJhdWQiOiJoYXN0ZS5wcm8iLCJqdGkiOiIyYzlkYmM0OS0yMDA1LTQ4YmUtOGI2ZS01YTk0MTBjODY0ZmYiLCJpYXQiOjE3MTQwMzAzMzN9.rHPfzI8Kzns2YgKU6GO7v6dRVuEh9iZkpzvntofcxIE",
  BTC_ASSETS_ORGIN: "haste.pro",
  ckb_explorer_api: "mainnet-api.explorer.nervos.org",
  rgb_networkType: NetworkType.MAINNET,

  joyIdUrl: "https://app.joy.id/",
};

export const backend: string = "https://blockchain-serverless.vercel.app";

export const FIXED_SIZE = 66;

export const CKB_TEST_PRIVATE_KEY =
  "0x0000000000000000000000000000000000000000000000000000000000000001";

const TestnetInfo = {
  JoyIDLockScript: {
    codeHash:
      "0xd23761b364210735c19c60561d213fb3beae2fd6172743719eff6920e020baac",
    hashType: "type",
    args: "",
  } as Script,

  JoyIDLockDep: {
    outPoint: {
      txHash:
        "0x4dcf3f3b09efac8995d6cbee87c5345e812d310094651e0c3d9a730f32dc9263",
      index: "0x0",
    },
    depType: "depGroup",
  } as CellDep,

  CotaTypeScript: {
    codeHash:
      "0x89cd8003a0eaf8e65e0c31525b7d1d5c1becefd2ea75bb4cff87810ae37764d8",
    hashType: "type",
    args: "0x",
  } as Script,

  CotaTypeDep: {
    outPoint: {
      txHash:
        "0x636a786001f87cb615acfcf408be0f9a1f077001f0bbc75ca54eadfe7e221713",
      index: "0x0",
    },
    depType: "depGroup",
  } as CellDep,

  DexLockScript: {
    codeHash:
      "0x493510d54e815611a643af97b5ac93bfbb45ddc2aae0f2dceffaf3408b4fcfcd",
    hashType: "type",
    args: "",
  } as Script,

  DexLockDep: {
    outPoint: {
      txHash:
        "0xc17040a3723df8f27c344d5e86e254f1d27e1181a5484cb3722416ef09d246ec",
      index: "0x0",
    },
    depType: "code",
  } as CellDep,

  XUDTTypeScript: {
    codeHash:
      "0x25c29dc317811a6f6f3985a7a9ebc4838bd388d19d0feeecf0bcd60f6c0975bb",
    hashType: "type",
    args: "",
  } as Script,

  XUDTTypeDep: {
    outPoint: {
      txHash:
        "0xbf6fb538763efec2a70a6a3dcb7242787087e1030c4e7d86585bc63a9d337f5f",
      index: "0x0",
    },
    depType: "code",
  } as CellDep,

  SUDTTypeScript: {
    codeHash:
      "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
    hashType: "type",
    args: "",
  } as Script,

  SUDTTypeDep: {
    outPoint: {
      txHash:
        "0xe12877ebd2c3c364dc46c5c992bcfaf4fee33fa13eebdf82c591fc9825aab769",
      index: "0x0",
    },
    depType: "code",
  } as CellDep,

  SporeTypeScript: {
    codeHash:
      "0x5e063b4c0e7abeaa6a428df3b693521a3050934cf3b0ae97a800d1bc31449398",
    hashType: "data1",
    args: "",
  } as Script,

  SporeTypeDep: {
    outPoint: {
      txHash:
        "0x06995b9fc19461a2bf9933e57b69af47a20bf0a5bc6c0ffcb85567a2c733f0a1",
      index: "0x0",
    },
    depType: "code",
  } as CellDep,

  MNftTypeScript: {
    codeHash:
      "0xb1837b5ad01a88558731953062d1f5cb547adf89ece01e8934a9f0aeed2d959f",
    hashType: "type",
    args: "",
  } as Script,

  MNftTypeDep: {
    outPoint: {
      txHash:
        "0xf11ccb6079c1a4b3d86abe2c574c5db8d2fd3505fdc1d5970b69b31864a4bd1c",
      index: "0x2",
    },
    depType: "code",
  } as CellDep,

  UniqueCellTypeScript: {
    codeHash:
      "0x8e341bcfec6393dcd41e635733ff2dca00a6af546949f70c57a706c0f344df8b",
    hashType: "type",
    args: "",
  } as Script,

  UniqueCellTypeDep: {
    outPoint: {
      txHash:
        "0xff91b063c78ed06f10a1ed436122bd7d671f9a72ef5f5fa28d05252c17cf4cef",
      index: "0x0",
    },
    depType: "code",
  } as CellDep,

  InscriptionInfoTypeScript: {
    codeHash:
      "0x50fdea2d0030a8d0b3d69f883b471cab2a29cae6f01923f19cecac0f27fdaaa6",
    hashType: "type",
    args: "",
  } as CKBComponents.Script,

  InscriptionInfoDep: {
    outPoint: {
      txHash:
        "0x7bf3899cf41879ed0319bf5312c9db5bf5620fff9ebe59556c261c48f0369054",
      index: "0x0",
    },
    depType: "code",
  } as CKBComponents.CellDep,
};

const MainnetInfo = {
  JoyIDLockScript: {
    codeHash:
      "0xd00c84f0ec8fd441c38bc3f87a371f547190f2fcff88e642bc5bf54b9e318323",
    hashType: "type",
    args: "",
  } as Script,

  JoyIDLockDep: {
    outPoint: {
      txHash:
        "0xf05188e5f3a6767fc4687faf45ba5f1a6e25d3ada6129dae8722cb282f262493",
      index: "0x0",
    },
    depType: "depGroup",
  } as CellDep,

  CotaTypeScript: {
    codeHash:
      "0x1122a4fb54697cf2e6e3a96c9d80fd398a936559b90954c6e88eb7ba0cf652df",
    hashType: "type",
    args: "0x",
  } as Script,

  CotaTypeDep: {
    outPoint: {
      txHash:
        "0xabaa25237554f0d6c586dc010e7e85e6870bcfd9fb8773257ecacfbe1fd738a0",
      index: "0x0",
    },
    depType: "depGroup",
  } as CellDep,

  DexLockScript: {
    codeHash:
      "0xab0ede4350a201bd615892044ea9edf12180189572e49a7ff3f78cce179ae09f",
    hashType: "type",
    args: "",
  } as Script,

  DexLockDep: {
    outPoint: {
      txHash:
        "0xaab4fef7338c7108d4d2507c29122768126f9303f173db9f6ef59b9af84186b7",
      index: "0x0",
    },
    depType: "code",
  } as CellDep,

  XUDTTypeScript: {
    codeHash:
      "0x50bd8d6680b8b9cf98b73f3c08faf8b2a21914311954118ad6609be6e78a1b95",
    hashType: "data1",
    args: "",
  } as Script,

  XUDTTypeDep: {
    outPoint: {
      txHash:
        "0xc07844ce21b38e4b071dd0e1ee3b0e27afd8d7532491327f39b786343f558ab7",
      index: "0x0",
    },
    depType: "code",
  } as CellDep,

  SUDTTypeScript: {
    codeHash:
      "0x5e7a36a77e68eecc013dfa2fe6a23f3b6c344b04005808694ae6dd45eea4cfd5",
    hashType: "type",
    args: "",
  } as Script,

  SUDTTypeDep: {
    outPoint: {
      txHash:
        "0xc7813f6a415144643970c2e88e0bb6ca6a8edc5dd7c1022746f628284a9936d5",
      index: "0x0",
    },
    depType: "code",
  } as CellDep,

  SporeTypeScript: {
    codeHash:
      "0x4a4dce1df3dffff7f8b2cd7dff7303df3b6150c9788cb75dcf6747247132b9f5",
    hashType: "data1",
    args: "",
  } as Script,

  SporeTypeDep: {
    outPoint: {
      txHash:
        "0x96b198fb5ddbd1eed57ed667068f1f1e55d07907b4c0dbd38675a69ea1b69824",
      index: "0x0",
    },
    depType: "code",
  } as CellDep,

  MNftTypeScript: {
    codeHash:
      "0x2b24f0d644ccbdd77bbf86b27c8cca02efa0ad051e447c212636d9ee7acaaec9",
    hashType: "type",
    args: "",
  } as Script,

  MNftTypeDep: {
    outPoint: {
      txHash:
        "0x5dce8acab1750d4790059f22284870216db086cb32ba118ee5e08b97dc21d471",
      index: "0x2",
    },
    depType: "code",
  } as CellDep,

  UniqueCellTypeScript: {
    codeHash:
      "0x2c8c11c985da60b0a330c61a85507416d6382c130ba67f0c47ab071e00aec628",
    hashType: "data1",
    args: "",
  } as Script,

  UniqueCellTypeDep: {
    outPoint: {
      txHash:
        "0x67524c01c0cb5492e499c7c7e406f2f9d823e162d6b0cf432eacde0c9808c2ad",
      index: "0x0",
    },
    depType: "code",
  } as CellDep,

  InscriptionInfoTypeScript: {
    codeHash:
      "0x5c33fc69bd72e895a63176147c6ab0bb5758d1c7a32e0914f99f9ec1bed90d41",
    hashType: "type",
    args: "",
  } as CKBComponents.Script,

  InscriptionInfoDep: {
    outPoint: {
      txHash:
        "0x1ae1ba691d00525c17b262126576ca5d41b9c6bc09e94038ec26570d0b3f0219",
      index: "0x0",
    },
    depType: "code",
  } as CKBComponents.CellDep,
};


export const getCotaTypeScript = (isMainnet: boolean) =>
  isMainnet ? MainnetInfo.CotaTypeScript : TestnetInfo.CotaTypeScript;

export const getXudtTypeScript = (isMainnet: boolean) =>
  isMainnet ? MainnetInfo.XUDTTypeScript : TestnetInfo.XUDTTypeScript;

export const getSporeTypeScript = (isMainnet: boolean) => {
  const config = isMainnet?predefinedSporeConfigs.Mainnet:predefinedSporeConfigs.Testnet;
  const findV2 = config?.scripts?.Spore.versions.find((item)=>item.tags.includes("v2"))

  return findV2?.script;
}


export const getXudtDep = (isMainnet: boolean) =>
    isMainnet ? MainnetInfo.XUDTTypeDep : TestnetInfo.XUDTTypeDep;

export const getSudtTypeScript = (isMainnet: boolean) =>
    isMainnet ? MainnetInfo.SUDTTypeScript : TestnetInfo.SUDTTypeScript;
export const getSudtDep = (isMainnet: boolean) =>
    isMainnet ? MainnetInfo.SUDTTypeDep : TestnetInfo.SUDTTypeDep;



