import {  predefinedSporeConfigs, SporeConfig } from '@spore-sdk/core';

const sporeConfig: SporeConfig = import.meta.env.VITE_ENV_PARAM === 'development' ?  predefinedSporeConfigs.Testnet : predefinedSporeConfigs.Mainnet;
// initializeConfig(sporeConfig.lumos);
// setSporeConfig(sporeConfig);
export {
  sporeConfig,
};
