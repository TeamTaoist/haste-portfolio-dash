import { createSlice } from '@reduxjs/toolkit';

interface DeviceState {
  type: 'mobile' | 'desktop';
}

const initialState: DeviceState = {
  type: 'desktop', 
};

export const deviceSlice = createSlice({
  name: 'device',
  initialState,
  reducers: {
    setDeviceType: (state, action) => {
      state.type = action.payload;
    },
  },
});

export const { setDeviceType } = deviceSlice.actions;

export default deviceSlice.reducer;
