import { createSlice } from '@reduxjs/toolkit';

interface AssetsState {
  assets: Array<any>; 
}

const initialState: AssetsState = {
  assets: [],
};

export const assetsSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    setAssets: (state, action) => {
      state.assets = action.payload;
    },
  },
});

export const { setAssets } = assetsSlice.actions;

export default assetsSlice.reducer;
