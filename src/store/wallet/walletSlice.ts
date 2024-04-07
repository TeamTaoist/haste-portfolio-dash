import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface WalletItem {
  chain: string;
  address: string;
  walletName: string;
  pubKey: string;
  keyType?: string;
}

interface WalletState {
  wallets: WalletItem[],
  currentWalletAddress: string | undefined
}

const initialState: WalletState = {
  wallets: [],
  currentWalletAddress: undefined,
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    initializeWallets: (state, action: PayloadAction<WalletItem[]>) => {
      state.wallets = action.payload;
      state.currentWalletAddress = action.payload.length > 0 ? action.payload[0].address : undefined;
    },
    addWalletItem: (state, action: PayloadAction<WalletItem>) => {
      state.wallets.push(action.payload);
      localStorage.setItem('wallets', JSON.stringify(state.wallets));
      if (!state.currentWalletAddress) {
        state.currentWalletAddress = action.payload.address;
      }
    },
    removeWalletItem: (state, action: PayloadAction<string>) => {
      state.wallets = state.wallets.filter(wallet => wallet.address !== action.payload);
      localStorage.setItem('wallets', JSON.stringify(state.wallets));
      if (state.currentWalletAddress === action.payload) {
        state.currentWalletAddress = state.wallets.length > 0 ? state.wallets[0].address : undefined;
      }
    },
    setCurrentWalletAddress: (state, action:PayloadAction<string>) => {
      state.currentWalletAddress = action.payload
    }
},
});

export const { initializeWallets, addWalletItem, removeWalletItem, setCurrentWalletAddress } = walletSlice.actions;

export default walletSlice.reducer;
