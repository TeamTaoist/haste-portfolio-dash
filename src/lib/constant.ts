import { predefined, Config } from '@ckb-lumos/config-manager';
import { SporeConfig } from '@spore-sdk/core';

const Test_CKB_RPC_URL = 'https://testnet.ckb.dev/rpc';
const Test_CKB_INDEX_URL = 'https://testnet.ckb.dev/indexer';

const Main_CKB_RPC_URL = 'https://mainnet.ckbapp.dev';
const Main_CKB_INDEX_URL = 'https://mainnet.ckbapp.dev/indexer';

export interface AppConfig {
  CKB_RPC_URL: string;
  CKB_INDEX_URL: string;

  LumosCfg: Config;

  SporeCfg: SporeConfig;
}

export const Test_Config: AppConfig = {
  CKB_RPC_URL: Test_CKB_RPC_URL,
  CKB_INDEX_URL: Test_CKB_INDEX_URL,

  LumosCfg: predefined.AGGRON4,

  SporeCfg: {
    lumos: predefined.AGGRON4,
    ckbNodeUrl: Test_CKB_RPC_URL,
    ckbIndexerUrl: Test_CKB_INDEX_URL,
    scripts: {
      Spore: {
        script: {
          codeHash:
            '0x5e063b4c0e7abeaa6a428df3b693521a3050934cf3b0ae97a800d1bc31449398',
          hashType: 'data1',
        },
        cellDep: {
          outPoint: {
            txHash:
              '0x06995b9fc19461a2bf9933e57b69af47a20bf0a5bc6c0ffcb85567a2c733f0a1',
            index: '0x0',
          },
          depType: 'code',
        },
        versions: [],
      },
      Cluster: {
        script: {
          codeHash:
            '0xbbad126377d45f90a8ee120da988a2d7332c78ba8fd679aab478a19d6c133494',
          hashType: 'data1',
        },
        cellDep: {
          outPoint: {
            txHash:
              '0xfd694382e621f175ddf81ce91ce2ecf8bfc027d53d7d31b8438f7d26fc37fd19',
            index: '0x0',
          },
          depType: 'code',
        },
        versions: [],
      },
    },
    extensions: [],
  },
};

export const Main_Config: AppConfig = {
  CKB_RPC_URL: Main_CKB_RPC_URL,
  CKB_INDEX_URL: Main_CKB_INDEX_URL,

  LumosCfg: predefined.LINA,

  SporeCfg: {
    lumos: predefined.LINA,
    ckbNodeUrl: Main_CKB_RPC_URL,
    ckbIndexerUrl: Main_CKB_INDEX_URL,
    scripts: {
      Spore: {
        script: {
          codeHash:
            '0x4a4dce1df3dffff7f8b2cd7dff7303df3b6150c9788cb75dcf6747247132b9f5',
          hashType: 'data1',
        },
        cellDep: {
          outPoint: {
            txHash:
              '0x96b198fb5ddbd1eed57ed667068f1f1e55d07907b4c0dbd38675a69ea1b69824',
            index: '0x0',
          },
          depType: 'code',
        },
        versions: [],
      },
      Cluster: {
        script: {
          codeHash:
            '0x7366a61534fa7c7e6225ecc0d828ea3b5366adec2b58206f2ee84995fe030075',
          hashType: 'data1',
        },
        cellDep: {
          outPoint: {
            txHash:
              '0xe464b7fb9311c5e2820e61c99afc615d6b98bdefbe318c34868c010cbd0dc938',
            index: '0x0',
          },
          depType: 'code',
        },
        versions: [],
      },
    },
    extensions: [],
  },
};

export const getConfig = (isMainnet: boolean) => {
  return isMainnet ? Main_Config : Test_Config;
};
