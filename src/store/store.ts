import { configureStore } from '@reduxjs/toolkit';
import walletReducer from './wallet/walletSlice';
import assetsReducer from './asset/assetSlice';
import deviceReducer from './device/deviceSlice';


export const store = configureStore({
  reducer: {
    wallet: walletReducer,
    assets: assetsReducer,
    device: deviceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;