import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WalletItem {
  chain: string;
  address: string;
  walletName: string;
}

interface WalletState {
  wallets: WalletItem[]
}

const initialState: WalletState = {
  wallets: []
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    addWalletItem: (state, action: PayloadAction<WalletItem>) => {
      state.wallets.push(action.payload);
    },
  },
});

export const { addWalletItem } = walletSlice.actions;

export default walletSlice.reducer;
